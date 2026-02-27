import React, { useState } from "react";
import warehouseImg from "./assets/warehouse.png";
import kiitfestImg from "./assets/kiitfest-main-logo 20.png";
import midimg from "./assets/mid.png";
import { MdPadding } from "react-icons/md";

export default function Authenticate() {
  const [formData, setFormData] = useState({ name: "", roll: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div
      className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat bg-[#00092A] overflow-hidden"
      style={{ backgroundImage: `url(${warehouseImg})` }}
    >
      {/* 🔹 LOGO — Always at top center of screen */}
      <div className="absolute top-6 left-0 w-full flex justify-center z-30">
        <img
          src={kiitfestImg}
          alt="KIIT Fest Logo"
          className="w-[200px] md:w-[269px] h-auto"
        />
      </div>

      {/* 🔹 CENTER WRAPPER — Only for board */}
      <div className="w-full h-full flex items-center justify-center">
        {/* 🔹 BOARD */}
        <div
          className="relative z-10 flex items-center justify-center 
                     bg-contain bg-center bg-no-repeat
                     w-[803px] h-[505px] max-w-full max-h-[70vh] md:max-h-[505px]
                     items-center"
          style={{ backgroundImage: `url(${midimg})` }}
        >
          {/* 🔹 FORM */}
 
    <div className="flex flex-col items-center 
                font-['Stardos_Stencil'] 
                text-sm 
                gap-7">

  <h1 className="text-xl">
    Enter details
  </h1>

  <input 
    type="text"
    placeholder="Name"
    className="w-[220px] h-[32px] 
               rounded-full
               text-[#2A1E17] 
               px-4
               bg-gray-200 
               border-2 border-gray-600 
               outline-none"
  />

  <input
    type="text"
    placeholder="Roll number"
    className="w-[220px] h-[32px] 
               rounded-full
               px-4 
               text-[#2A1E17]
               bg-gray-200 
               border-2 border-gray-600 
               outline-none"
  />

  <button
    className="w-[140px] h-[32px] 
               rounded-full 
               bg-[#744F38] 
               border-2 border-black 
               text-black 
               hover:scale-105 
               transition 
               duration-200 text-sm"
  >
    Submit
  </button>

</div>
  
</div>  
      </div>
    </div>
  );
}