import express from "express";
import cors from "cors";
import axios from "axios";

const PAYMENT_VALIDATE_URL = process.env.PAYMENT_VALIDATE_URL;
const PAYMENT_NOT_DONE_REGEX =
  /(payment.*not.*done|not paid|payment.*pending|unpaid)/i;

const app = express();
app.use(cors());
app.use(express.json());

let prisma = null;
let prismaInitTried = false;
let prismaInitError = null;

const ensurePrisma = async () => {
  if (prisma) return prisma;
  if (prismaInitTried && prismaInitError) return null;

  prismaInitTried = true;
  try {
    const prismaModule = await import("@prisma/client");
    const PrismaClient =
      prismaModule?.PrismaClient || prismaModule?.default?.PrismaClient;

    if (!PrismaClient) throw new Error("PrismaClient export not found.");

    prisma = new PrismaClient();
    prismaInitError = null;
    console.log("[db] Prisma client initialized");
    return prisma;
  } catch (error) {
    prismaInitError = error;
    console.error("[db] Prisma initialization failed", {
      message: error?.message || "Unknown Prisma error",
    });
    return null;
  }
};

const withPrisma = async (res) => {
  const db = await ensurePrisma();
  if (db) return db;

  res.status(503).json({
    success: false,
    code: "DATABASE_UNAVAILABLE",
    message:
      "Database service unavailable. Run `npm run prisma:generate` and restart server.",
  });
  return null;
};

const normalizeKfid = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
};

const kfidFromLegacyRoll = (value) => {
  if (value == null) return "";
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return "";
  return `KF${text.padStart(8, "0")}`;
};

const resolveKfid = ({ kfid, rollNo, roll }) => {
  const direct = normalizeKfid(kfid);
  if (direct) return direct;

  const fromRollNo = kfidFromLegacyRoll(rollNo);
  if (fromRollNo) return fromRollNo;

  const fromRoll = kfidFromLegacyRoll(roll);
  if (fromRoll) return fromRoll;

  return "";
};

const normalizeRounds = (rounds, totalRounds = 5) => {
  if (!Array.isArray(rounds)) return null;

  const out = rounds.slice(0, totalRounds).map((r) => {
    if (r === null || typeof r === "undefined") return null;
    if (typeof r === "number") return Number(r);
    if (typeof r === "string") {
      const n = Number(r);
      if (!Number.isNaN(n)) return n;
      return r;
    }
    return String(r);
  });

  while (out.length < totalRounds) out.push(null);
  return out;
};

const sendError = (res, status, code, message, extra = {}) => {
  return res.status(status).json({
    success: false,
    code,
    message,
    ...extra,
  });
};

const resolveUpstreamMessage = (payload) => {
  if (!payload) return "Payment validation failed";
  if (typeof payload === "string") return payload;
  return payload?.message || payload?.error || "Payment validation failed";
};

const isPaymentNotCompleted = (payload) => {
  const message = resolveUpstreamMessage(payload);
  return PAYMENT_NOT_DONE_REGEX.test(String(message || ""));
};

