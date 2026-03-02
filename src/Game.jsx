import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGame from "./hooks/useGame";

const KEYS = ["a", "s", "d"];
const TOTAL_ROUNDS = 5;

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
    return Array(TOTAL_ROUNDS).fill(null);
  }

  if (Array.isArray(rt) && rt.length === 1 && Array.isArray(rt[0])) rt = rt[0];
  if (!Array.isArray(rt)) return Array(TOTAL_ROUNDS).fill(null);

  const out = rt.slice(0, TOTAL_ROUNDS).map((v) => {
    if (v == null) return null;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
      return v;
    }
    if (typeof v === "object") {
      if (typeof v.time === "number") return v.time;
      if (typeof v.value === "string") return v.value;
      return v;
    }
    return null;
  });

  while (out.length < TOTAL_ROUNDS) out.push(null);
  return out;
}

const App = ({ currentUser }) => {
  const navigate = useNavigate();

  const bgUrl = encodeURI("/Screenshot 2026-02-22 145019 2.svg");
  const rectUrl = encodeURI("/Rectangle 28.svg");
  const innerRectUrl = encodeURI("/Rectangle 32.svg");
  const screwUrl = encodeURI("/Clip path group.svg");
  const buttonUrl = encodeURI("/Rectangle 35.svg");
  const bottleUrl = encodeURI("/Clip path group (1).svg");
  const logoUrl = encodeURI("/kiitfest-main-logo 3.svg");
  const rect29Url = encodeURI("/Rectangle 29.svg");

  const innerScale = 0.5;
  const screwSize = 64;
  const BASE_FALL = 500;
  const bottleWidth = 360;

  const [canViewResults, setCanViewResults] = useState(false);
  const [scale, setScale] = useState(1);
  const pressedKeysRef = useRef(new Set());
  const pressedMouseKeysRef = useRef(new Set());
  const currentKfid =
    currentUser && typeof currentUser.kfid === "string"
      ? currentUser.kfid.trim().toUpperCase()
      : "";

  const {
    activeKey,
    setActiveKey,
    gameFinished,
    level,
    awaitingStart,
    dropKey,
    lastTime,
    lastMissed,
    bestTime,
    roundTimes,
    lastRoll,
    setLastRoll,
    bottleResetCount,
    timeToNextDrop,
    forceMiss,
    handleInput,
    setRoundTimes,
  } = useGame({
    TOTAL_ROUNDS,
    MIN_WAIT: 3000,
    MAX_WAIT: 3000,
    onFinish: (newRounds, computedBest) => {
      void persistResults(newRounds, computedBest);
      setCanViewResults(true);
      navigate("/result", {
        state: {
          rounds: newRounds,
          bestTime: computedBest,
          kfid: currentKfid || lastRoll || "",
          name: currentUser?.name || "",
          played: true,
        },
      });
    },
  });

  useEffect(() => {
    const handleResize = () => {
      // 1150 accounts for a comfortable gap at the bottom for laptops
      const scaleY = window.innerHeight / 1150;
      const scaleX = window.innerWidth / 1550;
      setScale(Math.min(1, scaleX, scaleY));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const pressedKeys = pressedKeysRef.current;

    const onKeyDown = (event) => {
      const key = String(event.key).toLowerCase();
      if (!KEYS.includes(key)) return;

      if (event.repeat) return;

      pressedKeys.add(key);

      if (pressedKeys.size >= 2) {
        setActiveKey(null);
        forceMiss();
        return;
      }

      setActiveKey(key);
      handleInput(key);
    };

    const onKeyUp = (event) => {
      const key = String(event.key).toLowerCase();
      if (!KEYS.includes(key)) return;

      pressedKeys.delete(key);
      const remaining = Array.from(pressedKeys);
      setActiveKey(remaining.length === 1 ? remaining[0] : null);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      pressedKeys.clear();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [forceMiss, handleInput, setActiveKey]);

  const handleMouseDownKey = (key) => {
    const pressedMouseKeys = pressedMouseKeysRef.current;
    pressedMouseKeys.add(key);

    if (pressedMouseKeys.size >= 2) {
      setActiveKey(null);
      forceMiss();
      return;
    }

    setActiveKey(key);
  };

  const handleMouseUpKey = (key) => {
    const pressedMouseKeys = pressedMouseKeysRef.current;
    pressedMouseKeys.delete(key);
    const remaining = Array.from(pressedMouseKeys);
    setActiveKey(remaining.length === 1 ? remaining[0] : null);
  };

  async function persistResults(newRounds, computedBest) {
    const kfid = currentKfid || lastRoll || "";
    if (!kfid) return;

    try {
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kfid,
          name: currentUser?.name || "",
          bestTime: computedBest,
          rounds: newRounds,
        }),
      });

      try {
        setLastRoll(String(kfid));
        const response = await fetch(
          "/api/my-rounds?kfid=" + encodeURIComponent(kfid)
        );
        if (response.ok) {
          const payload = await response.json();
          if (payload && payload.rounds) {
            setRoundTimes(normalizeRounds(payload.rounds));
          }
        }
      } catch (error) {
        console.error("Failed refreshing rounds after save", error);
      }
    } catch (error) {
      console.error("Failed to persist results", error);
    }
  }

  useEffect(() => {
    const kfid = currentKfid || lastRoll || "";
    if (!kfid) return;

    (async () => {
      try {
        const response = await fetch(
          "/api/my-rounds?kfid=" + encodeURIComponent(kfid)
        );
        if (response.ok) {
          const payload = await response.json();
          if (payload && payload.rounds) {
            setRoundTimes(normalizeRounds(payload.rounds));
          }
        }
      } catch (error) {
        console.error("Failed loading rounds for lastRoll", error);
      }
    })();
  }, [currentKfid, lastRoll, setRoundTimes]);

  useEffect(() => {
    const pressedMouseKeys = pressedMouseKeysRef.current;
    return () => {
      pressedMouseKeys.clear();
    };
  }, []);

  const boxes = [
    {
      left: -500,
      top: 0,
      width: 500,
      height: 169,
      label: "Round",
      value: String(level),
    },
    {
      left: -500,
      top: 200,
      width: 500,
      height: 169,
      label: "Time",
      value: lastMissed
        ? "MISSED"
        : lastTime == null
        ? "--"
        : `${Math.round(lastTime)} ms`,
    },
  ];

  const displayRounds = (() => {
    const normalized = normalizeRounds(roundTimes);
    return Array.from({ length: TOTAL_ROUNDS }).map((_, index) =>
      normalized[index] != null ? normalized[index] : null
    );
  })();

  return (
    <>
      <style>{`@keyframes fall { from { transform: translateX(-50%) translateY(0); } to { transform: translateX(-50%) translateY(var(--fall-distance,260px)); } }`}</style>
      <div
        style={{
          minHeight: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          backgroundImage: `url(${bgUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.75) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "relative",
            width: 1508,
            height: 958,
            margin: "0",
            zIndex: 2,
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 75,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "10px 24px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.45)",
              color: "#ffbf75",
              border: "1px solid rgba(255,191,117,0.35)",
              fontFamily:
                "Stardos Stencil, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: 1,
              boxShadow: "0 8px 18px rgba(0,0,0,0.4)",
              zIndex: 8,
            }}
          >
            {awaitingStart
              ? "PRESS ANY KEY TO START GAME"
              : `TIME BETWEEN ROUNDS: ${
                  timeToNextDrop == null
                    ? "3.0 s"
                    : `${(timeToNextDrop / 1000).toFixed(1)} s`
                }`}
          </div>

          {boxes.map((box, index) => {
            const innerWidth = Math.round((box.width - 40) * innerScale);
            const innerHeight = Math.round((box.height - 36) * innerScale);

            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  overflow: "hidden",
                  cursor: "default",
                }}
              >
                <img
                  src={rectUrl}
                  alt={`box-${index}`}
                  style={{ width: "100%", height: "100%", display: "block" }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 25,
                    transform: "translateX(-50%)",
                    color: "#CC8458",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 800,
                      margin: 0,
                      padding: 0,
                      textAlign: "center",
                    }}
                  >
                    {String(box.label).trim()}
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: "51%",
                    transform: "translateX(-50%)",
                    bottom: 30,
                    width: innerWidth,
                    height: innerHeight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    pointerEvents: "none",
                  }}
                >
                  <img
                    src={innerRectUrl}
                    alt={`inner-${index}`}
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      color: "#8B5A2B",
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {box.value}
                  </div>
                </div>

                <img
                  src={screwUrl}
                  alt={`screw-tl-${index}`}
                  style={{
                    position: "absolute",
                    left: 60,
                    top: 6,
                    width: screwSize,
                    height: screwSize,
                    pointerEvents: "none",
                  }}
                />
                <img
                  src={screwUrl}
                  alt={`screw-tr-${index}`}
                  style={{
                    position: "absolute",
                    left: box.width - screwSize - 60,
                    top: 6,
                    width: screwSize,
                    height: screwSize,
                    pointerEvents: "none",
                  }}
                />
                <img
                  src={screwUrl}
                  alt={`screw-bl-${index}`}
                  style={{
                    position: "absolute",
                    left: 60,
                    top: box.height - screwSize - 18,
                    width: screwSize,
                    height: screwSize,
                    pointerEvents: "none",
                  }}
                />
                <img
                  src={screwUrl}
                  alt={`screw-br-${index}`}
                  style={{
                    position: "absolute",
                    left: box.width - screwSize - 60,
                    top: box.height - screwSize - 18,
                    width: screwSize,
                    height: screwSize,
                    pointerEvents: "none",
                  }}
                />
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 700,
              display: "flex",
              gap: 300,
            }}
          >
            {KEYS.map((key) => {
              const isActive = activeKey === key;
              const isDropping = dropKey === key;
              const pressOffset = isActive ? -6 : 0;
              const fallDuration = Math.max(300, BASE_FALL - (level - 1) * 30);
              const fallDistance = 600;
              const bottleTransform = `translateX(-50%) translateY(${pressOffset}px)`;

              return (
                <div
                  key={key}
                  style={{ position: "relative", width: 120, height: 120 }}
                >
                  <button
                    onMouseDown={() => handleMouseDownKey(key)}
                    onMouseUp={() => handleMouseUpKey(key)}
                    onMouseLeave={() => handleMouseUpKey(key)}
                    onClick={() => handleInput(key)}
                    aria-label={`key-${key}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      background: `url(${buttonUrl}) no-repeat center/100% 100%`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transform: isActive ? "scale(0.95)" : "none",
                      transition: "transform 80ms ease",
                      fontFamily:
                        "Stardos Stencil, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
                      fontSize: 40,
                      fontWeight: 800,
                      color: "#8B5A2B",
                    }}
                  >
                    {key.toUpperCase()}
                  </button>

                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "100%",
                      width: 2,
                      height: 58,
                      transform: "translateX(-50%)",
                      background:
                        "linear-gradient(180deg, rgba(214,174,136,0.95) 0%, rgba(173,132,92,0.7) 100%)",
                      boxShadow: "0 0 4px rgba(0,0,0,0.4)",
                      pointerEvents: "none",
                    }}
                  />

                  <img
                    key={`${key}-${bottleResetCount}`}
                    src={bottleUrl}
                    alt={`bottle-${key}`}
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: bottleTransform,
                      width: bottleWidth,
                      height: "auto",
                      marginTop: 20,
                      pointerEvents: "none",
                      transition: "none",
                      animation: gameFinished
                        ? "none"
                        : isDropping
                        ? `fall ${fallDuration}ms linear forwards`
                        : "none",
                      ["--fall-distance"]: `${fallDistance}px`,
                    }}
                  />
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% + 260px)",
                height: 6,
                background: "transparent",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
          </div>
        </div>

        <div
          style={{
            position: "fixed",
            right: 11,
            top: 12,
            zIndex: 9998,
            width: 370,
            transform: `scale(${Math.max(0.75, scale)})`,
            transformOrigin: "top right",
            pointerEvents: "none",
            height: "auto",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              display: "block",
              border: "2px solid rgba(139,90,43,0.15)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <img
              src={rect29Url}
              alt="round-times"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                left: 30,
                right: 50,
                top: 40,
                bottom: 18,
                color: "#8B5A2B",
                fontWeight: 700,
                textAlign: "left",
                fontSize: 18,
                pointerEvents: "auto",
                fontFamily:
                  "Stardos Stencil, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
                lineHeight: "0.5",
                overflow: "hidden",
              }}
            >
              <div
                style={{ fontSize: 25, marginBottom: 6, textAlign: "center" }}
              >
                Round results
              </div>
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}
              >
                {Array.from({ length: TOTAL_ROUNDS }).map((_, index) => {
                  const raw = displayRounds[index];
                  let text = "--";

                  if (raw == null) text = "--";
                  else if (typeof raw === "number")
                    text = `${Math.round(raw)} ms`;
                  else if (typeof raw === "string")
                    text = raw === "missed" ? "MISSED" : raw;
                  else if (typeof raw === "object" && raw !== null) {
                    if (typeof raw.time === "number")
                      text = `${Math.round(raw.time)} ms`;
                    else if (typeof raw.value === "string") text = raw.value;
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 10px",
                        borderRadius: 6,
                        boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>Round {index + 1}</div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: text === "MISSED" ? "#cc4444" : "#8B5A2B",
                        }}
                      >
                        {text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <img
          src={logoUrl}
          alt="kiitfest-logo"
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 200,
            transform: `scale(${Math.max(0.75, scale)})`,
            transformOrigin: "bottom right",
            height: "auto",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />

        {gameFinished && canViewResults && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              top: "40%",
              transform: "translateX(-50%)",
              zIndex: 10000,
            }}
          >
            <button
              onClick={async () => {
                try {
                  await persistResults(roundTimes, bestTime);
                } catch (error) {
                  console.error(
                    "Failed persisting before result navigation",
                    error
                  );
                }

                try {
                  navigate("/result", {
                    state: {
                      rounds: roundTimes,
                      bestTime,
                      kfid: currentKfid || lastRoll || "",
                      name: currentUser?.name || "",
                      played: true,
                    },
                  });
                } catch (error) {
                  console.error("Primary navigation failed", error);
                }
              }}
              style={{
                padding: "14px 20px",
                fontSize: 18,
                borderRadius: 8,
                background: "#8B5A2B",
                color: "white",
                border: "none",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              View Result
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default App;
