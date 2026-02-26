import React, { useState } from "react";
import warehouseImg from "./assets/newbg.png";
import kiitfestImg from "./assets/kiitfest-main-logo 20.png";
import midimg from "./assets/mid.png";
import bottle2 from "./assets/2bottle.png";
import bottle3 from "./assets/3bottle.png";

export default function Authenticate() {
  const [formData, setFormData] = useState({ name: "", roll: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${warehouseImg})` }}
    >
      {/* LOGO SECTION */}
      <div className="absolute top-6 left-0 w-full flex justify-center z-50">
        <img
          src={kiitfestImg}
          alt="KIIT Fest Logo"
          className="w-45 md:w-55"
        />
      </div>

      {/* CENTER BOARD & FORM */}
      <div className="w-full h-full flex items-center justify-center relative z-20">
        <div
          className="relative flex items-center justify-center
                     bg-contain bg-center bg-no-repeat
                     w-175 h-100"
          style={{ backgroundImage: `url(${midimg})` }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-4 mt-10
                       font-['Stardos_Stencil']"
          >
            <h1 className="text-3xl mb-2 text-black">Enter details</h1>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              required
              className="w-65 h-9.5 rounded-full px-4
                         bg-gray-200 border-2 border-gray-500 text-black
                         outline-none placeholder-gray-500"
            />

            <input
              type="text"
              name="roll"
              value={formData.roll}
              onChange={handleChange}
              placeholder="Roll number"
              required
              className="w-65 h-9.5 rounded-full px-4
                         bg-gray-200 border-2 border-gray-500 text-black
                         outline-none placeholder-gray-500"
            />

            <button
              type="submit"
              className="w-42.5 h-10 rounded-full
                         bg-[#744F38] text-white
                         hover:scale-105 transition duration-200
                         border-none outline-none cursor-pointer"
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {/* 🔹 LEFT BOTTOM BOTTLES (Diagnostic) */}
      <div className="absolute bottom-1 left-2 flex items-end -space-x-4 z-50  p-2">
        <img src={bottle2} alt="bottle left 1" className="w-34 z-10" />
        <img src={bottle3} alt="bottle right 2" className="w-40 z-9" />
        <img src={bottle3} alt="bottle right 3" className="w-32 z-10 " />
        <img src={bottle2} alt="bottle left 2" className="w-25" />
    
      </div>

      {/* 🔹 RIGHT BOTTOM BOTTLES (Diagnostic) */}
      <div className="absolute bottom-1 right-2 flex items-end -space-x-4 z-50 p-2">
        <img src={bottle2} alt="bottle left 1" className="w-34 z-10" />
        <img src={bottle3} alt="bottle right 2" className="w-40 z-45" />
        <img src={bottle3} alt="bottle right 3" className="w-32 z-10 " />
        <img src={bottle2} alt="bottle left 2" className="w-25" />
    
      </div>
    </div>
  );
}