app.post("/api/validate", async (req, res) => {
  try {
    const kfid = normalizeKfid(req?.body?.kfid);

    if (!kfid || !/^KF\d{8}$/.test(kfid)) {
      return sendError(
        res,
        400,
        "INVALID_KFID_FORMAT",
        "Invalid KFID format. Use KF followed by 8 digits.",
      );
    }

    if (!PAYMENT_VALIDATE_URL) {
      return sendError(
        res,
        500,
        "VALIDATION_API_NOT_CONFIGURED",
        "Validation API is not configured. Set PAYMENT_VALIDATE_URL in environment variables.",
      );
    }

    const { data } = await axios.post(
      PAYMENT_VALIDATE_URL,
      { kfid },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 12000,
      },
    );

    if (data?.success === false && isPaymentNotCompleted(data)) {
      return res.status(402).json({
        ...data,
        success: false,
        code: "PAYMENT_NOT_COMPLETED",
        message: data?.message || "Payment is not completed for this KFID.",
      });
    }

    if (data?.success === false) {
      return res.status(400).json({
        ...data,
        success: false,
        code: data?.code || "VALIDATION_FAILED",
        message: resolveUpstreamMessage(data),
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    const upstreamStatus = error?.response?.status;
    const upstreamData = error?.response?.data;
    const networkCode = error?.code;

    if (
      upstreamData &&
      (isPaymentNotCompleted(upstreamData) ||
        upstreamStatus === 402 ||
        upstreamStatus === 403)
    ) {
      return sendError(
        res,
        402,
        "PAYMENT_NOT_COMPLETED",
        resolveUpstreamMessage(upstreamData),
      );
    }

    if (upstreamData) {
      return sendError(
        res,
        400,
        "VALIDATION_FAILED",
        resolveUpstreamMessage(upstreamData),
      );
    }

    if (
      networkCode === "ECONNABORTED" ||
      networkCode === "ENOTFOUND" ||
      networkCode === "ECONNREFUSED"
    ) {
      return sendError(
        res,
        503,
        "VALIDATION_SERVICE_UNREACHABLE",
        "Validation service unreachable. Please check internet/server and try again.",
      );
    }

    return sendError(
      res,
      500,
      "INTERNAL_VALIDATION_ERROR",
      error?.message || "Payment validation failed",
    );
  }
});

app.post("/api/user", async (req, res) => {
  try {
    const db = await withPrisma(res);
    if (!db) return;

    const kfid = resolveKfid(req.body || {});
    if (!kfid || !/^KF\d{8}$/.test(kfid)) {
      return sendError(res, 400, "INVALID_KFID_FORMAT", "Valid KFID required.");
    }

    const user = await db.user.upsert({
      where: { KFid: kfid },
      update: {},
      create: { KFid: kfid },
    });

    return res.json({ ok: true, user: { id: user.id, kfid: user.KFid } });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      "INTERNAL_USER_API_ERROR",
      "Server error while creating user.",
    );
  }
});

app.post("/api/results", async (req, res) => {
  try {
    const db = await withPrisma(res);
    if (!db) return;

    const TOTAL_ROUNDS = 5;
    const { bestTime, rounds } = req.body || {};
    const kfid = resolveKfid(req.body || {});

    if (!kfid || !/^KF\d{8}$/.test(kfid)) {
      return sendError(res, 400, "INVALID_KFID_FORMAT", "Valid KFID required.");
    }

    const processedRounds = normalizeRounds(rounds, TOTAL_ROUNDS);

    const user = await db.user.upsert({
      where: { KFid: kfid },
      update: {},
      create: { KFid: kfid },
    });

    const timeValue = Number(bestTime || 0);

    const rec = await db.record.upsert({
      where: { userId: user.id },
      update: {
        time: timeValue,
        rounds: processedRounds || undefined,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        time: timeValue,
        rounds: processedRounds || undefined,
      },
    });

    if (Array.isArray(processedRounds)) {
      for (const [index, val] of processedRounds.entries()) {
        const roundNumber = index + 1;
        const data = {
          userId: user.id,
          roundNumber,
          time: typeof val === "number" ? val : null,
          value: typeof val === "string" ? val : null,
          metadata: typeof val === "object" && val !== null ? val : null,
        };

        try {
          await db.round.upsert({
            where: {
              userId_roundNumber: { userId: user.id, roundNumber },
            },
            update: {
              time: data.time,
              value: data.value,
              metadata: data.metadata,
            },
            create: data,
          });
        } catch (error) {
          console.error(
            `Failed upserting round ${roundNumber} for user ${user.id}`,
            error,
          );
        }
      }
    }

    return res.json({
      ok: true,
      kfid: user.KFid,
      bestTime: rec.time,
      record: rec,
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      "INTERNAL_RESULTS_API_ERROR",
      "Server error while saving results.",
    );
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const db = await withPrisma(res);
    if (!db) return;

    const rows = await db.record.findMany({
      where: { time: { gt: 0 } },
      orderBy: { time: "asc" },
      take: 10,
      include: { user: true },
    });

    const data = rows.map((r, idx) => ({
      rank: idx + 1,
      kfid: r.user?.KFid || "--",
      bestTime: typeof r.time === "number" ? r.time : null,
      rounds: r.rounds || null,
    }));

    return res.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      "INTERNAL_LEADERBOARD_API_ERROR",
      "Server error while loading leaderboard.",
    );
  }
});

app.get("/api/my-rounds", async (req, res) => {
  try {
    const db = await withPrisma(res);
    if (!db) return;

    const TOTAL_ROUNDS = 5;
    const kfid = resolveKfid({
      kfid: req.query.kfid,
      roll: req.query.roll,
      rollNo: req.query.rollNo,
    });

    if (!kfid) {
      return sendError(res, 400, "MISSING_KFID_QUERY", "kfid query required");
    }

    const user = await db.user.findUnique({ where: { KFid: kfid } });
    if (!user)
      return res.json({ ok: true, kfid, rounds: null, bestTime: null });

    const roundsRows = await db.round.findMany({
      where: { userId: user.id },
      orderBy: { roundNumber: "asc" },
    });

    let roundsOut = null;
    if (Array.isArray(roundsRows) && roundsRows.length > 0) {
      roundsOut = roundsRows
        .slice(0, TOTAL_ROUNDS)
        .map((r) => (r.time === null ? r.value : r.time));
      while (roundsOut.length < TOTAL_ROUNDS) roundsOut.push(null);
    } else {
      const rec = await db.record.findUnique({ where: { userId: user.id } });
      if (rec && Array.isArray(rec.rounds)) {
        roundsOut = rec.rounds.slice(0, TOTAL_ROUNDS);
        while (roundsOut.length < TOTAL_ROUNDS) roundsOut.push(null);
      }
    }

    const rec = await db.record.findUnique({ where: { userId: user.id } });

    let rank = null;
    if (rec && typeof rec.time === "number" && rec.time > 0) {
      const betterCount = await db.record.count({
        where: { time: { gt: 0, lt: rec.time } },
      });
      rank = betterCount + 1;
    }

    return res.json({
      ok: true,
      kfid,
      rounds: roundsOut || null,
      bestTime: rec?.time || null,
      rank,
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      "INTERNAL_ROUNDS_API_ERROR",
      "Server error while loading rounds.",
    );
  }
});

const PORT = process.env.PORT || 4001;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
