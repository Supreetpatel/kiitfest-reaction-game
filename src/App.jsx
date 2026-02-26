import React, { useState } from "react";
import Authenticate from "./Authenticate";
import Game from "./Game";

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    name: "",
    rollNo: 0,
  });

  return (
    <>
      <Authenticate currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <div className="overflow-hidden antialiased text-neutral-200 selection:bg-neutral-200 selection:text-neutral-800 w-full and h-full">
        {currentUser.rollNo !== 0 && <Game currentUser={currentUser} />}
      </div>
    </>
  );
}
