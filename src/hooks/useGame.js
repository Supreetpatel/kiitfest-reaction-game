import { useEffect, useRef, useState } from 'react';

export default function useGame({ TOTAL_ROUNDS = 5, MIN_WAIT = 500, MAX_WAIT = 2000, BASE_FALL = 500, onFinish } = {}) {
  const keys = ['a', 's', 'd'];
  const [activeKey, setActiveKey] = useState(null);
  const [gameRunning, setGameRunning] = useState(false);
  const gameRunningRef = useRef(gameRunning);
  const [gameFinished, setGameFinished] = useState(false);
  const gameFinishedRef = useRef(gameFinished);
  const [bottleResetCount, setBottleResetCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [awaitingStart, setAwaitingStart] = useState(true);
  const awaitingStartRef = useRef(awaitingStart);
  const [startPrompt, setStartPrompt] = useState('Press any key to start');

  const startGameRef = useRef(null);
  const stopGameRef = useRef(null);
  const scheduleNextDropRef = useRef(null);

  const [dropKey, setDropKey] = useState(null);
  const [dropStart, setDropStart] = useState(null);
  const dropKeyRef = useRef(null);
  const dropStartRef = useRef(null);

  const [lastTime, setLastTime] = useState(null);
  const [lastMissed, setLastMissed] = useState(false);
  const [bestTime, setBestTime] = useState(null);
  const [roundTimes, setRoundTimes] = useState(Array(TOTAL_ROUNDS).fill(null));
  const [lastRoll, setLastRoll] = useState(null);

  const dropTimerRef = useRef(null);
  const baselineTimerRef = useRef(null);
  const [timeToNextDrop, setTimeToNextDrop] = useState(null);
  const nextDropAtRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => { awaitingStartRef.current = awaitingStart; }, [awaitingStart]);
  useEffect(() => { gameFinishedRef.current = gameFinished; }, [gameFinished]);
  useEffect(() => { gameRunningRef.current = gameRunning; }, [gameRunning]);
  useEffect(() => { dropKeyRef.current = dropKey; dropStartRef.current = dropStart; }, [dropKey, dropStart]);
  useEffect(() => {
    return () => {
      if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
      if (baselineTimerRef.current) clearTimeout(baselineTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const randBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const scheduleNextDrop = () => {
    if (!gameRunningRef.current || gameFinishedRef.current) return;
    const levelReduction = Math.min((level - 1) * 100, Math.floor((MAX_WAIT - MIN_WAIT) * 0.8));
    let wait = randBetween(MIN_WAIT, MAX_WAIT) - levelReduction;
    wait = Math.max(120, wait);
    if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
    nextDropAtRef.current = Date.now() + wait;
    setTimeToNextDrop(wait);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round(nextDropAtRef.current - Date.now()));
      setTimeToNextDrop(remaining);
      if (remaining <= 0 && countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    }, 100);
    dropTimerRef.current = setTimeout(() => startDrop(), wait);
  };

  const startDrop = () => {
    if (!gameRunningRef.current || gameFinishedRef.current) return;
    const i = Math.floor(Math.random() * keys.length);
    const k = keys[i];
    const now = performance.now();
    setDropKey(k);
    setDropStart(now);
    dropKeyRef.current = k;
    dropStartRef.current = now;
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    const fallDuration = Math.max(300, BASE_FALL - (level - 1) * 30);
    const missWindow = fallDuration + 600;
    if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
    if (baselineTimerRef.current) { clearTimeout(baselineTimerRef.current); baselineTimerRef.current = null; }
    dropTimerRef.current = setTimeout(() => {
      if (gameFinishedRef.current) return;
      if (baselineTimerRef.current) { clearTimeout(baselineTimerRef.current); baselineTimerRef.current = null; }
      setDropKey(null);
      setDropStart(null);
      dropKeyRef.current = null;
      dropStartRef.current = null;
      recordRound('missed');
    }, missWindow);
  };

  const recordRound = (result) => {
    const newRounds = roundTimes ? roundTimes.slice() : Array(TOTAL_ROUNDS).fill(null);
    newRounds[level - 1] = result;
    setRoundTimes(newRounds);
    let computedBest = bestTime;
    if (typeof result === 'number') {
      setLastTime(result);
      setLastMissed(false);
      computedBest = (bestTime == null || result < bestTime) ? result : bestTime;
      setBestTime(computedBest);
    } else {
      setLastTime(null);
      setLastMissed(true);
    }
    if (computedBest != null) setBestTime(computedBest);
    const isFinished = newRounds.slice(0, TOTAL_ROUNDS).every((v) => v != null);
    if (isFinished) {
      setGameFinished(true);
      gameFinishedRef.current = true;
      try { setDropKey(null); setDropStart(null); dropKeyRef.current = null; dropStartRef.current = null; } catch (e) {}
      try { if (dropTimerRef.current) { clearTimeout(dropTimerRef.current); dropTimerRef.current = null; } } catch (e) {}
      try { if (baselineTimerRef.current) { clearTimeout(baselineTimerRef.current); baselineTimerRef.current = null; } } catch (e) {}
      try { if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; } } catch (e) {}
      setBottleResetCount((c) => c + 1);
      stopGame();
      setAwaitingStart(true);
      awaitingStartRef.current = true;
      setStartPrompt('Game completed — press any key to restart');
      if (typeof onFinish === 'function') {
        try { onFinish(newRounds, computedBest); } catch (e) {}
      }
    } else {
      setLevel((l) => Math.min(TOTAL_ROUNDS, l + 1));
      setTimeout(() => { if (!gameFinishedRef.current) scheduleNextDrop(); }, 300);
    }
  };

  const startGame = () => {
    if (gameRunningRef.current) return;
    setGameRunning(true);
    gameRunningRef.current = true;
    setLevel((l) => (l >= 1 && l <= TOTAL_ROUNDS ? l : 1));
    setTimeout(() => { if (!gameFinishedRef.current) scheduleNextDrop(); }, 120);
  };

  const stopGame = () => {
    if (!gameRunningRef.current) return;
    setGameRunning(false);
    gameRunningRef.current = false;
    if (dropTimerRef.current) { clearTimeout(dropTimerRef.current); dropTimerRef.current = null; }
    if (baselineTimerRef.current) { clearTimeout(baselineTimerRef.current); baselineTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    setDropKey(null);
    setDropStart(null);
  };

  const handleInput = (kRaw) => {
    const k = String(kRaw).toLowerCase();
    if (awaitingStartRef.current) {
      setAwaitingStart(false);
      awaitingStartRef.current = false;
      setStartPrompt('Press any key to start');
      setRoundTimes(Array(TOTAL_ROUNDS).fill(null));
      setLevel(1);
      setLastTime(null);
      setLastMissed(false);
      setGameFinished(false);
      gameFinishedRef.current = false;
      setTimeout(() => startGame(), 0);
      return;
    }
    if (gameFinishedRef.current) return;
    if (!keys.includes(k)) return;
    setActiveKey(k);
    const currentDrop = dropKeyRef.current;
    const currentStart = dropStartRef.current;
    if (currentDrop && currentDrop === k && currentStart) {
      const rt = performance.now() - currentStart;
      if (dropTimerRef.current) { clearTimeout(dropTimerRef.current); dropTimerRef.current = null; }
      if (baselineTimerRef.current) { clearTimeout(baselineTimerRef.current); baselineTimerRef.current = null; }
      dropKeyRef.current = null; dropStartRef.current = null; setDropKey(null); setDropStart(null);
      recordRound(rt);
    } else if (currentDrop && currentDrop !== k) {
      if (dropTimerRef.current) { clearTimeout(dropTimerRef.current); dropTimerRef.current = null; }
      if (baselineTimerRef.current) { clearTimeout(baselineTimerRef.current); baselineTimerRef.current = null; }
      dropKeyRef.current = null; dropStartRef.current = null; setDropKey(null); setDropStart(null);
      recordRound('missed');
    }
  };

  useEffect(() => {
    startGameRef.current = startGame;
    stopGameRef.current = stopGame;
    scheduleNextDropRef.current = scheduleNextDrop;
  }, []);

  return {
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
    playerName: null,
    playerRoll: null,
    setPlayerName: () => {},
    setPlayerRoll: () => {},
    bottleResetCount,
    timeToNextDrop,
    startGame,
    stopGame,
    handleInput,
    setAwaitingStart,
    setStartPrompt,
    setRoundTimes,
    setBestTime,
  };
}
