import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import warehouseImg from "./assets/newbg2.png";
import kiitfestImg from "./assets/kiitfest-main-logo20.png";
import midimg from "./assets/mid.png";
import screw from "./assets/screw.png";

const VALIDATE_API_URL = "/api/validate";

const ScrewDecoration = ({ style, animClass }) => (
  <div className="pointer-events-none absolute z-50" style={style}>
    <img
      src={screw}
      alt="Screw"
      className={`w-20 h-20 md:w-28 md:h-28 object-contain opacity-80 drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] ${animClass}`}
    />
  </div>
);

export default function Authenticate({ setCurrentUser }) {
  const [formData, setFormData] = useState({ kfid: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const screwOffset = "-10px";
  const logoTop = "20px";

  const handleChange = (e) => {
    setErrorMessage("");
    setStatusMessage("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const normalizedKfid = formData.kfid.trim().toUpperCase();

    if (!normalizedKfid) {
      setErrorMessage("KFID is required.");
      return;
    }

    if (!/^KF\d{8}$/.test(normalizedKfid)) {
      setErrorMessage(
        "KFID must be in format KF + 8 digits (e.g. KF12345678)."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setStatusMessage("Validating payment...");

    try {
      const response = await axios.post(
        VALIDATE_API_URL,
        {
          kfid: normalizedKfid,
        },
        { timeout: 12000 }
      );
      const data = response?.data || null;

      if (data?.success) {
        if (typeof setCurrentUser === "function") {
          setCurrentUser({
            kfid: normalizedKfid,
            name: data?.data?.name || "",
            email: data?.data?.email || "",
          });
        }

        setStatusMessage("Payment verified. Redirecting...");
        navigate("/home");
        return;
      }

      setErrorMessage(data?.message || "Payment validation failed.");
    } catch (error) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const backendMessage = error?.response?.data?.message;
      const networkCode = error?.code;

      if (code === "PAYMENT_NOT_COMPLETED" || status === 402) {
        setErrorMessage(
          backendMessage || "Payment is not completed for this KFID."
        );
        return;
      }

      if (backendMessage) {
        setErrorMessage(backendMessage);
        return;
      }

      if (status === 500) {
        setErrorMessage("Internal server error. Please try again.");
        return;
      }

      if (
        code === "VALIDATION_SERVICE_UNREACHABLE" ||
        status === 503 ||
        networkCode === "ECONNABORTED" ||
        networkCode === "ERR_NETWORK"
      ) {
        setErrorMessage(
          "Validation service unreachable. Please check internet/server and try again."
        );
        return;
      }

      setErrorMessage("Payment validation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center bg-no-repeat overflow-hidden font-['Stardos_Stencil']"
      style={{ backgroundImage: `url(${warehouseImg})` }}
    >
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        
        @keyframes flicker {
          0%, 19.9%, 22%, 62.9%, 64%, 64.9%, 70%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(116,79,56,0.5); }
          20%, 21.9%, 63%, 63.9%, 65%, 69.9% { opacity: 0.7; text-shadow: none; }
        }

        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }

        @keyframes bgPulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.05); opacity: 0.3; }
        }

        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-flicker { animation: flicker 3s infinite alternate; }

        .btn-active-glow {
          box-shadow: 0 0 20px rgba(116, 79, 56, 0.4);
          transition: all 0.3s ease;
        }

        .btn-active-glow:hover {
          box-shadow: 0 0 30px rgba(207, 123, 68, 0.6);
          transform: translateY(-2px);
        }
      `}</style>

      {/* Breathing Background Layer */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ animation: "bgPulse 8s infinite ease-in-out" }}
      ></div>

      {/* --- LOGO --- */}
      <a
        href="https://kiitfest.org"
        target="_blank"
        rel="nooppener noreferrer"
        className="absolute top-0 left-0 w-full flex justify-center z-50 anim-float"
        style={{ paddingTop: logoTop }}
      >
        <img
          src={kiitfestImg}
          alt="KIIT Fest Logo"
          className="w-48 md:w-56 cursor-pointer drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
        />
      </a>

      {/* --- SCREWS --- */}
      <ScrewDecoration
        style={{ top: screwOffset, left: screwOffset }}
        animClass="animate-spin-18"
      />
      <ScrewDecoration
        style={{ top: screwOffset, right: screwOffset }}
        animClass="animate-spin-22"
      />
      <ScrewDecoration
        style={{ bottom: screwOffset, left: screwOffset }}
        animClass="animate-spin-14"
      />
      <ScrewDecoration
        style={{ bottom: screwOffset, right: screwOffset }}
        animClass="animate-spin-10"
      />

      {/* --- FORM CENTER --- */}
      <div className="w-full h-full flex items-center justify-center relative z-20">
        <div
          className="relative flex items-center justify-center bg-contain bg-center bg-no-repeat w-[95%] max-w-187.5 h-112.5 transition-all duration-500 hover:brightness-110"
          style={{ backgroundImage: `url(${midimg})` }}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-6 mb-4 relative z-10"
          >
            <h1 className="text-4xl md:text-5xl text-black font-bold tracking-[0.2em] anim-flicker uppercase">
              Enter KFID
            </h1>

            <div className="relative flex items-center group">
              <input
                type="text"
                name="kfid"
                value={formData.kfid}
                onChange={handleChange}
                placeholder="KFID"
                maxLength={10}
                required
                className="w-96 h-14 rounded-full px-8 bg-white/95 border-2 border-stone-400 text-black font-bold text-lg outline-none placeholder-stone-400 uppercase shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all focus:border-[#744F38] focus:shadow-[0_0_15px_rgba(116,79,56,0.3)]"
              />
            </div>

            {errorMessage ? (
              <p className="text-red-300 text-center text-base md:text-lg max-w-md">
                {errorMessage}
              </p>
            ) : null}

            {!errorMessage && statusMessage ? (
              <p className="text-[#ffbf75] text-center text-base md:text-lg max-w-md">
                {statusMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-52 h-14 rounded-full bg-[#744F38] text-white text-2xl font-bold tracking-widest transition-all border-b-4 border-[#3a261a] active:border-b-0 active:translate-y-1 btn-active-glow uppercase cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? "Checking..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
