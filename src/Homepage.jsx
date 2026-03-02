import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import screw from "./assets/screw.png";
import kiitfestImg from "./assets/kiitfest-main-logo20.png";
import bottle1 from "./assets/bottle1.png";

const ScrewButton = ({ style, animClass }) => (
  <div className="pointer-events-none absolute z-20" style={style}>
    <img
      src={screw}
      alt="Screw"
      className={`w-24 h-24 md:w-32 md:h-32 object-contain opacity-80 drop-shadow-[0_6px_8px_rgba(0,0,0,0.9)] ${animClass}`}
    />
  </div>
);

export default function Home({ currentUser }) {
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  // 1. SCREW CONTROLS
  const topScrewsY = "-12px";
  const bottomScrewsY = "-12px";
  const leftScrewsX = "-10px";
  const rightScrewsX = "-10px";

  // 2. LOGO CONTROLS
  const logoTop = "12px";
  const logoLeft = "550px";

  return (
    <div
      className="h-screen w-full text-[#f2e6d9] relative overflow-y-scroll overflow-x-hidden font-['Stardos_Stencil']"
      style={{
        backgroundImage: "url(/assets/bg2.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <style>{`
        /* THE NUCLEAR OVERRIDE */

        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes flicker {
          0%, 19.9%, 22%, 62.9%, 64%, 64.9%, 70%, 100% { opacity: 1; text-shadow: 0 0 5px rgba(207,123,68,0.4); }
          20%, 21.9%, 63%, 63.9%, 65%, 69.9% { opacity: 0.8; text-shadow: none; }
        }
        @keyframes slideUpFade { 0% { opacity: 0; transform: translateY(50px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes sweepPeriodic { 0%, 75% { transform: translateX(-150%) skewX(-15deg); } 100% { transform: translateX(250%) skewX(-15deg); } }
        
        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-flicker { animation: flicker 4s infinite alternate; }
        .btn-ready { animation: shadowPulse 2s infinite; }
        
        @keyframes shadowPulse {
           0%, 100% { box-shadow: 0 0 8px rgba(207,123,68, 0.2); }  
           50% { box-shadow: 0 0 20px rgba(207,123,68, 0.5); }
        }

        .entrance-1 { animation: slideUpFade 0.6s forwards; opacity: 0; }
        .entrance-2 { animation: slideUpFade 0.6s 0.2s forwards; opacity: 0; }
        .entrance-3 { animation: slideUpFade 0.6s 0.4s forwards; opacity: 0; }

        .float-bob-1 { animation: bob 4s ease-in-out infinite 0.6s; }
        .float-bob-2 { animation: bob 4.5s ease-in-out infinite 0.8s; }
        .float-bob-3 { animation: bob 3.5s ease-in-out infinite 1s; }

        .anim-sweep-auto::before {
          content: ''; position: absolute; top: 0; left: 0; width: 60%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent);
          transform: translateX(-150%) skewX(-15deg); animation: sweepPeriodic 6s infinite; z-index: 1; pointer-events: none;
        }
        .anim-sweep-auto:hover::before { animation: sweepPeriodic 1.5s ease-in-out infinite !important; }
      `}</style>

      <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>

      {/* KIITFest Logo */}
      <a
        href="https://kiitfest.org"
        target="_blank"
        className="absolute z-30 anim-float"
        style={{ top: logoTop, left: logoLeft }}
      >
        <img
          src={kiitfestImg}
          alt="KIITFest"
          className="h-14 md:h-16 cursor-pointer w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        />
      </a>

      {/* Spinning Screws */}
      <ScrewButton
        style={{ top: topScrewsY, left: leftScrewsX }}
        animClass="animate-spin-10"
      />
      <ScrewButton
        style={{ top: topScrewsY, right: rightScrewsX }}
        animClass="animate-spin-15"
      />
      <ScrewButton
        style={{ bottom: bottomScrewsY, left: leftScrewsX }}
        animClass="animate-spin-12"
      />
      <ScrewButton
        style={{ bottom: bottomScrewsY, right: rightScrewsX }}
        animClass="animate-spin-8"
      />

      <div className="relative z-10 flex flex-col items-center h-full px-6 py-4">
        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl">
          <h1 className="mt-8 md:mt-12 text-5xl md:text-7xl tracking-tight mb-12 text-center text-[#f2e6d9] drop-shadow-[0_4px_4px_rgba(0,0,0,1)] leading-none anim-flicker">
            REACTION TIME CHALLENGE
          </h1>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full max-w-6xl px-4">
            <div className="entrance-1 h-full">
              <div className="float-bob-1 h-full">
                <div className="anim-sweep-auto relative overflow-hidden bg-[#110a06]/80 backdrop-blur-md p-8 h-full text-center rounded-xl border border-[#8c5e3c]/40 hover:border-[#cf7b44]/70 hover:scale-[1.03] transition-all duration-500 flex items-center justify-center shadow-lg">
                  <p className="relative z-10 text-xl md:text-2xl leading-snug tracking-wide text-gray-200">
                    Test your reflexes! Press the corresponding key{" "}
                    <span className="text-[#cf7b44] font-bold">(A, S, D)</span>{" "}
                    when the bottle starts falling.
                  </p>
                </div>
              </div>
            </div>
            <div className="entrance-2 h-full">
              <div className="float-bob-2 h-full">
                <div className="anim-sweep-auto relative overflow-hidden bg-[#110a06]/80 backdrop-blur-md p-8 h-full text-center rounded-xl border border-[#8c5e3c]/40 hover:border-[#cf7b44]/70 hover:scale-[1.03] transition-all duration-500 flex items-center justify-center shadow-lg">
                  <p className="relative z-10 text-xl md:text-2xl leading-snug tracking-wide text-gray-200">
                    The faster you react, the{" "}
                    <span className="text-[#cf7b44] font-bold">
                      better your score
                    </span>
                    . Complete 5 rounds to see your ranking.
                  </p>
                </div>
              </div>
            </div>
            <div className="entrance-3 h-full">
              <div className="float-bob-3 h-full">
                <div className="anim-sweep-auto relative overflow-hidden bg-[#110a06]/80 backdrop-blur-md p-8 h-full text-center rounded-xl border border-[#8c5e3c]/40 hover:border-[#cf7b44]/70 hover:scale-[1.03] transition-all duration-500 flex items-center justify-center shadow-lg">
                  <p className="relative z-10 text-xl md:text-2xl leading-snug tracking-wide text-gray-200">
                    Missed or pressed the{" "}
                    <span className="text-[#cf7b44] font-bold">
                      wrong button
                    </span>
                    ? Don't worry, you proceed to the next round.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <label
              className={`anim-sweep-auto relative flex items-center gap-5 bg-[#0a0604]/80 backdrop-blur-md px-8 py-5 rounded-xl border transition-all duration-500 overflow-hidden shadow-xl ${
                isReady
                  ? "border-[#cf7b44]/80 scale-[1.02]"
                  : "border-[#8c5e3c]/40 hover:border-[#cf7b44]/50"
              }`}
            >
              <div className="relative flex items-center justify-center z-10 w-8 h-8">
                <input
                  type="checkbox"
                  className="peer relative w-8 h-8 appearance-none border-2 border-[#8c5e3c] rounded-md bg-black/60 checked:bg-[#cf7b44]/20 checked:border-[#cf7b44] transition-all duration-500 checked:rotate-90 cursor-pointer"
                  checked={isReady}
                  onChange={(e) => setIsReady(e.target.checked)}
                />
                <img
                  src={bottle1}
                  alt="Ready"
                  className={`absolute h-6 w-auto object-contain pointer-events-none transition-all duration-500 ${
                    isReady
                      ? "scale-100 -rotate-90 opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                />
              </div>
              <span
                className={`tracking-[0.15em] font-medium select-none transition-all duration-500 z-10 ${
                  isReady ? "text-[#cf7b44]" : "text-gray-400"
                }`}
              >
                I HAVE READ THE INSTRUCTIONS AND AM READY TO PLAY
              </span>
            </label>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                disabled={!isReady}
                onClick={() => navigate("/game")}
                className={`relative w-64 py-4 rounded-xl font-bold tracking-[0.2em] text-2xl border transition-all duration-500 overflow-hidden cursor-pointer ${
                  isReady
                    ? "bg-[#8c5e3c] text-[#f2e6d9] border-[#cf7b44] btn-ready hover:bg-[#a66a42]"
                    : "bg-gray-900 text-gray-600 opacity-70"
                }`}
              >
                START
              </button>
              <button
                onClick={() => navigate("/leaderboard")}
                className="relative w-64 py-4 rounded-xl font-bold tracking-[0.2em] text-2xl border border-[#8c5e3c]/40 text-[#d9a067] bg-black/40 hover:bg-[#8c5e3c]/20 hover:border-[#cf7b44]/70 transition-all duration-500 cursor-pointer"
              >
                LEADERBOARD
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
