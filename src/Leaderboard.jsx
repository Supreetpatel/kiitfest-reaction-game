import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import kiitfestImg from "./assets/kiitfest-main-logo20.png";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            console.log("data: ",json)
            setLeaderboard(json.data.slice(0, 10));
          }
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const rows =
    leaderboard.length > 0
      ? leaderboard.map((entry, idx) => ({
          rank: idx + 1,
          name: entry.name || "--",
          bestTime:
            entry.bestTime != null ? `${Math.round(entry.bestTime)} ms` : "--",
        }))
      : Array.from({ length: 10 }).map((_, idx) => ({
          rank: idx + 1,
          name: "--",
          bestTime: "--",
        }));

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden font-['Stardos_Stencil'] text-[#f2e6d9]"
      style={{
        backgroundImage: "url(/assets/bg2.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .glass-panel { background: rgba(0, 0, 0, 0.58); backdrop-filter: blur(8px); border: 1px solid rgba(140, 94, 60, 0.3); }
      `}</style>

      <div className="absolute inset-0 bg-linear-to-b from-black/75 via-black/45 to-black/80" />

      <div className="relative z-10 w-full min-h-screen px-4 py-6 flex flex-col items-center">
        <div className="mb-6 anim-float">
          <img
            src={kiitfestImg}
            alt="logo"
            className="w-48 md:w-64 h-auto cursor-pointer"
            onClick={() => navigate("/home")}
          />
        </div>

        <div className="w-full max-w-5xl glass-panel rounded-4xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-[#8c5e3c]/50 rounded-lg text-[#d9a067] hover:bg-[#8c5e3c]/20 transition-colors cursor-pointer tracking-widest"
            >
              &larr; BACK
            </button>
            <h1 className="text-3xl md:text-5xl font-black tracking-wider text-[#ffbf75]">
              LEADERBOARD
            </h1>
            <div className="w-[100px]"></div>
          </div>

          <div className="rounded-2xl border border-[#8c5e3c]/55 bg-black/45 overflow-hidden">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="bg-black/30 text-[#d9a067] uppercase tracking-[0.2em] text-[11px] md:text-xs">
                  <th className="py-3 px-3 text-left">Rank</th>
                  <th className="py-3 px-3 text-left">Name</th>
                  <th className="py-3 px-3 text-right">Best Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.rank}
                    className="border-t border-[#8c5e3c]/30 hover:bg-white/5"
                  >
                    <td className="py-2.5 px-3 text-white font-bold">
                      {row.rank}
                    </td>
                    <td className="py-2.5 px-3 text-white tracking-widest">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#ffbf75] font-bold">
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
