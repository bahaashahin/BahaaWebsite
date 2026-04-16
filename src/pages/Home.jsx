import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import heroImage from "../assets/bahaaa.png";
import logo1 from "../assets/css.svg";
import logo2 from "../assets/js.svg";
import logo3 from "../assets/bootstrap.svg";
import logo4 from "../assets/tailwind.svg";
import logo5 from "../assets/react.svg";
import logo6 from "../assets/vitejs.svg";
import logo7 from "../assets/html.svg";

import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const logos = [
    logo7,
    logo1,
    logo2,
    logo3,
    logo4,
    logo5,
    logo6,
    logo7,
    logo1,
    logo2,
    logo3,
    logo4,
    logo5,
    logo6,
  ];

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-black">
      {/* ================= BACKGROUND EFFECTS ================= */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 blur-[120px] -top-40 -left-40 animate-pulse" />
        <div className="absolute w-[500px] h-[500px] bg-purple-500/20 blur-[140px] -bottom-40 -right-40 animate-pulse" />

        {/* noise texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
      </div>

      {/* ================= NAVBAR ================= */}
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="pt-32 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6 gap-10 bg-black/30 backdrop-blur-xl p-10 rounded-3xl shadow-2xl animate-fadeIn">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl font-bold animate-slideUp">
            Front End React JS
          </h1>

          <h2 className="text-2xl text-gray-300 animate-slideUp delay-100">
            With Bahaa Shaheen
          </h2>

          <p className="text-xl text-gray-200 leading-relaxed animate-slideUp delay-200">
            Learn how to build modern web applications, track tasks, manage
            points, and explore your ranking among peers with a real system.
          </p>

          {!isLoggedIn && (
            <button
              onClick={() => navigate("/login")}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 animate-slideUp delay-300"
            >
              Get Started
            </button>
          )}
        </div>

        <div className="md:w-1/2 flex justify-center animate-scaleIn">
          <img
            src={heroImage}
            alt="Bahaa Shaheen"
            className="w-72 h-72 rounded-full border-4 border-white/20 shadow-2xl object-cover hover:scale-105 transition duration-500"
          />
        </div>
      </section>

      {/* ================= LOGOS ================= */}
      <section className="mt-24 overflow-hidden">
        <h2 className="text-center text-3xl font-bold mb-10 animate-fadeIn">
          Technologies You Will Learn
        </h2>

        <div className="relative w-full overflow-hidden">
          <div className="flex gap-16 w-max animate-marqueeSlow">
            {logos.map((logo, index) => (
              <img
                key={index}
                src={logo}
                alt="tech logo"
                className="w-20 h-20 object-contain opacity-70 hover:opacity-100 hover:scale-110 transition duration-300"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="mt-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { value: "3+", label: "Course Levels", color: "text-blue-400" },
            {
              value: "214+",
              label: "Registered Students",
              color: "text-green-400",
            },
            {
              value: "3+",
              label: "Years Experience",
              color: "text-purple-400",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-xl hover:scale-105 transition duration-500 animate-fadeIn"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <h3 className={`text-5xl font-bold ${item.color}`}>
                {item.value}
              </h3>
              <p className="text-gray-300 mt-3 text-lg">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ANIMATIONS ================= */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }

          @keyframes marqueeSlow {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }

          .animate-fadeIn { animation: fadeIn 1s ease forwards; }
          .animate-slideUp { animation: slideUp 1s ease forwards; }
          .animate-scaleIn { animation: scaleIn 1s ease forwards; }
          .animate-marqueeSlow { animation: marqueeSlow 18s linear infinite; }

          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
        `}
      </style>

      {/* ================= FOOTER ================= */}
      <Testimonials />
      <Footer />
    </div>
  );
}
