import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Authenticate from "./Authenticate";
import Homepage from "./Homepage";

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    name: "",
    rollNo: 0,
  });

  return (
    <div className="overflow-hidden antialiased text-neutral-200 selection:bg-neutral-200 selection:text-neutral-800 w-full h-full">
      <Router>
        <Routes>
          {/* 1. Login Page - Pass the state setter so Authenticate can update the user */}
          <Route 
            path="/" 
            element={<Authenticate setCurrentUser={setCurrentUser} />} 
          />
          
          {/* 2. Selection Page */}
          <Route 
            path="/home" 
            element={<Homepage currentUser={currentUser} />} 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
}
