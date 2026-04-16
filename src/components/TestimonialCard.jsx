// src/components/TestimonialCard.jsx
import React from "react";
import { AiFillStar } from "react-icons/ai";
import { FaUserCircle } from "react-icons/fa";

export default function TestimonialCard({ name, feedback }) {
  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-6 flex flex-col items-center text-center max-w-sm mx-auto transition duration-300 hover:scale-[1.03] hover:bg-white/10">
      {/* glow effect */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />

      {/* Profile Icon */}
      <div className="p-3 rounded-full bg-white/5 border border-white/10 shadow-md mb-4">
        <FaUserCircle className="text-white w-16 h-16" />
      </div>

      {/* Name */}
      <h3 className="text-white font-semibold text-lg mb-2 tracking-wide">
        {name}
      </h3>

      {/* Stars */}
      <div className="flex mb-3">
        {[...Array(5)].map((_, i) => (
          <AiFillStar key={i} className="text-yellow-400 w-5 h-5 drop-shadow" />
        ))}
      </div>

      {/* Feedback */}
      <p className="text-gray-300 text-sm leading-relaxed">{feedback}</p>
    </div>
  );
}
