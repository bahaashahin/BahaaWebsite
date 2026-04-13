// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-black/70 backdrop-blur-md text-white py-6 mt-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Copyright */}
        <p className="text-gray-300 text-sm">
          &copy; {new Date().getFullYear()} Bahaa Shaheen. All rights reserved.
        </p>

        {/* Right: Contact Us */}
        <a
          href="https://wa.me/201157672372"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-green-400 font-semibold hover:text-green-500 transition"
        >
          Contact Us
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.52 3.48A11.93 11.93 0 0012 0C5.373 0 0 5.373 0 12c0 2.123.555 4.11 1.52 5.87L0 24l6.372-1.472A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12 0-3.18-1.23-6.15-3.48-8.52zM12 22c-2.03 0-3.897-.613-5.464-1.656l-.39-.232-3.78.872.9-3.684-.24-.396A9.958 9.958 0 012 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10zm5.364-7.636l-1.15-.343c-.153-.046-.35-.138-.507-.22-.185-.095-.428-.144-.684-.047-.251.096-.777.3-1.566-.42-.73-.666-1.188-1.31-1.59-2.018-.397-.698-.333-.872-.262-1.01.07-.138.157-.177.26-.283.09-.094.127-.16.19-.267.064-.107.032-.2-.016-.28-.048-.08-.678-1.633-.927-2.248-.244-.607-.493-.524-.684-.534-.176-.01-.38-.01-.583-.01s-.54.08-.824.38c-.283.3-1.09 1.065-1.09 2.597s1.116 3.02 1.27 3.23c.154.21 2.19 3.345 5.31 4.68.742.32 1.32.512 1.77.654.742.22 1.42.19 1.954.116.597-.084 1.825-.744 2.082-1.462.258-.718.258-1.334.18-1.462-.078-.128-.285-.206-.597-.362z" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
