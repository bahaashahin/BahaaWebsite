import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import {
  FaArrowRight,
  FaRocket,
  FaGraduationCap,
  FaUsers,
} from "react-icons/fa";
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // مضاعفة المصفوفة لضمان حركة مستمرة ولانهائية بدون فراغات في الـ Marquee
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
    <div className="min-h-screen text-white relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-sans">
      {/* ================= BACKGROUND EFFECTS ================= */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-500/10 blur-[100px] sm:blur-[140px] -top-20 -left-20 animate-pulse duration-10000" />
        <div className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-500/10 blur-[120px] sm:blur-[160px] top-1/2 left-1/3 animate-pulse duration-7000" />
        <div className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-500/10 blur-[100px] sm:blur-[140px] -bottom-20 -right-20 animate-pulse duration-8000" />

        {/* شبكة النقاط التقنية الخلفية */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      </div>

      {/* ================= NAVBAR ================= */}
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-12">
        <section className="flex flex-col-reverse md:flex-row items-center justify-between bg-white/[0.02] border border-white/5 backdrop-blur-2xl p-6 sm:p-10 md:p-12 rounded-[2.5rem] shadow-2xl shadow-black/40 gap-8 md:gap-12 animate-fadeIn relative group overflow-hidden">
          {/* تأثير ضوء مخفي يظهر عند التمرير بالماوس فوق الكرت */}
          <div className="absolute -inset-px bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

          <div className="w-full md:w-1/2 space-y-5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase mx-auto md:mx-0 animate-slideUp">
              <FaRocket className="text-[10px]" /> Next-Gen Learning System
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight animate-slideUp delay-100">
              Master{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Front End
              </span>{" "}
              <br />
              With React JS
            </h1>

            <h2 className="text-lg sm:text-xl text-slate-400 font-medium tracking-wide animate-slideUp delay-200">
              Guided by Mentor:{" "}
              <span className="text-slate-200 font-bold border-b border-indigo-500/30 pb-0.5">
                Bahaa Shaheen
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto md:mx-0 animate-slideUp delay-300">
              Learn how to build high-performance modern web apps, tackle live
              assignments, earn points, and secure your place on the global
              student leaderboard.
            </p>

            <div className="pt-2 animate-slideUp delay-300">
              {isLoggedIn ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Go to Dashboard <FaArrowRight className="text-xs" />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Get Started{" "}
                  <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* صورة المدرب بتأثيرات وتوهج دائري */}
          <div className="w-full md:w-1/2 flex justify-center animate-scaleIn relative">
            <div className="absolute w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10" />
            <div className="p-2 border border-white/10 bg-slate-900/50 rounded-full backdrop-blur-md shadow-2xl">
              <img
                src={heroImage}
                alt="Bahaa Shaheen"
                className="w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full border-2 border-white/10 object-cover shadow-inner hover:scale-[1.03] transition-transform duration-700"
              />
            </div>
          </div>
        </section>
      </main>

      {/* ================= TECHNOLOGIES MARQUEE ================= */}
      <section className="mt-12 sm:mt-20 border-y border-white/[0.04] bg-white/[0.01] py-8 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <h2 className="text-center text-xl sm:text-2xl lg:text-3xl font-black text-slate-300">
            Technologies You Will Learn
          </h2>
        </div>

        {/* الشريط الانسيابي اللانهائي الدوار */}
        <div className="relative w-full overflow-hidden flex items-center Mask-Edges">
          <div className="flex gap-16 items-center whitespace-nowrap animate-marqueeContinuous py-2">
            {logos.map((logo, index) => (
              <img
                key={index}
                src={logo}
                alt="Tech Icon"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-300 filter grayscale hover:grayscale-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section className="mt-20 sm:mt-28 max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">
          {[
            {
              value: "3+",
              label: "Course Levels",
              color: "from-blue-400 to-cyan-400",
              icon: <FaGraduationCap />,
            },
            {
              value: "214+",
              label: "Registered Students",
              color: "from-emerald-400 to-teal-400",
              icon: <FaUsers />,
            },
            {
              value: "3+",
              label: "Years Experience",
              color: "from-purple-400 to-fuchsia-400",
              icon: <FaRocket />,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/[0.02] backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-xl hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 group relative"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="absolute top-4 right-4 text-slate-700 group-hover:text-slate-500 text-lg transition-colors">
                {item.icon}
              </div>
              <h3
                className={`text-4xl sm:text-5xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent font-mono tracking-tight`}
              >
                {item.value}
              </h3>
              <p className="text-slate-400 mt-2.5 text-sm sm:text-base font-medium">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ADVANCED KEYFRAMES & MASKS ================= */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }

          @keyframes marqueeContinuous {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
          .animate-slideUp { opacity: 0; animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .animate-scaleIn { animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          
          /* تشغيل الأنيميشن المتناسق بشكل مستمر بنصف مصفوفة التكرار */
          .animate-marqueeContinuous { 
            animation: marqueeContinuous 22s linear infinite; 
            width: max-content;
            display: flex;
          }
          
          /* إيقاف الحركة مؤقتاً لراحة عين المستخدم عند التمرير الفأرة */
          .animate-marqueeContinuous:hover {
            animation-play-state: paused;
          }

          /* تنعيم حواف الشريط اللامع من اليمين واليسار */
          .Mask-Edges {
            mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, white 15%, white 85%, transparent);
          }

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
