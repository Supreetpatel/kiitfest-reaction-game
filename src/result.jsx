import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const Result = () => {
  const bgRaw = '/Screenshot 2026-02-22 145019 2.svg';
  const rect37Raw = '/Rectangle 37.svg';
  const bgUrl = encodeURI(bgRaw);
  const rect37Url = encodeURI(rect37Raw);
  const rect41Raw = '/Rectangle 41.svg';
  const rect41Url = encodeURI(rect41Raw);
  const rect18Raw = '/Rectangle 18.svg';
  const rect18Url = encodeURI(rect18Raw);
  const logoRaw = '/kiitfest-main-logo 3.svg';
  const logoUrl = encodeURI(logoRaw);
  const TOTAL_ROUNDS = 5;

  const [roundTimes, setRoundTimes] = useState(null);
  const [bestTime, setBestTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const location = useLocation();

  function normalizeRounds(rt) {
    try {
      if (typeof rt === 'string') {
        const trimmed = rt.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.startsWith('"')) {
          rt = JSON.parse(rt);
        }
      }
    } catch (e) {
      // ignore
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
        if (typeof v.time === 'number') return v.time;
        if (typeof v.value === 'string') return v.value;
        return v;
      }
      return null;
    });
    while (out.length < TOTAL_ROUNDS) out.push(null);
    return out;
  }

  useEffect(() => {
    // Prefer server as source-of-truth. Try navigation state first, then query param `roll`, then fallback to leaderboard-only.
    (async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const j = await res.json();
          if (j && Array.isArray(j.data)) setLeaderboard(j.data.slice(0, 10));
        }
      } catch (e) {
        setLeaderboard(null);
      }

      // If navigated with state (App can pass rounds/best via navigate('/result', { state })) use that.
      try {
        const st = (location && location.state) || {};
        if (st && (st.rounds || st.bestTime || st.roll)) {
          if (st.rounds) setRoundTimes(normalizeRounds(st.rounds));
          if (typeof st.bestTime === 'number') setBestTime(st.bestTime);
          // done
          return;
        }
      } catch (e) {}

      // Next: try query param `roll`
      try {
        const params = new URLSearchParams(location.search || window.location.search);
        const roll = params.get('roll');
        if (roll) {
          const myRes = await fetch('/api/my-rounds?roll=' + encodeURIComponent(roll));
          if (myRes.ok) {
            const mj = await myRes.json();
            if (mj && mj.rounds) setRoundTimes(normalizeRounds(mj.rounds));
            if (mj && typeof mj.bestTime === 'number') setBestTime(mj.bestTime);
            return;
          }
        }
      } catch (e) {}

      // fallback: no user-specific data
      setRoundTimes(null);
      setBestTime(null);
    })();
  }, []);

  useEffect(() => {
    if (bestTime == null) {
      setMyRank(null);
      return;
    }
    const times = [];
    if (Array.isArray(leaderboard)) {
      leaderboard.forEach((e) => {
        if (e && typeof e.bestTime === 'number') times.push(e.bestTime);
      });
    }
    // include current bestTime so we can compute rank even if not on leaderboard yet
    times.push(bestTime);
    times.sort((a, b) => a - b);
    const idx = times.indexOf(bestTime);
    setMyRank(idx >= 0 ? idx + 1 : null);
  }, [leaderboard, bestTime]);

  const numericTimes = (roundTimes || []).filter((r) => typeof r === 'number');
  const avg = numericTimes.length ? Math.round(numericTimes.reduce((a, b) => a + b, 0) / numericTimes.length) : null;
  const successRate = roundTimes ? Math.round((numericTimes.length / TOTAL_ROUNDS) * 100) : null;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${bgUrl})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      color: '#8B5A2B',
      fontFamily: "Stardos Stencil, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
      padding: 36,
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: 1500, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{  padding: '12px 24px', borderRadius: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.08)', color: 'white', fontWeight: 900, fontSize: 60 }}>
            Game Over!
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ padding: '8px 16px', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', color: 'white', fontWeight: 800 ,fontSize: 40}}>
            My Rank: {myRank == null ? '--' : myRank}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginBottom: 24 }}>
          {[
            { label: 'Best time', value: bestTime == null ? '--' : `${Math.round(bestTime)} ms` },
            { label: 'Average', value: avg == null ? '--' : `${avg} ms` },
            { label: 'Success', value: successRate == null ? '--' : `${successRate}%` },
          ].map((b, i) => (
            <div key={i} style={{ position: 'relative', width: '33.333%', height: 120 }}>
              <img src={rect37Url} alt={`box-${i}`} style={{ width: '100%', height: '100%', display: 'block' }} />
              <div style={{ position: 'absolute', left: 18, right: 18, top: 18, bottom: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'white' ,textAlign:"center"}}>{b.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 ,color: 'white',textAlign:"center"}}>{b.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Leader Board heading using Rectangle 41.svg */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
          <div style={{ position: 'relative', width: 300, height: 86 }}>
            <img src={rect41Url} alt="leader-heading" style={{ width: '100%', height: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5A2B', fontWeight: 900, fontSize: 35 }}>
              Leader Board
            </div>
          </div>
        </div>
        
        {/* Subheadings printed on background directly (no box) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 1000, margin: '18px auto 8px', padding: '0 12px', color: 'white', fontWeight: 800 ,fontSize: 20}}>
          <div style={{ width: '8%', textAlign: 'left' }}>Rank</div>
          <div style={{ width: '36%', textAlign: 'left' }}>Name</div>
          <div style={{ width: '28%', textAlign: 'left' }}>Rollnumber</div>
          <div style={{ width: '20%', textAlign: 'right' }}>Best time</div>
        </div>

        {/* Leaderboard entries (up to 10) */}
        <div style={{ maxWidth: 1000, margin: '0 auto 48px', padding: '0 12px' }}>
          {(leaderboard || Array.from({ length: 10 })).map((entry, idx) => {
            const name = entry && entry.name ? entry.name : '--';
            const roll = entry && entry.rollnumber ? entry.rollnumber : '--';
            const time = entry && (typeof entry.bestTime === 'number') ? `${Math.round(entry.bestTime)} ms` : '--';
            return (
              <div key={idx} style={{ position: 'relative', marginBottom: 12, height: 64 }}>
                <img src={rect18Url} alt={`leader-${idx}`} style={{ width: '100%', height: '100%', display: 'block' }} />
                <div style={{ position: 'absolute', left: 12, right: 12, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', fontWeight: 800 }}>
                  <div style={{ width: '8%' }}>{idx + 1}</div>
                  <div style={{ width: '40%' }}>{name}</div>
                  <div style={{ width: '22%' }}>{roll}</div>
                  <div style={{ width: '20%', textAlign: 'right' }}>{time}</div>
                </div>
              </div>
            );
          })}
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
      </div>
    </div>
  );
};

export default Result;
