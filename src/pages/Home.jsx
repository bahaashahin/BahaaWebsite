import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import heroImage from "../assets/bahaaa.png";
import bgImage from "../assets/back.png";
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
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
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
    logo7,
    logo1,
    logo2,
    logo3,
    logo4,
    logo5,
    logo6,
    logo7,
  ];

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Navbar />
      
      {/* Decorative bubbles */}
      <span className="absolute w-72 h-72 bg-white/10 rounded-full -top-20 -left-20 animate-pulse"></span>
      <span className="absolute w-96 h-96 bg-white/10 rounded-full -bottom-32 -right-32 animate-pulse"></span>

      {/* Hero Section */}
      <section className="pt-32 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6 gap-10 backdrop-blur-sm bg-black/30 p-10 rounded-3xl">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl font-bold animate-fadeIn">
            Front End React JS
          </h1>

          <h2 className="text-2xl text-gray-300 animate-fadeIn delay-200">
            With Bahaa Shaheen
          </h2>

          <p className="text-xl text-gray-200 animate-fadeIn delay-400">
            Learn how to build modern web applications, track tasks, manage
            points, and explore your ranking among peers.
          </p>

          {!isLoggedIn && (
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 animate-fadeIn delay-600"
            >
              Get Started
            </button>
          )}
        </div>

        <div className="md:w-1/2 flex justify-center animate-fadeIn delay-600">
          <img
            src={heroImage}
            alt="Bahaa Shaheen"
            className="w-64 h-64 rounded-full border-4 border-white shadow-lg object-cover"
          />
        </div>
      </section>

      {/* Logos Slider */}
      <section className="mt-20 overflow-hidden">
        <h2 className="text-center text-3xl font-bold mb-8">
          Technologies You Will Learn
        </h2>

        <div className="relative w-full overflow-hidden">
          <div className="flex gap-16 animate-marquee">
            {logos.map((logo, index) => (
              <img
                key={index}
                src={logo}
                alt="tech logo"
                className="w-24 h-24 object-contain opacity-80 hover:opacity-100 transition"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mt-24 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="bg-black/40 backdrop-blur-md p-10 rounded-2xl shadow-lg">
            <h3 className="text-5xl font-bold text-blue-400">3+</h3>
            <p className="text-gray-300 mt-3 text-lg">Course Levels</p>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-10 rounded-2xl shadow-lg">
            <h3 className="text-5xl font-bold text-green-400">214+</h3>
            <p className="text-gray-300 mt-3 text-lg">Registered Students</p>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-10 rounded-2xl shadow-lg">
            <h3 className="text-5xl font-bold text-purple-400">3+</h3>
            <p className="text-gray-300 mt-3 text-lg">Years Experience</p>
          </div>
        </div>
      </section>

      {/* Tailwind animation classes */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-fadeIn {
            animation: fadeIn 1s ease forwards;
          }

          .animate-fadeIn.delay-200 {
            animation-delay: 0.2s;
          }

          .animate-fadeIn.delay-400 {
            animation-delay: 0.4s;
          }

          .animate-fadeIn.delay-600 {
            animation-delay: 0.6s;
          }

          @keyframes marquee {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }

          .animate-marquee {
            animation: marquee 12s linear infinite;
          }
        `}
      </style>
      <Testimonials />
      <Footer />
    </div>
  );
}
