import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import {
  FaHome,
  FaTasks,
  FaUser,
  FaBook,
  FaSignOutAlt,
  FaUserShield,
  FaBars,
} from "react-icons/fa";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);

      if (u) {
        try {
          const adminSnap = await getDoc(doc(db, "admins", u.uid));
          setIsAdmin(adminSnap.exists());
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // 🔥 دعم الصفحات الديناميك زي /session/:id
  const linkClass = (path) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
      location.pathname.startsWith(path)
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-white hover:text-[#05568d]"
    }`;

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-blue-950 text-white flex-col p-5 z-50">
        <div className="mb-8 font-bold text-lg">
          <Link to="/">Bahaa Shaheen</Link>
        </div>

        <ul className="flex flex-col gap-2 flex-1">
          <Link to="/" className={linkClass("/")}>
            <FaHome /> Home
          </Link>

          {!user && (
            <>
              <Link to="/login" className={linkClass("/login")}>
                <FaUser /> Login
              </Link>
              <Link to="/register" className={linkClass("/register")}>
                <FaUser /> Register
              </Link>
            </>
          )}

          {user && (
            <>
              <Link to="/dashboard" className={linkClass("/dashboard")}>
                <FaUser /> Dashboard
              </Link>

              <Link to="/tasks" className={linkClass("/tasks")}>
                <FaTasks /> Tasks
              </Link>

              {/* 🔥 COURSES (الجديدة) */}
              <Link to="/courses" className={linkClass("/courses")}>
                <FaBook /> Sessions
                <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                  NEW
                </span>
              </Link>

              {isAdmin && (
                <Link to="/admin-points" className={linkClass("/admin-points")}>
                  <FaUserShield /> Admin Points
                </Link>
              )}
            </>
          )}
        </ul>

        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 bg-red-600 px-4 py-3 rounded-lg hover:bg-red-700 transition"
          >
            <FaSignOutAlt /> Logout
          </button>
        )}
      </div>

      {/* ================= MOBILE NAV ================= */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-blue-950 text-white flex justify-between items-center p-4 z-50">
        <span className="font-bold">Bahaa Shaheen</span>

        <button onClick={() => setMobileOpen(true)}>
          <FaBars />
        </button>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <div
        className={`fixed top-0 right-0 h-full w-64 text-white p-5 transition-transform duration-300 z-[999] 
backdrop-blur-2xl bg-white/10 border-l border-white/20 shadow-2xl shadow-black/50
${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <button className="mb-6 text-xl" onClick={() => setMobileOpen(false)}>
          ✖
        </button>

        <ul className="flex flex-col gap-4">
          <Link onClick={() => setMobileOpen(false)} to="/">
            Home
          </Link>

          {!user && (
            <>
              <Link onClick={() => setMobileOpen(false)} to="/login">
                Login
              </Link>
              <Link onClick={() => setMobileOpen(false)} to="/register">
                Register
              </Link>
            </>
          )}

          {user && (
            <>
              <Link onClick={() => setMobileOpen(false)} to="/dashboard">
                Dashboard
              </Link>

              <Link onClick={() => setMobileOpen(false)} to="/tasks">
                Tasks
              </Link>

              {/* 🔥 COURSES */}
              <Link onClick={() => setMobileOpen(false)} to="/courses">
                Sessions
              </Link>

              {isAdmin && (
                <Link onClick={() => setMobileOpen(false)} to="/admin-points">
                  Admin Points
                </Link>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="mt-4 bg-red-600 px-4 py-2 rounded"
              >
                Logout
              </button>
            </>
          )}
        </ul>
      </div>
    </>
  );
}

export default Navbar;
