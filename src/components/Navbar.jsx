import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion"; // تم إضافة Framer Motion للأنيميشن

import {
  FaHome,
  FaTasks,
  FaUser,
  FaBook,
  FaSignOutAlt,
  FaUserShield,
  FaBars,
  FaTimes,
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
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out transform hover:translate-x-1 ${
      location.pathname === path
        ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <>
      {/* ================= DESKTOP ================= */}
      <div className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-slate-950 text-white flex-col p-6 z-50 border-r border-white/10 shadow-2xl">
        {/* LOGO */}
        <div className="mb-10 text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          <Link to="/">Bahaa Shaheen</Link>
        </div>

        {/* LINKS */}
        <ul className="flex flex-col gap-2 flex-1">
          <Link to="/" className={linkClass("/")}>
            <FaHome /> Home
          </Link>

          {!user && (
            <Link to="/login" className={linkClass("/login")}>
              <FaUser /> Login
            </Link>
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
                <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
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
            className="flex items-center gap-3 mt-4 bg-red-500/5 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all duration-300"
          >
            <FaSignOutAlt /> Logout
          </button>
        )}
      </div>

      {/* ================= MOBILE TOP BAR ================= */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-white/10 text-white flex justify-between items-center p-4 z-40">
        <span className="font-bold tracking-wide">Bahaa Shaheen</span>
        <button onClick={() => setMobileOpen(true)} className="text-xl p-2">
          <FaBars />
        </button>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-[998] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-72 bg-slate-900 text-white p-6 z-[999] shadow-2xl border-l border-white/10"
            >
              <button
                className="mb-8 text-xl"
                onClick={() => setMobileOpen(false)}
              >
                <FaTimes />
              </button>

              <ul className="flex flex-col gap-6 text-lg font-medium">
                <Link onClick={() => setMobileOpen(false)} to="/">
                  Home
                </Link>
                {!user ? (
                  <Link onClick={() => setMobileOpen(false)} to="/login">
                    Login
                  </Link>
                ) : (
                  <>
                    <Link onClick={() => setMobileOpen(false)} to="/dashboard">
                      Dashboard
                    </Link>
                    <Link onClick={() => setMobileOpen(false)} to="/tasks">
                      Tasks
                    </Link>
                    <Link onClick={() => setMobileOpen(false)} to="/courses">
                      Sessions
                    </Link>
                    {isAdmin && (
                      <Link
                        onClick={() => setMobileOpen(false)}
                        to="/admin-points"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="text-left text-red-400"
                    >
                      Logout
                    </button>
                  </>
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
