import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { AnimatePresence, motion } from "framer-motion";

import {
  FaBars,
  FaBook,
  FaHome,
  FaSignOutAlt,
  FaTasks,
  FaTimes,
  FaUser,
  FaUserShield,
} from "react-icons/fa";

import { auth, db } from "../firebase";

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

  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;

    return `
      group
      relative
      flex
      w-full
      items-center
      gap-3
      rounded-xl
      border
      px-3.5
      py-3
      text-sm
      font-semibold
      transition-colors
      duration-150
      ${
        isActive
          ? `
            border-indigo-500/25
            bg-indigo-500/10
            text-white
          `
          : `
            border-transparent
            text-slate-400
            hover:border-white/[0.06]
            hover:bg-white/[0.04]
            hover:text-slate-100
          `
      }
    `;
  };

  const getIconStyle = (path) => {
    const isActive = location.pathname === path;

    return `
      flex
      h-9
      w-9
      shrink-0
      items-center
      justify-center
      rounded-xl
      transition-colors
      duration-150
      ${
        isActive
          ? `
            bg-indigo-500/15
            text-indigo-400
            ring-1
            ring-indigo-500/20
          `
          : `
            bg-white/[0.025]
            text-slate-500
            group-hover:bg-white/[0.05]
            group-hover:text-slate-300
          `
      }
    `;
  };

  const NavLinks = ({ isMobile = false }) => {
    const closeOnMobile = () => {
      if (isMobile) {
        setMobileOpen(false);
      }
    };

    return (
      <nav className="flex w-full flex-col gap-1.5">
        {/* HOME */}
        <Link to="/" onClick={closeOnMobile} className={getLinkStyle("/")}>
          <span className={getIconStyle("/")}>
            <FaHome size={15} />
          </span>

          <span className="flex-1">Home</span>

          {location.pathname === "/" && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          )}
        </Link>

        {/* LOGIN */}
        {!user && (
          <Link
            to="/login"
            onClick={closeOnMobile}
            className={getLinkStyle("/login")}
          >
            <span className={getIconStyle("/login")}>
              <FaUser size={15} />
            </span>

            <span className="flex-1">Login</span>

            {location.pathname === "/login" && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            )}
          </Link>
        )}

        {/* LOGGED IN LINKS */}
        {user && (
          <>
            {/* DASHBOARD */}
            <Link
              to="/dashboard"
              onClick={closeOnMobile}
              className={getLinkStyle("/dashboard")}
            >
              <span className={getIconStyle("/dashboard")}>
                <FaUser size={15} />
              </span>

              <span className="flex-1">Dashboard</span>

              {location.pathname === "/dashboard" && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              )}
            </Link>

            {/* TASKS */}
            <Link
              to="/tasks"
              onClick={closeOnMobile}
              className={getLinkStyle("/tasks")}
            >
              <span className={getIconStyle("/tasks")}>
                <FaTasks size={15} />
              </span>

              <span className="flex-1">Tasks</span>

              {location.pathname === "/tasks" && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              )}
            </Link>

            {/* SESSIONS */}
            <Link
              to="/courses"
              onClick={closeOnMobile}
              className={getLinkStyle("/courses")}
            >
              <span className={getIconStyle("/courses")}>
                <FaBook size={15} />
              </span>

              <span className="flex-1">Sessions</span>

              <span className="rounded-full border border-indigo-400/15 bg-indigo-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white">
                New
              </span>
            </Link>

            {/* ADMIN */}
            {isAdmin && (
              <>
                <div className="my-2 h-px w-full bg-white/[0.06]" />

                <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  Administration
                </p>

                <Link
                  to="/admin-points"
                  onClick={closeOnMobile}
                  className={getLinkStyle("/admin-points")}
                >
                  <span className={getIconStyle("/admin-points")}>
                    <FaUserShield size={15} />
                  </span>

                  <span className="flex-1">Admin Panel</span>

                  {location.pathname === "/admin-points" && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  )}
                </Link>
              </>
            )}
          </>
        )}
      </nav>
    );
  };

  return (
    <>
      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-white/[0.06] bg-[#080C14] text-slate-100 shadow-xl md:flex lg:w-72">
        <div className="relative z-10 flex h-full flex-col">
          {/* LOGO */}
          <div className="px-5 pb-5 pt-6 lg:px-6 lg:pt-7">
            <Link to="/" className="group block">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-lg font-black text-indigo-300">
                  BS
                </div>

                <div className="min-w-0">
                  <h1 className="truncate bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-lg font-black tracking-tight text-transparent lg:text-xl">
                    Bahaa Shaheen
                  </h1>

                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Learning Platform
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="mx-5 h-px bg-white/[0.06] lg:mx-6" />

          {/* NAVIGATION */}
          <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar lg:px-5">
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Navigation
            </p>

            <NavLinks />
          </div>

          {/* BOTTOM */}
          <div className="relative px-4 pb-5 lg:px-5 lg:pb-6">
            {user && (
              <>
                <div className="mb-4 h-px bg-white/[0.06]" />

                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <FaUser size={13} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                      Signed in
                    </p>

                    <p className="truncate text-[11px] font-semibold text-slate-300">
                      {user?.email || "Student account"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-sm font-semibold text-red-400 transition-colors duration-150 hover:bg-red-500/15 hover:text-red-300 active:scale-[0.98]"
                >
                  <FaSignOutAlt size={14} />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* =====================================================
          MOBILE TOP BAR
      ====================================================== */}

      <header className="fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/[0.07] bg-[#080C14] px-4 text-white shadow-md md:hidden sm:px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-xs font-black text-indigo-300">
            BS
          </div>

          <div className="min-w-0">
            <p className="truncate bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-base font-black tracking-tight text-transparent sm:text-lg">
              Bahaa Shaheen
            </p>

            <p className="hidden text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-600 min-[380px]:block">
              Learning Platform
            </p>
          </div>
        </Link>

        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-slate-300 transition-colors duration-150 hover:bg-indigo-500/10 hover:text-white active:scale-90"
        >
          <FaBars size={17} />
        </button>
      </header>

      {/* =====================================================
          MOBILE DRAWER
      ====================================================== */}

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.15,
                ease: "easeOut",
              }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[998] bg-slate-950/80 md:hidden"
            />

            {/* DRAWER */}
            <motion.aside
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                willChange: "transform",
              }}
              className="fixed right-0 top-0 z-[999] flex h-[100dvh] w-[88%] max-w-[360px] flex-col overflow-hidden border-l border-white/[0.07] bg-[#080C14] text-white shadow-xl md:hidden"
            >
              <div className="flex h-full flex-col">
                {/* HEADER */}
                <div className="flex min-h-20 items-center justify-between border-b border-white/[0.06] px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-sm font-black text-indigo-300">
                      BS
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-white">
                        Bahaa Shaheen
                      </p>

                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        Navigation
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-slate-400 transition-colors duration-150 hover:bg-white/[0.08] hover:text-white active:scale-90"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>

                {/* LINKS */}
                <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
                  <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
                    Navigation
                  </p>

                  <NavLinks isMobile />
                </div>

                {/* BOTTOM */}
                {user && (
                  <div className="border-t border-white/[0.06] bg-[#080C14] p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                        <FaUser size={13} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                          Signed in as
                        </p>

                        <p className="truncate text-[11px] font-semibold text-slate-300">
                          {user?.email || "Student account"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-red-500/15 bg-red-500/[0.07] px-4 py-3 text-sm font-semibold text-red-400 transition-colors duration-150 hover:bg-red-500/15 hover:text-red-300 active:scale-[0.98]"
                    >
                      <FaSignOutAlt size={14} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
