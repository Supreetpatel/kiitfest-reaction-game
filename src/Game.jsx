import { addToast } from "@heroui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { PiBeerBottleFill } from "react-icons/pi";
import { FaTrophy, FaHourglassHalf, FaBolt } from "react-icons/fa";

export default function Game({ currentUser }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameState, setGameState] = useState({
    status: "not-started",
    fallingBottleIndex: null,
    bottleColors: ["blue", "blue", "blue"],
    cycleCount: 0,
    fallStartTime: null,
    message: "Press Start to Begin the Reaction Time Game",
    reactionTimes: [],
    bestReactionTime: null,
    roundOver: false,
    difficulty: "medium",
  });

  useEffect(() => {
    axios
      .get("http://localhost:3000/leaderboard")
      .then((response) => {
        setLeaderboard(response.data.records);
      })
      .catch(() => {
        addToast({
          title: "Unable to fetch leaderboard",
          description: "Please try again later",
          color: "danger",
        });
      });
  }, []);

  const handleStartGame = (difficulty = "medium") => {
    setGameState({
      status: "playing",
      fallingBottleIndex: null,
      bottleColors: ["blue", "blue", "blue"],
      cycleCount: 0,
      fallStartTime: null,
      message: "",
      reactionTimes: [],
      bestReactionTime: null,
      roundOver: false,
      difficulty,
    });
  };

  // Get fall duration based on difficulty - significantly different values
  const getFallDuration = () => {
    switch (gameState.difficulty) {
      case "easy":
        return 3000; // Slower fall - 3 seconds
      case "hard":
        return 600; // Very fast fall - 0.6 seconds
      default:
        return 1500; // medium - 1.5 seconds
    }
  };

  // Get delay between rounds based on difficulty
  const getDelayBetweenRounds = () => {
    switch (gameState.difficulty) {
      case "easy":
        return 2000; // More time between rounds
      case "hard":
        return 300; // Very little time between rounds
      default:
        return 1000; // medium
    }
  };

  // Get random delay before bottle falls based on difficulty
  const getRandomDelayRange = () => {
    switch (gameState.difficulty) {
      case "easy":
        return { min: 1000, max: 2000 }; // More predictable
      case "hard":
        return { min: 200, max: 1500 }; // Very unpredictable
      default:
        return { min: 800, max: 2000 }; // medium
    }
  };

  useEffect(() => {
    // Only run the game logic when status is "playing"
    if (gameState.status !== "playing" || gameState.cycleCount >= 5) return;

    const startNewRound = () => {
      // Based on difficulty, randomize which bottle falls
      let randomIndex;
      if (gameState.difficulty === "hard") {
        // For hard difficulty, use all 3 positions randomly
        randomIndex = Math.floor(Math.random() * 3);
      } else if (gameState.difficulty === "medium") {
        // For medium, slightly more likely to be middle position
        const weights = [0.3, 0.4, 0.3]; // 30% left, 40% middle, 30% right
        const random = Math.random();
        if (random < weights[0]) randomIndex = 0;
        else if (random < weights[0] + weights[1]) randomIndex = 1;
        else randomIndex = 2;
      } else {
        // For easy, more likely to be the middle position
        const weights = [0.2, 0.6, 0.2]; // 20% left, 60% middle, 20% right
        const random = Math.random();
        if (random < weights[0]) randomIndex = 0;
        else if (random < weights[0] + weights[1]) randomIndex = 1;
        else randomIndex = 2;
      }

      const delayRange = getRandomDelayRange();
      const randomDelay =
        Math.floor(Math.random() * (delayRange.max - delayRange.min)) +
        delayRange.min;
      const fallDuration = getFallDuration();

      // Timeout to start the fall
      const fallTimeout = setTimeout(() => {
        setGameState((prevState) => ({
          ...prevState,
          fallingBottleIndex: randomIndex,
          fallStartTime: Date.now(),
          message: "",
          roundOver: false,
          bottleColors: ["blue", "blue", "blue"],
        }));

        // Timeout to handle missed round
        const missedRoundTimeout = setTimeout(() => {
          setGameState((prevState) => {
            // If round is not over, it means user missed the button press
            if (!prevState.roundOver) {
              return {
                ...prevState,
                message: "❌ Too Slow! You missed the button press.",
                bottleColors: prevState.bottleColors.map((color, index) =>
                  index === randomIndex ? "red" : color
                ),
                reactionTimes: [...prevState.reactionTimes, "Missed"],
                roundOver: true,
              };
            }
            return prevState;
          });
        }, fallDuration); // Uses the difficulty-based duration

        return () => clearTimeout(missedRoundTimeout);
      }, randomDelay);

      // Timeout to reset bottle after fall
      const resetTimeout = setTimeout(() => {
        setGameState((prevState) => ({
          ...prevState,
          fallingBottleIndex: null,
          cycleCount: prevState.cycleCount + 1,
          bottleColors: ["blue", "blue", "blue"],
        }));
      }, randomDelay + fallDuration + getDelayBetweenRounds());

      // Cleanup function to prevent memory leaks
      return () => {
        clearTimeout(fallTimeout);
        clearTimeout(resetTimeout);
      };
    };

    const cleanup = startNewRound();
    return cleanup;
  }, [gameState.status, gameState.cycleCount, gameState.difficulty]);

  useEffect(() => {
    const keyMapping = { 0: "a", 1: "s", 2: "d" };

    const handleKeyPress = (event) => {
      if (gameState.status !== "playing") return;

      const { fallingBottleIndex, fallStartTime, roundOver, difficulty } =
        gameState;

      if (fallStartTime && fallingBottleIndex !== null && !roundOver) {
        const pressedKey = event.key.toLowerCase();

        if (pressedKey === keyMapping[fallingBottleIndex]) {
          const timeTaken = Date.now() - fallStartTime;

          setGameState((prevState) => ({
            ...prevState,
            message: `✅ Success! Reaction time: ${timeTaken}ms`,
            bottleColors: prevState.bottleColors.map((color, index) =>
              index === fallingBottleIndex ? "green" : color
            ),
            reactionTimes: [...prevState.reactionTimes, `${timeTaken}ms`],
            bestReactionTime:
              prevState.bestReactionTime === null
                ? timeTaken
                : Math.min(prevState.bestReactionTime, timeTaken),
            roundOver: true,
          }));
        } else {
          // For hard difficulty, any wrong key immediately fails the round
          // For medium, show wrong key message
          // For easy, give a small grace period to press correct key
          if (difficulty === "easy") {
            // For easy mode, just notify but don't fail the round yet
            setGameState((prevState) => ({
              ...prevState,
              message: "Try again! Press the correct key.",
            }));
            return; // Don't mark the round as over yet
          }

          setGameState((prevState) => ({
            ...prevState,
            message: "❌ Wrong key! You lost this round.",
            bottleColors: prevState.bottleColors.map((color, index) =>
              index === fallingBottleIndex ? "red" : color
            ),
            reactionTimes: [...prevState.reactionTimes, "Wrong Key"],
            roundOver: true,
          }));
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [
    gameState.status,
    gameState.fallStartTime,
    gameState.fallingBottleIndex,
    gameState.roundOver,
    gameState.difficulty,
  ]);

  useEffect(() => {
    if (gameState.status !== "playing" || gameState.cycleCount < 5) return;

    const validTimes = gameState.reactionTimes
      .map((time) => {
        if (typeof time === "string" && time.includes("ms")) {
          // Extract numeric part before "ms"
          return parseInt(time.replace("ms", ""));
        }
        return null;
      })
      .filter((time) => time !== null);

    const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;

    if (bestTime !== null) {
      setLeaderboard((prevLeaderboard) => {
        let ldboard = [
          ...prevLeaderboard,
          {
            name: currentUser.name,
            rollNo: currentUser.rollNumber,
            bestScore: `${bestTime}ms`,
            difficulty: gameState.difficulty,
          },
        ].sort((a, b) => {
          const scoreA = parseInt(a.bestScore);
          const scoreB = parseInt(b.bestScore);
          return isNaN(scoreA) || isNaN(scoreB) ? 0 : scoreA - scoreB;
        });
        // console.log(ldboard);
        return ldboard.filter(
          (value, index) =>
            ldboard.findIndex((element) => element.name == value.name) === index
        );
      });

      // Make sure we're using the consistent property for roll number
      const userRollNo = currentUser.rollNumber || currentUser.rollNo;

      axios
        .post("http://localhost:3000/time", {
          time: bestTime,
          rollNo: userRollNo,
          difficulty: gameState.difficulty,
        })
        .then(() => {
          addToast({
            title: `Time submitted successfully! Your best reaction time was: ${bestTime}ms`,
            variant: "success",
          });
        })
        .catch(() => {
          addToast({
            title: "Something went wrong",
            description: "Please try again later",
            color: "danger",
          });
        });
    }
  }, [gameState.status, gameState.cycleCount, currentUser]);

  const {
    status,
    fallingBottleIndex,
    bottleColors,
    cycleCount,
    message,
    reactionTimes,
    bestReactionTime,
    difficulty,
  } = gameState;

  // Function to calculate average score excluding misses and wrong keys
  const calculateAverage = (times) => {
    const validTimes = times
      .filter((time) => typeof time === "string" && time.includes("ms"))
      .map((time) => parseInt(time.replace("ms", "")));

    if (validTimes.length === 0) return "N/A";
    const sum = validTimes.reduce((acc, val) => acc + val, 0);
    return `${Math.round(sum / validTimes.length)}ms`;
  };

  // Calculate number of successful rounds
  const getSuccessRate = () => {
    const totalRounds = reactionTimes.length;
    if (totalRounds === 0) return "0%";

    const successfulRounds = reactionTimes.filter(
      (time) => typeof time === "string" && time.includes("ms")
    ).length;

    return `${Math.round((successfulRounds / totalRounds) * 100)}%`;
  };

  return (
    <div className="overflow-hidden antialiased text-black selection:bg-gray-200 selection:text-black bg-gradient-to-b from-white to-blue-50 min-h-screen flex flex-col">
      <div className="container mx-auto px-5 select-none">
        <div className="h-full flex flex-col items-center justify-start w-full">
          {status === "not-started" ? (
            <div className="flex flex-col items-center justify-center h-full mt-14">
              <h1 className="text-4xl font-bold mb-6 text-blue-600">
                Reaction Time Challenge
              </h1>
              <div className="mb-8 text-center max-w-lg">
                <p className="text-lg mb-3">
                  Test your reflexes! Press the corresponding key (A, S, D) when
                  the bottle starts falling.
                </p>
                <p className="text-sm text-gray-600">
                  The faster you react, the better your score. Complete 5 rounds
                  to see your ranking.
                </p>
              </div>

              <div className="flex flex-col space-y-4 items-center">
                <h2 className="text-lg font-semibold">Select Difficulty:</h2>
                <div className="flex space-x-4">
                  <button
                    className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg hover:bg-green-600 transition-colors shadow-md"
                    onClick={() => handleStartGame("easy")}
                  >
                    Easy
                  </button>
                  <button
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition-colors shadow-md"
                    onClick={() => handleStartGame("medium")}
                  >
                    Medium
                  </button>
                  <button
                    className="px-6 py-3 bg-red-600 text-white rounded-lg text-lg hover:bg-red-700 transition-colors shadow-md"
                    onClick={() => handleStartGame("hard")}
                  >
                    Hard
                  </button>
                </div>
                <div className="mt-4 text-sm text-gray-600 max-w-lg text-center">
                  <p>
                    <strong>Easy:</strong> Slower falling bottles, forgiving
                    controls, more predictable patterns
                  </p>
                  <p>
                    <strong>Medium:</strong> Moderate speed, standard controls
                  </p>
                  <p>
                    <strong>Hard:</strong> Fast falling bottles, strict
                    controls, unpredictable timing
                  </p>
                </div>
              </div>

              {leaderboard.length > 0 && (
                <div className="mt-12 w-full max-w-md mb-20">
                  <h2 className="text-xl font-bold mb-2 text-center">
                    🏆 Top Players
                  </h2>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <div
                      className="bg-blue-100 py
                    -2 px-4 py-2 grid grid-cols-4 font-semibold text-gray-700"
                    >
                      <div>Rank</div>
                      <div>Name</div>
                      <div>Roll No.</div>
                      <div className="text-right">Best Time</div>
                    </div>
                    {leaderboard.slice(0, 3).map((player, index) => (
                      <div
                        key={index}
                        className="py-2 px-4 grid grid-cols-4 border-t border-gray-100 hover:bg-blue-50"
                      >
                        <div className="font-medium">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"} #
                          {index + 1}
                        </div>
                        <div>{player.name}</div>
                        <div>{player.rollNo}</div>
                        <div className="text-right font-mono">
                          {player.bestScore}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : status === "playing" && cycleCount < 5 ? (
            <>
              {/* Game Header */}
              <div className="w-full bg-white shadow-md rounded-lg p-3 mt-4 flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Round: {cycleCount + 1}/5 • Difficulty:
                  <span
                    className={`ml-1 ${
                      difficulty === "easy"
                        ? "text-green-500"
                        : difficulty === "hard"
                        ? "text-red-500"
                        : "text-blue-500"
                    }`}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaBolt className="text-yellow-500" />
                  <span className="font-mono">
                    {bestReactionTime ? `${bestReactionTime}ms` : "--"}
                  </span>
                </div>
              </div>

              {/* Message Display */}
              <div
                className={`mt-4 text-center h-8 ${message ? "" : "invisible"}`}
              >
                <p className="text-lg font-medium">
                  {message || "Placeholder"}
                </p>
              </div>

              {/* Buttons ABOVE the bottles */}
              <div className="flex flex-row items-center justify-center w-full gap-[15%] mt-[8vh]">
                {["A", "S", "D"].map((key, i) => (
                  <button
                    key={key}
                    className={`p-4 rounded-lg text-xl font-bold w-16 h-16 flex items-center justify-center shadow-md transition-all ${
                      bottleColors[i] === "green"
                        ? "bg-green-500 text-white"
                        : bottleColors[i] === "red"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Bottles positioned below the buttons */}
              <div className="flex flex-row items-center justify-center w-full gap-[15%] mt-[5vh] mb-8">
                {[0, 1, 2].map((i) => (
                  <div key={`bottle-${cycleCount}-${i}`} className="relative">
                    <PiBeerBottleFill
                      className={`text-[120px] transition-all ${
                        fallingBottleIndex === i ? "duration-1500" : ""
                      }`}
                      style={{
                        color: bottleColors[i],
                        position: "relative",
                        opacity: 1,
                        transform:
                          fallingBottleIndex === i
                            ? "translateY(150vh)"
                            : "translateY(0)",
                        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
                        transitionDuration:
                          fallingBottleIndex === i
                            ? `${getFallDuration()}ms`
                            : "0ms",
                      }}
                    />
                    {fallingBottleIndex === i && (
                      <div
                        className="absolute left-0 right-0 h-16 -bottom-16 bg-gradient-to-t from-blue-100 to-transparent opacity-50"
                        style={{ zIndex: -1 }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Reaction Time Display */}
              <div className="absolute top-24 right-10 bg-white p-5 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-bold mb-2 flex items-center">
                  <FaHourglassHalf className="mr-2 text-blue-500" />
                  Reaction Times
                </h3>
                <div className="space-y-1">
                  {reactionTimes.map((time, index) => (
                    <p
                      key={index}
                      className={`text-sm ${
                        time === "Missed" || time === "Wrong Key"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      Round {index + 1}: {time}
                    </p>
                  ))}
                  {Array(5 - reactionTimes.length)
                    .fill(0)
                    .map((_, i) => (
                      <p
                        key={`placeholder-${i}`}
                        className="text-sm text-gray-300"
                      >
                        Round {reactionTimes.length + i + 1}: --
                      </p>
                    ))}
                </div>
              </div>

              {/* Game Instructions */}
              <div className="fixed bottom-4 left-4 bg-white p-3 rounded-lg shadow-md text-sm text-gray-600 max-w-xs">
                <p>
                  Press the key (A, S, D) that corresponds to the falling bottle
                  as quickly as possible!
                </p>
                {difficulty === "easy" && (
                  <p className="mt-1 text-green-600">
                    Easy mode: You can try again if you press the wrong key.
                  </p>
                )}
                {difficulty === "hard" && (
                  <p className="mt-1 text-red-600">
                    Hard mode: One wrong move and you miss the round!
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center mt-14 w-full">
              <div className="mb-6 text-center">
                <h2 className="text-4xl font-bold mb-2">Game Over!</h2>
                <p className="text-lg text-gray-600">
                  {bestReactionTime
                    ? `Your best reaction time was ${bestReactionTime}ms`
                    : "Try again for a better score!"}
                </p>
              </div>

              {/* Player Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <div className="text-blue-500 text-xl mb-1">Best Time</div>
                  <div className="font-bold text-2xl">
                    {bestReactionTime ? `${bestReactionTime}ms` : "N/A"}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <div className="text-blue-500 text-xl mb-1">Average</div>
                  <div className="font-bold text-2xl">
                    {calculateAverage(reactionTimes)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <div className="text-blue-500 text-xl mb-1">Success Rate</div>
                  <div className="font-bold text-2xl">{getSuccessRate()}</div>
                </div>
              </div>

              {/* Leaderboard */}
              <h1 className="font-bold mt-4 text-2xl flex items-center mb-4">
                <FaTrophy className="text-yellow-500 mr-2" /> Leaderboard
              </h1>
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-w-[500px] max-w-[600px] overflow-hidden">
                <div className="bg-blue-100 text-gray-700 font-semibold">
                  <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-gray-200">
                    <div>Rank</div>
                    <div>Name</div>
                    <div>Roll No.</div>
                    <div className="text-center">Difficulty</div>
                    <div className="text-right">Best Time</div>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {leaderboard.slice(0, 10).map((player, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-5 gap-2 p-3 items-center ${
                        player.rollNo === currentUser.rollNo
                          ? "bg-blue-100"
                          : index % 2 === 0
                          ? "bg-gray-50"
                          : "bg-white"
                      } hover:bg-blue-50 transition-colors border-b border-gray-100`}
                    >
                      <div className="font-semibold">
                        {`#${index + 1} `}
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : ""}
                      </div>
                      <div>{player.name}</div>
                      <div>{player.rollNo}</div>
                      <div
                        className={`text-center ${
                          (player.difficulty || "medium") === "easy"
                            ? "text-green-500"
                            : (player.difficulty || "medium") === "hard"
                            ? "text-red-500"
                            : "text-blue-500"
                        }`}
                      >
                        {(player.difficulty || "medium")
                          .charAt(0)
                          .toUpperCase() +
                          (player.difficulty || "medium").slice(1)}
                      </div>
                      <div className="text-right font-mono">
                        {player.bestScore}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex space-x-4 mb-8">
                <button
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 shadow-md transition-all transform hover:scale-105"
                  onClick={() => handleStartGame(difficulty)}
                >
                  Play Again
                </button>
                <button
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg text-lg hover:bg-gray-300 shadow-md transition-all"
                  onClick={() =>
                    setGameState((prevState) => ({
                      ...prevState,
                      status: "not-started",
                    }))
                  }
                >
                  Change Difficulty
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
