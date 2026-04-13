// src/components/TestimonialCard.jsx
import React from "react";
import { AiFillStar } from "react-icons/ai";
import { FaUserCircle } from "react-icons/fa"; // أيقونة ثابتة للبروفايل

export default function TestimonialCard({ name, feedback }) {
  return (
    <div className="bg-black/50 backdrop-blur-md rounded-2xl shadow-lg p-6 flex flex-col items-center text-center max-w-sm mx-auto">
      {/* Profile Icon */}
      <FaUserCircle className="text-white w-20 h-20 mb-4" />

      {/* Name */}
      <h3 className="text-white font-semibold text-lg mb-2">{name}</h3>

      {/* Stars */}
      <div className="flex mb-3">
        {[...Array(5)].map((_, i) => (
          <AiFillStar key={i} className="text-yellow-400 w-5 h-5" />
        ))}
      </div>

      {/* Feedback */}
      <p className="text-gray-200 text-sm">{feedback}</p>
    </div>
  );
}
