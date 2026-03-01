import { useEffect, useRef, useState } from "react";

const randomIntBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getTimestampMs = () => Date.now();
const getPerfNow = () => performance.now();
const pickRandomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function useGame({
  TOTAL_ROUNDS = 5,
  MIN_WAIT = 5000,
  MAX_WAIT = 7000,
  BASE_FALL = 500,
  onFinish,
} = {}) {
  const keys = ["a", "s", "d"];
  const [activeKey, setActiveKey] = useState(null);
  const [gameRunning, setGameRunning] = useState(false);
  const gameRunningRef = useRef(gameRunning);
  const [gameFinished, setGameFinished] = useState(false);
  const gameFinishedRef = useRef(gameFinished);
  const [bottleResetCount, setBottleResetCount] = useState(0);
  const [level, setLevel] = useState(1);
  const levelRef = useRef(level);
  const [awaitingStart, setAwaitingStart] = useState(true);
  const awaitingStartRef = useRef(awaitingStart);
  const [startPrompt, setStartPrompt] = useState("Press any key to start");

  const [dropKey, setDropKey] = useState(null);
  const [dropStart, setDropStart] = useState(null);
  const dropKeyRef = useRef(null);
  const dropStartRef = useRef(null);

  const [lastTime, setLastTime] = useState(null);
  const [lastMissed, setLastMissed] = useState(false);
  const [bestTime, setBestTime] = useState(null);
  const bestTimeRef = useRef(bestTime);
  const [roundTimes, setRoundTimes] = useState(Array(TOTAL_ROUNDS).fill(null));
  const roundTimesRef = useRef(roundTimes);
  const [lastRoll, setLastRoll] = useState(null);

  const dropTimerRef = useRef(null);
  const baselineTimerRef = useRef(null);
  const [timeToNextDrop, setTimeToNextDrop] = useState(null);
  const nextDropAtRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    awaitingStartRef.current = awaitingStart;
  }, [awaitingStart]);
  useEffect(() => {
    gameFinishedRef.current = gameFinished;
  }, [gameFinished]);
  useEffect(() => {
    gameRunningRef.current = gameRunning;
  }, [gameRunning]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    bestTimeRef.current = bestTime;
  }, [bestTime]);
  useEffect(() => {
    roundTimesRef.current = roundTimes;
  }, [roundTimes]);
  useEffect(() => {
    dropKeyRef.current = dropKey;
    dropStartRef.current = dropStart;
  }, [dropKey, dropStart]);
  useEffect(() => {
    return () => {
      if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
      if (baselineTimerRef.current) clearTimeout(baselineTimerRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const scheduleNextDrop = () => {
    if (!gameRunningRef.current || gameFinishedRef.current) return;
    const currentLevel = levelRef.current;
    const levelReduction = Math.min(
      (currentLevel - 1) * 100,
      Math.floor((MAX_WAIT - MIN_WAIT) * 0.8),
    );
    let wait = randomIntBetween(MIN_WAIT, MAX_WAIT) - levelReduction;
    wait = Math.max(5000, wait);
    if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
    nextDropAtRef.current = getTimestampMs() + wait;
    setTimeToNextDrop(wait);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.round(nextDropAtRef.current - getTimestampMs()),
      );
      setTimeToNextDrop(remaining);
      if (remaining <= 0 && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }, 100);
    dropTimerRef.current = setTimeout(() => startDrop(), wait);
  };

  const startDrop = () => {
    if (!gameRunningRef.current || gameFinishedRef.current) return;
    const currentLevel = levelRef.current;
    const k = pickRandomFrom(keys);
    const now = getPerfNow();
    setDropKey(k);
    setDropStart(now);
    dropKeyRef.current = k;
    dropStartRef.current = now;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setTimeToNextDrop(null);
    const fallDuration = Math.max(300, BASE_FALL - (currentLevel - 1) * 30);
    const missWindow = fallDuration + 600;
    if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
    if (baselineTimerRef.current) {
      clearTimeout(baselineTimerRef.current);
      baselineTimerRef.current = null;
    }
    dropTimerRef.current = setTimeout(() => {
      if (gameFinishedRef.current) return;
      if (baselineTimerRef.current) {
        clearTimeout(baselineTimerRef.current);
        baselineTimerRef.current = null;
      }
      setDropKey(null);
      setDropStart(null);
      dropKeyRef.current = null;
      dropStartRef.current = null;
      recordRound("missed");
    }, missWindow);
  };

  const recordRound = (result) => {
    const currentLevel = levelRef.current;
    const newRounds = roundTimesRef.current
      ? roundTimesRef.current.slice()
      : Array(TOTAL_ROUNDS).fill(null);
    newRounds[currentLevel - 1] = result;
    setRoundTimes(newRounds);
    roundTimesRef.current = newRounds;
    let computedBest = bestTimeRef.current;
    if (typeof result === "number") {
      setLastTime(result);
      setLastMissed(false);
      computedBest =
        bestTimeRef.current == null || result < bestTimeRef.current
          ? result
          : bestTimeRef.current;
      setBestTime(computedBest);
      bestTimeRef.current = computedBest;
    } else {
      setLastTime(null);
      setLastMissed(true);
    }
    if (computedBest != null) setBestTime(computedBest);
    const isFinished = newRounds.slice(0, TOTAL_ROUNDS).every((v) => v != null);
    if (isFinished) {
      setGameFinished(true);
      gameFinishedRef.current = true;
      setDropKey(null);
      setDropStart(null);
      dropKeyRef.current = null;
      dropStartRef.current = null;
      if (dropTimerRef.current) {
        clearTimeout(dropTimerRef.current);
        dropTimerRef.current = null;
      }
      if (baselineTimerRef.current) {
        clearTimeout(baselineTimerRef.current);
        baselineTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setTimeToNextDrop(null);
      setBottleResetCount((c) => c + 1);
      stopGame();
      setAwaitingStart(true);
      awaitingStartRef.current = true;
      setStartPrompt("Game completed — press any key to restart");
      if (typeof onFinish === "function") {
        onFinish(newRounds, computedBest);
      }
    } else {
      setLevel((l) => {
        const next = Math.min(TOTAL_ROUNDS, l + 1);
        levelRef.current = next;
        return next;
      });
      setTimeout(() => {
        if (!gameFinishedRef.current) scheduleNextDrop();
      }, 800);
    }
  };

  const startGame = () => {
    if (gameRunningRef.current) return;
    setGameRunning(true);
    gameRunningRef.current = true;
    setLevel((l) => {
      const normalized = l >= 1 && l <= TOTAL_ROUNDS ? l : 1;
      levelRef.current = normalized;
      return normalized;
    });
    setTimeout(() => {
      if (!gameFinishedRef.current) scheduleNextDrop();
    }, 200);
  };

  const stopGame = () => {
    if (!gameRunningRef.current) return;
    setGameRunning(false);
    gameRunningRef.current = false;
    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
      dropTimerRef.current = null;
    }
    if (baselineTimerRef.current) {
      clearTimeout(baselineTimerRef.current);
      baselineTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setTimeToNextDrop(null);
    setDropKey(null);
    setDropStart(null);
  };

  const forceMiss = () => {
    if (awaitingStartRef.current || gameFinishedRef.current) return;
    const currentDrop = dropKeyRef.current;
    if (!currentDrop) return;

    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
      dropTimerRef.current = null;
    }
    if (baselineTimerRef.current) {
      clearTimeout(baselineTimerRef.current);
      baselineTimerRef.current = null;
    }

    dropKeyRef.current = null;
    dropStartRef.current = null;
    setDropKey(null);
    setDropStart(null);
    recordRound("missed");
  };

  const handleInput = (kRaw) => {
    const k = String(kRaw).toLowerCase();
    if (awaitingStartRef.current) {
      setAwaitingStart(false);
      awaitingStartRef.current = false;
      setStartPrompt("Press any key to start");
      setRoundTimes(Array(TOTAL_ROUNDS).fill(null));
      roundTimesRef.current = Array(TOTAL_ROUNDS).fill(null);
      setLevel(1);
      levelRef.current = 1;
      setLastTime(null);
      setLastMissed(false);
      setBestTime(null);
      bestTimeRef.current = null;
      setGameFinished(false);
      gameFinishedRef.current = false;
      setTimeToNextDrop(null);
      setTimeout(() => startGame(), 0);
      return;
    }
    if (gameFinishedRef.current) return;
    if (!keys.includes(k)) return;
    setActiveKey(k);
    const currentDrop = dropKeyRef.current;
    const currentStart = dropStartRef.current;
    if (currentDrop && currentDrop === k && currentStart) {
      const rt = getPerfNow() - currentStart;
      if (dropTimerRef.current) {
        clearTimeout(dropTimerRef.current);
        dropTimerRef.current = null;
      }
      if (baselineTimerRef.current) {
        clearTimeout(baselineTimerRef.current);
        baselineTimerRef.current = null;
      }
      dropKeyRef.current = null;
      dropStartRef.current = null;
      setDropKey(null);
      setDropStart(null);
      recordRound(rt);
    } else if (currentDrop && currentDrop !== k) {
      if (dropTimerRef.current) {
        clearTimeout(dropTimerRef.current);
        dropTimerRef.current = null;
      }
      if (baselineTimerRef.current) {
        clearTimeout(baselineTimerRef.current);
        baselineTimerRef.current = null;
      }
      dropKeyRef.current = null;
      dropStartRef.current = null;
      setDropKey(null);
      setDropStart(null);
      recordRound("missed");
    }
  };

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
    forceMiss,
    handleInput,
    setAwaitingStart,
    setStartPrompt,
    setRoundTimes,
    setBestTime,
  };
}
