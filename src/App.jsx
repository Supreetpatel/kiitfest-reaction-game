import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Authenticate from "./Authenticate";
import Homepage from "./Homepage";
import Game from "./Game";
import Result from "./result";
import Leaderboard from "./Leaderboard";
import ProtectedRoute from "./middleware/ProtectedRoute";

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    kfid: "",
  });

  return (
    <div className="overflow-hidden antialiased text-neutral-200 selection:bg-neutral-200 selection:text-neutral-800 w-full h-full">
      <Router>
        <Routes>
          {/* 1. Login Page - Pass the state setter so Authenticate can update the user */}
          <Route
            path="/"
            element={
              <Authenticate
                setCurrentUser={setCurrentUser}
                currentUser={currentUser}
              />
            }
          />

          {/* 2. Selection Page */}
          <Route
            path="/home"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Homepage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Game currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Result currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
}
