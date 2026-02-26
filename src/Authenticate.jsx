import React, { useState } from "react";
import warehouseImg from "./assets/warehouse.png";
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
          className="w-[180px] md:w-[220px]"
        />
      </div>

      {/* CENTER BOARD & FORM */}
      <div className="w-full h-full flex items-center justify-center relative z-20">
        <div
          className="relative flex items-center justify-center
                     bg-contain bg-center bg-no-repeat
                     w-[700px] h-[400px]"
          style={{ backgroundImage: `url(${midimg})` }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-6 mt-10
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
              className="w-[260px] h-[38px] rounded-full px-4
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
              className="w-[260px] h-[38px] rounded-full px-4
                         bg-gray-200 border-2 border-gray-500 text-black
                         outline-none placeholder-gray-500"
            />

            <button
              type="submit"
              className="w-[170px] h-[40px] rounded-full
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
      <div className="absolute bottom-10 left-10 flex items-end -space-x-4 z-50 bg-red-500/50 p-2">
        <img src={bottle2} alt="bottle left 1" className="w-12 z-10" />
        <img src={bottle2} alt="bottle left 2" className="w-20" />
        <img src={bottle2} alt="bottle left 3" className="w-16 z-10" />
        <img src={bottle2} alt="bottle left 4" className="w-24" />
      </div>

      {/* 🔹 RIGHT BOTTOM BOTTLES (Diagnostic) */}
      <div className="absolute bottom-10 right-10 flex items-end -space-x-4 z-50 bg-blue-500/50 p-2">
        <img src={bottle3} alt="bottle right 1" className="w-16 z-10" />
        <img src={bottle3} alt="bottle right 2" className="w-24" />
        <img src={bottle3} alt="bottle right 3" className="w-12 z-10" />
        <img src={bottle3} alt="bottle right 4" className="w-20" />
      </div>
    </div>
  );
}