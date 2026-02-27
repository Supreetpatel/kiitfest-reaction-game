import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useGame from './hooks/useGame';

const App = () => {
  const bgRaw = '/Screenshot 2026-02-22 145019 2.svg';
  const rectRaw = '/Rectangle 28.svg';
  const innerRectRaw = '/Rectangle 32.svg';
  const bgUrl = encodeURI(bgRaw);
  const rectUrl = encodeURI(rectRaw);
  const innerRectUrl = encodeURI(innerRectRaw);
  const innerScale = 0.5; // scale factor for inner rectangle sizing (reduced further)
  const screwRaw = '/Clip path group.svg';
  const screwUrl = encodeURI(screwRaw);
  const screwSize = 64; // px
  const buttonRaw = '/Rectangle 35.svg';
  const buttonUrl = encodeURI(buttonRaw);
  const bottleRaw = '/Clip path group (1).svg';
  const bottleUrl = encodeURI(bottleRaw);
  const logoRaw = '/kiitfest-main-logo 3.svg';
  const logoUrl = encodeURI(logoRaw);
  const rect29Raw = '/Rectangle 29.svg';
  const rect29Url = encodeURI(rect29Raw);
  const TOTAL_ROUNDS = 5;
  const BASE_FALL = 500;
  const [canViewResults, setCanViewResults] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [resultNavigationState, setResultNavigationState] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerRoll, setPlayerRoll] = useState('');
  const {
    activeKey,
    setActiveKey,
    gameRunning,
    gameFinished,
    level,
    awaitingStart,
    startPrompt,
    dropKey,
    dropStart,
    lastTime,
    lastMissed,
    bestTime,
    roundTimes,
    lastRoll,
    setLastRoll,
    bottleResetCount,
    timeToNextDrop,
    startGame,
    stopGame,
    handleInput,
    setAwaitingStart,
    setStartPrompt,
    setRoundTimes,
    setBestTime
  } = useGame({ TOTAL_ROUNDS, onFinish: (newRounds, computedBest) => {
    try { persistResults(newRounds, computedBest); } catch (e) {}
    setCanViewResults(true);
    // stash navigation state so result page can show the just-completed rounds immediately
    setResultNavigationState({ rounds: newRounds, bestTime: computedBest, roll: playerRoll || lastRoll || '' });
    setShouldNavigate(true);
  } });

  // register global key handlers and forward to `handleInput` from the hook
  const keys = ['a', 's', 'd'];
  useEffect(() => {
    const onKeyDown = (e) => {
      const k = String(e.key).toLowerCase();
      if (keys.includes(k)) {
        setActiveKey(k);
        handleInput(k);
      }
    };
    const onKeyUp = () => setActiveKey(null);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleInput, setActiveKey]);

  // On mount, if there's a stored roll from a previous session, try to load rounds from the server
  // on mount we don't rely on local storage; the user must save their roll to load rounds

  // helper to save player info
  const savePlayerInfo = async (name, roll) => {
    // persist player to Postgres via new endpoint and then load rounds
    try {
      if (!roll) return;
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || `Player ${roll}`, rollNo: roll })
      });
      if (res.ok) {
        setPlayerName(name || '');
        setPlayerRoll(String(roll || ''));
        setLastRoll(String(roll));
        fetchRoundsFromServer(String(roll));
      }
    } catch (e) {
      // ignore errors; keep in-memory state
      setPlayerName(name || '');
      setPlayerRoll(String(roll || ''));
      setLastRoll(String(roll));
    }
  };

  // fetch rounds for a roll from backend and update state
  async function fetchRoundsFromServer(roll) {
    if (!roll) return;
    try {
      const res = await fetch('/api/my-rounds?roll=' + encodeURIComponent(roll));
      if (!res.ok) return;
      const j = await res.json();
      if (j && j.rounds) {
        setRoundTimes(normalizeRounds(j.rounds));
      }
    } catch (e) {
      // ignore errors and keep local state
    }
  }

  const navigate = useNavigate();
  useEffect(() => {
    if (shouldNavigate) {
      setShouldNavigate(false);
      const state = resultNavigationState || { rounds: roundTimes, bestTime };
      setResultNavigationState(null);
      navigate('/result', { state });
    }
  }, [shouldNavigate, navigate]);

  // normalize round arrays coming from server/localStorage
  function normalizeRounds(rt) {
    try {
      if (typeof rt === 'string') {
        const trimmed = rt.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.startsWith('\"')) {
          rt = JSON.parse(rt);
        }
      }
    } catch (e) {
      // ignore parse
    }
    if (Array.isArray(rt) && rt.length === 1 && Array.isArray(rt[0])) rt = rt[0];
    if (!Array.isArray(rt)) return Array(TOTAL_ROUNDS).fill(null);
    const out = rt.slice(0, TOTAL_ROUNDS).map((v) => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
        return v;
      }
      if (typeof v === 'object') {
        // allow nested { time, value }
        if (typeof v.time === 'number') return v.time;
        if (typeof v.value === 'string') return v.value;
        return v;
      }
      return null;
    });
    while (out.length < TOTAL_ROUNDS) out.push(null);
    return out;
  }

  // persist results helper used on finish or when user stops
  async function persistResults(newRounds, computedBest) {
    const name = playerName || `Player ${playerRoll || ''}`;
    const roll = playerRoll || lastRoll || '';
    try {
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rollNo: roll, bestTime: computedBest, rounds: newRounds })
      });
      // refresh rounds from server
      try {
        setLastRoll(String(roll));
        const rres = await fetch('/api/my-rounds?roll=' + encodeURIComponent(roll));
        if (rres.ok) {
          const rj = await rres.json();
          if (rj && rj.rounds) setRoundTimes(normalizeRounds(rj.rounds));
        }
      } catch (e) {}
    } catch (e) {
      // ignore post errors
    }
  }

  // Whenever lastRoll changes (e.g., after a submit), fetch fresh rounds from server
  useEffect(() => {
    if (!lastRoll) return;
    (async () => {
      try {
        const res = await fetch('/api/my-rounds?roll=' + encodeURIComponent(lastRoll));
        if (res.ok) {
          const j = await res.json();
          if (j && j.rounds) setRoundTimes(normalizeRounds(j.rounds));
        }
      } catch (e) {}
    })();
  }, [lastRoll]);

  

  // Input is forwarded to `handleInput` provided by the `useGame` hook

  const boxes = [
    { left: 17, top: 19, width: 500, height: 169, label: 'Round', value: String(level) },
    { left: 524, top: 19, width: 500, height: 169, label: 'Time', value: lastMissed ? 'missed' : (lastTime == null ? '--' : `${Math.round(lastTime)} ms`) },
  ];

  // Normalize rounds for display: handle cases where rounds may be stored as JSON string,
  // nested array, or missing. Ensure an array of length TOTAL_ROUNDS.
  const roundSummary = (() => {
    const rt = normalizeRounds(roundTimes);
    return rt.map((v) => {
      if (v == null) return '--';
      if (typeof v === 'number') return `${Math.round(v)}ms`;
      if (typeof v === 'string') return v === 'missed' ? 'missed' : v;
      if (typeof v === 'object' && v !== null) {
        if (typeof v.time === 'number') return `${Math.round(v.time)}ms`;
        if (typeof v.value === 'string') return v.value;
      }
      return '--';
    }).join(' │ ');
  })();

  const displayRounds = (() => {
    const rt = normalizeRounds(roundTimes);
    const out = Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (rt[i] != null ? rt[i] : null));
    return out;
  })();

  return (
    <>
      <style>{`@keyframes fall { from { transform: translateX(-50%) translateY(0); } to { transform: translateX(-50%) translateY(var(--fall-distance,260px)); } }`}</style>
      <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url(${bgUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      
      {/* previous game-over modal removed — game completes only after all rounds */}
      <div style={{ position: 'relative', width: 1508, height: 958, margin: '0 auto' }}>
        {boxes.map((b, i) => {
          const innerW = Math.round((b.width - 40) * innerScale);
          const innerH = Math.round((b.height - 36) * innerScale);
            return (
            <div
              key={i}
              onClick={() => {
                // difficulty removed; no click actions on these boxes
              }}
              style={{ position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height, overflow: 'hidden', cursor: 'default' }}
            >
              <img
                src={rectUrl}
                alt={`box-${i}`}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
              {/* Heading inside outer box but outside inner box */}
                <div style={{ position: 'absolute', left: '50%', top: 25, transform: 'translateX(-50%)', color: '#CC8458', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 40, fontWeight: 800, margin: 0, padding: 0, textAlign: 'center' }}>{String(b.label).trim()}</div>
                </div>

              {/* Inner container centered at bottom, contains inner image and centered value */}
              <div
                style={{
                  position: 'absolute',
                  left: '51%',
                  transform: 'translateX(-50%)',
                  bottom: 30,
                  width: innerW,
                  height: innerH,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                }}
              >
                <img src={innerRectUrl} alt={`inner-${i}`} style={{ width: '100%', height: '100%', display: 'block' }} />
                <div style={{ position: 'absolute', color: ' #8B5A2B', fontWeight: 700, fontSize: 18 }}>{b.value}</div>
              </div>

              {/* Screws at four corners of outer box */}
              <img src={screwUrl} alt={`screw-tl-${i}`} style={{ position: 'absolute', left: 60, top: 6, width: screwSize, height: screwSize, pointerEvents: 'none' }} />
              <img src={screwUrl} alt={`screw-tr-${i}`} style={{ position: 'absolute', left: b.width - screwSize - 60, top: 6, width: screwSize, height: screwSize, pointerEvents: 'none' }} />
              <img src={screwUrl} alt={`screw-bl-${i}`} style={{ position: 'absolute', left: 60, top: b.height - screwSize - 18, width: screwSize, height: screwSize, pointerEvents: 'none' }} />
              <img src={screwUrl} alt={`screw-br-${i}`} style={{ position: 'absolute', left: b.width - screwSize - 60, top: b.height - screwSize - 18, width: screwSize, height: screwSize, pointerEvents: 'none' }} />
            </div>
          );
        })}
        {/* Press-any-key prompt shown below the top boxes */}
        {awaitingStart && (
          <div style={{ position: 'absolute', top: 165, left: '50%', transform: 'translateX(-50%)', color: '#CC8458', pointerEvents: 'none', fontFamily: "Stardos Stencil, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", fontWeight: 700, fontSize: 28, textAlign: 'center', maxWidth: 900 }}>
            {startPrompt}
          </div>
        )}
        {/* Player info modal removed: play as guest by default */}
        {/* Three control buttons (A S D) centered at bottom */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 600, display: 'flex', gap: 300 }}>
            {keys.map((k, i) => {
                      const isActive = activeKey === k;
                      const isDropping = dropKey === k;
                      const pressOffset = isActive ? -6 : 0;
                      const fallDuration = Math.max(300, BASE_FALL - (level - 1) * 30);
                      const fallDistance = 260; // visual distance matched by keyframes default
                      const bottleTransform = `translateX(-50%) translateY(${pressOffset}px)`;
              return (
                <div key={k} style={{ position: 'relative', width: 120, height: 120 }}>
                <button
                  onMouseDown={() => setActiveKey(k)}
                  onMouseUp={() => setActiveKey(null)}
                  onMouseLeave={() => setActiveKey(null)}
                  onClick={() => handleInput(k)}
                  aria-label={`key-${k}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: `url(${buttonUrl}) no-repeat center/100% 100%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transform: isActive ? 'scale(0.95)' : 'none',
                    transition: 'transform 80ms ease',
                    fontFamily: "Stardos Stencil, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
                    fontSize: 40,
                    fontWeight: 800,
                    color: '#8B5A2B',
                  }}
                >
                  {k.toUpperCase()}
                </button>

                {/* Bottle below the button, connected visually and reacting to active state */}
                <img
                  key={`${k}-${bottleResetCount}`}
                  src={bottleUrl}
                  alt={`bottle-${k}`}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: bottleTransform,
                    width: 300,
                    height: 'auto',
                    marginTop: 8,
                    pointerEvents: 'none',
                    transition: 'none',
                    animation: gameFinished ? 'none' : (isDropping ? `fall ${fallDuration}ms linear forwards` : 'none'),
                    // pass fall distance so keyframes can use it
                    ['--fall-distance']: `${fallDistance}px`,
                  }}
                />
              </div>
            );
          })}
          {/* invisible baseline: triggers game-over when bottle crosses it */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 260px)', height: 6, background: 'transparent', pointerEvents: 'none', zIndex: 2 }} />
        </div>

        {/* stats panel removed — last time shown in top Time box */}
      </div>
        {/* right-side rectangle showing stored times for each round */}
        <div style={{ position: 'fixed', right: 11, top: 12, zIndex: 9998, width: 370, pointerEvents: 'none',height:"auto" }}>
          <div style={{ position: 'relative', width: '100%', display: 'block', border: '2px solid rgba(139,90,43,0.15)', borderRadius: 8, overflow: 'hidden' }}>
            <img src={rect29Url} alt="round-times" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ position: 'absolute', left: 30, right: 50, top: 40, bottom: 18, color: '#8B5A2B', fontWeight: 700, textAlign: 'left', fontSize: 18, pointerEvents: 'auto', fontFamily: "Stardos Stencil, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", lineHeight: '0.5', overflow: 'hidden' }}>
              <div style={{ fontSize: 25, marginBottom: 6 ,textAlign:"center"}}>Round results</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                {Array.from({ length: TOTAL_ROUNDS }).map((_, idx) => {
                  const raw = displayRounds[idx];
                  let text = '--';
                  if (raw == null) text = '--';
                  else if (typeof raw === 'number') text = `${Math.round(raw)} ms`;
                  else if (typeof raw === 'string') text = raw === 'missed' ? 'missed' : raw;
                  else if (typeof raw === 'object' && raw !== null) {
                    // support object shape { time, value }
                    if (typeof raw.time === 'number') text = `${Math.round(raw.time)} ms`;
                    else if (typeof raw.value === 'string') text = raw.value;
                  }
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px',  borderRadius: 6, boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontWeight: 800 }}>Round {idx + 1}</div>
                      <div style={{ fontWeight: 800, color: text === 'missed' ? '#cc4444' : '#8B5A2B' }}>{text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* KIITFEST logo in the page corner */}
        <img
          src={logoUrl}
          alt="kiitfest-logo"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 200,
            height: 'auto',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
        {/* View Result button shown after game finishes */}
        {gameFinished && canViewResults && (
          <div style={{ position: 'fixed', left: '50%', top: '40%', transform: 'translateX(-50%)', zIndex: 10000 }}>
            <button
              onClick={async () => {
                try { await persistResults(roundTimes, bestTime); } catch (e) {}
                try {
                  navigate('/result', { state: { rounds: roundTimes, bestTime, roll: playerName || playerRoll || lastRoll || '' } });
                } catch (e) {
                  try { window.location.assign('/result'); } catch (err) { window.location.href = '/result'; }
                }
              }}
              style={{ padding: '14px 20px', fontSize: 18, borderRadius: 8, background: '#8B5A2B', color: 'white', border: 'none', fontWeight: 800 }}
            >
              View Result
            </button>
          </div>
        )}

        {/* Stop button removed per user request */}
      
    </div>
    </>
  );
};
export default App;
