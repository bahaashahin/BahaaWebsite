import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

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
    setMobileOpen(false);
    navigate("/login");
  };

  // دالة موحدة لتصميم الروابط (تعمل على الهاتف والكمبيوتر)
  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium border ${
      isActive
        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]"
        : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200 active:scale-95"
    }`;
  };

  // مكون فرعي لتقليل التكرار في الروابط
  const NavLinks = ({ isMobile = false }) => {
    const closeOnMobile = () => isMobile && setMobileOpen(false);

    return (
      <div className="flex flex-col gap-2 w-full">
        <Link to="/" onClick={closeOnMobile} className={getLinkStyle("/")}>
          <FaHome
            size={18}
            className={
              location.pathname === "/" ? "text-indigo-400" : "text-slate-500"
            }
          />
          <span>Home</span>
        </Link>

        {!user && (
          <Link
            to="/login"
            onClick={closeOnMobile}
            className={getLinkStyle("/login")}
          >
            <FaUser
              size={18}
              className={
                location.pathname === "/login"
                  ? "text-indigo-400"
                  : "text-slate-500"
              }
            />
            <span>Login</span>
          </Link>
        )}

        {user && (
          <>
            <Link
              to="/dashboard"
              onClick={closeOnMobile}
              className={getLinkStyle("/dashboard")}
            >
              <FaUser
                size={18}
                className={
                  location.pathname === "/dashboard"
                    ? "text-indigo-400"
                    : "text-slate-500"
                }
              />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/tasks"
              onClick={closeOnMobile}
              className={getLinkStyle("/tasks")}
            >
              <FaTasks
                size={18}
                className={
                  location.pathname === "/tasks"
                    ? "text-indigo-400"
                    : "text-slate-500"
                }
              />
              <span>Tasks</span>
            </Link>

            <Link
              to="/courses"
              onClick={closeOnMobile}
              className={getLinkStyle("/courses")}
            >
              <FaBook
                size={18}
                className={
                  location.pathname === "/courses"
                    ? "text-indigo-400"
                    : "text-slate-500"
                }
              />
              <span className="flex-1">Sessions</span>
              <span className="text-[10px] font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-1 rounded-full shadow-lg shadow-indigo-500/20 tracking-wider">
                NEW
              </span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin-points"
                onClick={closeOnMobile}
                className={getLinkStyle("/admin-points")}
              >
                <FaUserShield
                  size={18}
                  className={
                    location.pathname === "/admin-points"
                      ? "text-indigo-400"
                      : "text-slate-500"
                  }
                />
                <span>Admin Panel</span>
              </Link>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden md:flex fixed top-0 left-0 h-full w-72 bg-[#0B0F19] text-slate-100 flex-col p-6 z-50 border-r border-slate-800/50 shadow-2xl selection:bg-indigo-500/30">
        {/* LOGO */}
        <div className="mb-10 px-2">
          <Link
            to="/"
            className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 drop-shadow-sm"
          >
            Bahaa Shaheen
          </Link>
        </div>

        {/* LINKS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <NavLinks />
        </div>

        {/* LOGOUT */}
        {user && (
          <div className="pt-6 border-t border-slate-800/50 mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 font-medium px-4 py-4 rounded-2xl hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 active:scale-95"
            >
              <FaSignOutAlt size={18} /> Logout
            </button>
          </div>
        )}
      </div>

      {/* ================= MOBILE TOP BAR ================= */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-slate-800/50 text-white flex justify-between items-center px-6 z-40 shadow-sm">
        <Link
          to="/"
          className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-400"
        >
          Bahaa Shaheen
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-slate-300 hover:text-white p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 transition-colors active:scale-90"
        >
          <FaBars size={20} />
        </button>
      </div>

      {/* ================= MOBILE MENU (DRAWER) ================= */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/60 z-[998] backdrop-blur-md"
            />

            {/* Side Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 250 }}
              className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-[#0B0F19] text-white p-6 flex flex-col z-[999] shadow-2xl border-l border-slate-800/50"
            >
              {/* Mobile Menu Header */}
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-800/50">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-400">
                  Menu
                </span>
                <button
                  className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-xl border border-slate-700/50 transition-colors active:scale-90"
                  onClick={() => setMobileOpen(false)}
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Mobile Links */}
              <div className="flex-1 overflow-y-auto">
                <NavLinks isMobile={true} />
              </div>

              {/* Mobile Logout */}
              {user && (
                <div className="pt-6 border-t border-slate-800/50 mt-auto">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 font-medium px-4 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300 active:scale-95"
                  >
                    <FaSignOutAlt size={18} /> Logout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
