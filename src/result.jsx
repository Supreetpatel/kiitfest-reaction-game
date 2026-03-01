import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import gameBg from "./assets/bg2.png";
import kiitfestImg from "./assets/kiitfest-main-logo 20.png";

const TOTAL_ROUNDS = 5;

export default function Result({ currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [roundTimes, setRoundTimes] = useState(null);
  const [bestTime, setBestTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const rect37Url = encodeURI("/Rectangle 37.svg");

  function normalizeRounds(rt) {
    try {
      if (typeof rt === "string") {
        const trimmed = rt.trim();
        if (
          (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
          trimmed.startsWith('"')
        ) {
          rt = JSON.parse(rt);
        }
      }
    } catch {
      rt = null;
    }

    if (Array.isArray(rt) && rt.length === 1 && Array.isArray(rt[0]))
      rt = rt[0];
    if (!Array.isArray(rt)) return Array(TOTAL_ROUNDS).fill(null);

    const out = rt.slice(0, TOTAL_ROUNDS).map((value) => {
      if (value == null) return null;
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const numeric = Number(value);
        return Number.isNaN(numeric) ? value : numeric;
      }
      if (typeof value === "object") {
        if (typeof value.time === "number") return value.time;
        if (typeof value.value === "string") return value.value;
        return value;
      }
      return null;
    });

    while (out.length < TOTAL_ROUNDS) out.push(null);
    return out;
  }

  useEffect(() => {
    (async () => {
      const st = (location && location.state) || {};
      const params = new URLSearchParams(
        location.search || window.location.search,
      );
      const hasRoll = Boolean(params.get("roll"));
      const hasPlayedData =
        Boolean(st.played) ||
        Array.isArray(st.rounds) ||
        typeof st.bestTime === "number";

      if (!hasPlayedData && !hasRoll) {
        navigate("/game", { replace: true });
        return;
      }

      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            setLeaderboard(json.data.slice(0, 10));
          }
        }
      } catch {
        setLeaderboard(null);
      }

      if (st && (st.rounds || st.bestTime || st.roll)) {
        if (st.rounds) setRoundTimes(normalizeRounds(st.rounds));
        if (typeof st.bestTime === "number") setBestTime(st.bestTime);
        return;
      }

      const roll = params.get("roll");
      if (roll) {
        try {
          const myRes = await fetch(
            `/api/my-rounds?roll=${encodeURIComponent(roll)}`,
          );
          if (myRes.ok) {
            const payload = await myRes.json();
            if (payload && payload.rounds)
              setRoundTimes(normalizeRounds(payload.rounds));
            if (payload && typeof payload.bestTime === "number") {
              setBestTime(payload.bestTime);
            }
            return;
          }
        } catch {
          // ignore and fallback
        }
      }

      setRoundTimes(null);
      setBestTime(null);
    })();
  }, [location, navigate]);

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 30000);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  const currentKfid = useMemo(() => {
    const st = (location && location.state) || {};
    if (typeof st.kfid === "string" && st.kfid.trim()) return st.kfid.trim();
    if (
      currentUser &&
      typeof currentUser.kfid === "string" &&
      currentUser.kfid.trim()
    ) {
      return currentUser.kfid.trim();
    }
    return "--";
  }, [location, currentUser]);

  const myRank = useMemo(() => {
    if (bestTime == null) return null;
    const times = [];
    if (Array.isArray(leaderboard)) {
      leaderboard.forEach((entry) => {
        if (entry && typeof entry.bestTime === "number")
          times.push(entry.bestTime);
      });
    }
    times.push(bestTime);
    times.sort((a, b) => a - b);
    const idx = times.indexOf(bestTime);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, bestTime]);

  const numericTimes = (roundTimes || []).filter((r) => typeof r === "number");
  const avg = numericTimes.length
    ? Math.round(numericTimes.reduce((a, b) => a + b, 0) / numericTimes.length)
    : null;

  const rows = useMemo(() => {
    if (Array.isArray(leaderboard) && leaderboard.length > 0) {
      return leaderboard.map((entry, idx) => ({
        rank: idx + 1,
        kfid:
          (entry &&
            (entry.kfid || entry.rollnumber || entry.rollNo || entry.roll)) ||
          "--",
        bestTime:
          entry && typeof entry.bestTime === "number"
            ? `${Math.round(entry.bestTime)} ms`
            : "--",
      }));
    }

    return Array.from({ length: 10 }).map((_, idx) => ({
      rank: idx + 1,
      kfid: idx + 1 === (myRank || -1) ? currentKfid : "--",
      bestTime:
        idx + 1 === (myRank || -1) && typeof bestTime === "number"
          ? `${Math.round(bestTime)} ms`
          : "--",
    }));
  }, [leaderboard, myRank, currentKfid, bestTime]);

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden font-['Stardos_Stencil'] text-[#f2e6d9]"
      style={{
        backgroundImage: `url(${gameBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-flicker { animation: flicker 3.2s ease-in-out infinite; }
        .glass-panel { background: rgba(0, 0, 0, 0.58); backdrop-filter: blur(8px); border: 1px solid rgba(140, 94, 60, 0.3); }
      `}</style>

      <div className="absolute inset-0 bg-linear-to-b from-black/75 via-black/45 to-black/80" />

      <div className="relative z-10 w-full min-h-screen px-4 py-6 flex flex-col items-center">
        <div className="mb-6 anim-float">
          <img src={kiitfestImg} alt="logo" className="w-48 md:w-64 h-auto" />
        </div>

        <div className="w-full max-w-5xl glass-panel rounded-4xl p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-wider text-[#ffbf75] anim-flicker">
              GAME OVER
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-5 mb-7">
            {[
              {
                title: "MY RANK",
                value: myRank == null ? "--" : String(myRank),
              },
              {
                title: "BEST TIME",
                value: bestTime == null ? "--" : `${Math.round(bestTime)} ms`,
              },
              { title: "AVERAGE", value: avg == null ? "--" : `${avg} ms` },
            ].map((card) => (
              <div key={card.title} className="relative">
                <img
                  src={rect37Url}
                  alt={card.title}
                  className="w-full h-22 md:h-24 object-fill"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xs md:text-sm tracking-[0.28em] text-[#d9a067]/85 uppercase">
                    {card.title}
                  </div>
                  <div className="text-xl md:text-3xl font-black text-white mt-1">
                    {card.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#8c5e3c]/55 bg-black/45 overflow-hidden">
            <div className="px-5 py-3 border-b border-[#8c5e3c]/45 text-[#d9a067] text-lg md:text-2xl font-bold tracking-widest uppercase text-center">
              Leaderboard
            </div>

            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="bg-black/30 text-[#d9a067] uppercase tracking-[0.2em] text-[11px] md:text-xs">
                  <th className="py-3 px-3 text-left">Rank</th>
                  <th className="py-3 px-3 text-left">KFID</th>
                  <th className="py-3 px-3 text-right">Best Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.rank}
                    className="border-t border-[#8c5e3c]/30 hover:bg-white/5"
                  >
                    <td className="py-2.5 px-3 text-white">{row.rank}</td>
                    <td className="py-2.5 px-3 text-white">{row.kfid}</td>
                    <td className="py-2.5 px-3 text-right text-[#ffbf75]">
                      {row.bestTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
