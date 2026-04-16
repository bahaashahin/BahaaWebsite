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

  const linkClass = (path) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition duration-300 relative overflow-hidden
    ${
      location.pathname.startsWith(path)
        ? "bg-white/10 text-white border border-white/20 shadow-md"
        : "text-gray-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <>
      {/* ================= DESKTOP ================= */}
      <div className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex-col p-5 z-50 border-r border-white/10">
        {/* LOGO */}
        <div className="mb-10 text-xl font-bold tracking-wide text-white">
          <Link to="/">Bahaa Shaheen</Link>
        </div>

        {/* LINKS */}
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

              <Link to="/courses" className={linkClass("/courses")}>
                <FaBook /> Sessions
                <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
                  NEW
                </span>
              </Link>

              {isAdmin && (
                <Link to="/admin-points" className={linkClass("/admin-points")}>
                  <FaUserShield /> Admin
                </Link>
              )}
            </>
          )}
        </ul>

        {/* LOGOUT */}
        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 mt-4 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl hover:bg-red-500/20 transition"
          >
            <FaSignOutAlt /> Logout
          </button>
        )}
      </div>

      {/* ================= MOBILE TOP BAR ================= */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-black/40 backdrop-blur-xl border-b border-white/10 text-white flex justify-between items-center p-4 z-50">
        <span className="font-bold tracking-wide">Bahaa Shaheen</span>

        <button
          onClick={() => setMobileOpen(true)}
          className="text-xl hover:scale-110 transition"
        >
          <FaBars />
        </button>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <div
        className={`fixed top-0 right-0 h-full w-72 text-white p-6 transition-transform duration-300 z-[999]
        backdrop-blur-2xl bg-black/40 border-l border-white/10 shadow-2xl
        ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <button
          className="mb-6 text-xl hover:scale-110 transition"
          onClick={() => setMobileOpen(false)}
        >
          ✖
        </button>

        <ul className="flex flex-col gap-4">
          <Link
            onClick={() => setMobileOpen(false)}
            to="/"
            className="hover:text-blue-400 transition"
          >
            Home
          </Link>

          {!user && (
            <>
              <Link
                onClick={() => setMobileOpen(false)}
                to="/login"
                className="hover:text-blue-400 transition"
              >
                Login
              </Link>

              <Link
                onClick={() => setMobileOpen(false)}
                to="/register"
                className="hover:text-blue-400 transition"
              >
                Register
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                onClick={() => setMobileOpen(false)}
                to="/dashboard"
                className="hover:text-blue-400 transition"
              >
                Dashboard
              </Link>

              <Link
                onClick={() => setMobileOpen(false)}
                to="/tasks"
                className="hover:text-blue-400 transition"
              >
                Tasks
              </Link>

              <Link
                onClick={() => setMobileOpen(false)}
                to="/courses"
                className="hover:text-blue-400 transition"
              >
                Sessions
              </Link>

              {isAdmin && (
                <Link
                  onClick={() => setMobileOpen(false)}
                  to="/admin-points"
                  className="hover:text-blue-400 transition"
                >
                  Admin Points
                </Link>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="mt-6 w-full bg-red-500/20 border border-red-500/30 text-red-300 py-2 rounded-xl hover:bg-red-500/30 transition"
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
