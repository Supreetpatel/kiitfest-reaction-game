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
            element={<Homepage currentUser={currentUser} />}
          />

          <Route path="/game" element={<Game currentUser={currentUser} />} />

          <Route
            path="/result"
            element={<Result currentUser={currentUser} />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
}
