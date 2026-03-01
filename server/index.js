import express from "express";
import cors from "cors";
import axios from "axios";
const app = express();
app.use(cors());
app.use(express.json());

// generate a KF id of the form 'KF' + 8 digits, ensuring uniqueness
async function generateUniqueKfId() {
  while (true) {
    const num = Math.floor(Math.random() * 1e8).toString().padStart(8, '0');
    const id = `KF${num}`;
    const exists = await prisma.user.findUnique({ where: { KFid: id } });
    if (!exists) return id;
    // else loop and try again
  }
}

// POST /api/user - upsert a user by roll
app.post("/api/user", async (req, res) => {
  try {
    const db = await withPrisma(res);
    if (!db) return;

    const { name, rollNo } = req.body;
    if (!rollNo) return res.status(400).json({ error: 'rollNo required' });
    const kfid = await generateUniqueKfId();
    const user = await prisma.user.upsert({
      where: { rollNo: Number(rollNo) },
      update: { name: name || undefined },
      create: { name: name || `Player ${rollNo}`, rollNo: Number(rollNo), KFid: kfid }
    });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

// POST /api/results
// body: { name, rollNo, bestTime }
app.post("/api/results", async (req, res) => {
  try {
    const db = await withPrisma(res);
    if (!db) return;

    const { name, rollNo, bestTime, rounds } = req.body;
    const TOTAL_ROUNDS = 5;
    if (!rollNo) return res.status(400).json({ error: "rollNo required" });
    // sanitize and normalize rounds array to fixed length
    let processedRounds = undefined;
    if (Array.isArray(rounds)) {
      processedRounds = rounds.slice(0, TOTAL_ROUNDS).map((r) => {
        if (r === null || typeof r === "undefined") return null;
        if (typeof r === "number") return Number(r);
        if (typeof r === "string") {
          const n = Number(r);
          if (!Number.isNaN(n)) return n;
          // keep known string values like 'missed'
          return r;
        }
        return String(r);
      });
      // pad with nulls if shorter
      while (processedRounds.length < TOTAL_ROUNDS) processedRounds.push(null);
    }
    // upsert user (ensure KFid on create)
    const kfid = await generateUniqueKfId();
    await prisma.user.upsert({
      where: { rollNo: Number(rollNo) },
      update: { name: name || undefined },
      create: { name: name || `Player ${rollNo}`, rollNo: Number(rollNo), KFid: kfid }
    });
    // upsert record (store processedRounds if provided)
    const rec = await db.record.upsert({
      where: { rollNo: Number(rollNo) },
      update: {
        time: Number(bestTime || 0),
        rounds: processedRounds || undefined,
        updatedAt: new Date(),
      },
      create: {
        rollNo: Number(rollNo),
        time: Number(bestTime || 0),
        rounds: processedRounds || undefined,
      },
    });
    // store each round as its own row for historical/analytic queries
    try {
      const user = await db.user.findUnique({
        where: { rollNo: Number(rollNo) },
      });
      if (user && Array.isArray(processedRounds)) {
        // upsert each round so existing rows are updated and new ones inserted
        for (const [idx, val] of processedRounds.entries()) {
          const rn = idx + 1;
          const data = {
            roundNumber: rn,
            time: typeof val === "number" ? val : null,
            value: typeof val === "string" ? val : null,
            metadata: typeof val === "object" && val !== null ? val : null,
            userId: user.id,
          };
          try {
            await db.round.upsert({
              where: {
                userId_roundNumber: { userId: user.id, roundNumber: rn },
              },
              update: {
                time: data.time,
                value: data.value,
                metadata: data.metadata,
              },
              create: data,
            });
          } catch (e) {
            console.error(
              `Failed upserting round ${rn} for user ${user.id}`,
              e,
            );
          }
        }
      }
    } catch (e) {
      console.error("Failed to persist rounds to Round table", e);
    }
    // return success
    return res.json({ ok: true, record: rec });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

// GET /api/leaderboard - returns top 10 by best time (ascending)
app.get("/api/leaderboard", async (req, res) => {
  try {
    const db = await withPrisma(res);
    if (!db) return;

    // only include users with a positive recorded time
    const rows = await db.record.findMany({
      where: { time: { gt: 0 } },
      orderBy: { time: "asc" },
      take: 10,
      include: { user: true },
    });
    const data = rows.map((r, idx) => ({
      rank: idx + 1,
      name: r.user?.name || "--",
      rollnumber: r.rollNo,
      bestTime: typeof r.time === "number" ? r.time : null,
      rounds: r.rounds || null,
    }));
    return res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

// GET /api/my-rounds?roll=123
app.get("/api/my-rounds", async (req, res) => {
  try {
    const db = await withPrisma(res);
    if (!db) return;

    const TOTAL_ROUNDS = 5;
    const roll = Number(req.query.roll || 0);
    if (!roll) return res.status(400).json({ error: "roll query required" });
    // prefer fetching per-round rows from Round table
    const user = await db.user.findUnique({ where: { rollNo: roll } });
    if (!user) return res.json({ ok: true, rounds: null, bestTime: null });
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
      // fallback to legacy record JSON field
      const rec = await db.record.findUnique({ where: { rollNo: roll } });
      if (rec && Array.isArray(rec.rounds)) {
        roundsOut = rec.rounds.slice(0, TOTAL_ROUNDS);
        while (roundsOut.length < TOTAL_ROUNDS) roundsOut.push(null);
      }
    }
    const rec = await db.record.findUnique({ where: { rollNo: roll } });
    return res.json({
      ok: true,
      rounds: roundsOut || null,
      bestTime: rec?.time || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
