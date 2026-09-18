import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaLock, FaLayerGroup, FaPlay, FaStar } from "react-icons/fa";

export default function StudentSessions() {
  const [sessions, setSessions] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);
  const [completedMap, setCompletedMap] = useState({});
  const [studentLevel, setStudentLevel] = useState(1);
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    fetchData();
  }, [uid]);

  const fetchData = async () => {
    try {
      // 1. Fetch Student Level if logged in (Supports Level or level)
      let currentLevel = 1;

      if (uid) {
        const studentRef = doc(db, "students", uid);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          const studentData = studentSnap.data();

          currentLevel = Number(studentData.Level || studentData.level) || 1;

          setStudentLevel(currentLevel);

          // Default active tab to student's own level
          setActiveTab(currentLevel);
        }
      }

      // 2. Fetch Sessions
      const snap = await getDocs(collection(db, "sessions"));

      let sessionsData = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // ترتيب الأحدث
      sessionsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      setSessions(sessionsData);

      // 3. Fetch Completed Sessions Map
      let completedData = {};

      if (uid) {
        const ref = doc(db, "completedSessions", uid);
        const completedSnap = await getDoc(ref);

        if (completedSnap.exists()) {
          completedData = completedSnap.data();
        }
      }

      setCompletedMap(completedData);

      // Calculate stats
      const total = sessionsData.length;

      const completed = sessionsData.filter(
        (s) => completedData?.[s.id]?.completed === true,
      ).length;

      setCompletedCount(completed);
      setRemainingCount(total - completed);
    } catch (error) {
      console.error("Error fetching student sessions data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions by active tab level (Supports both Level and level)
  const filteredSessions = sessions.filter((s) => {
    const sessionLevel = Number(s.level !== undefined ? s.level : s.Level) || 1;

    return sessionLevel === activeTab;
  });

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Loading Sessions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950 text-white">
      {/* Background Decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-28 top-16 h-80 w-80 rounded-full bg-indigo-500/[0.08] blur-3xl" />

        <div className="absolute -left-32 top-[45%] h-80 w-80 rounded-full bg-violet-500/[0.045] blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[length:30px_30px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        {/* ================= HEADER ================= */}
        <div className="mb-7 sm:mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 sm:text-xs">
                Learning Center
              </p>

              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                Sessions
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">
                Access your learning sessions, resources, quizzes and session
                materials.
              </p>
            </div>

            <div className="mt-2 w-fit rounded-xl border border-indigo-500/15 bg-indigo-500/[0.07] px-3 py-2 sm:mt-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Current Level
              </p>

              <p className="mt-0.5 text-sm font-black text-indigo-300">
                Level {studentLevel}
              </p>
            </div>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="mb-7 grid w-full grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4">
          {/* TOTAL */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/55 p-4 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/20 sm:p-5">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-indigo-500/[0.07] blur-2xl" />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
                  Total Sessions
                </p>

                <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                  {sessions.length}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/15 bg-indigo-500/10 text-indigo-300">
                <FaLayerGroup size={16} />
              </div>
            </div>
          </div>

          {/* COMPLETED */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-slate-900/55 p-4 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30 sm:p-5">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-500/[0.08] blur-2xl" />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500/80 sm:text-xs">
                  Completed
                </p>

                <h2 className="mt-1 text-2xl font-black text-emerald-300 sm:text-3xl">
                  {completedCount}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/10 text-lg font-black text-emerald-300">
                ✓
              </div>
            </div>
          </div>

          {/* REMAINING */}
          <div className="group relative overflow-hidden rounded-2xl border border-blue-500/15 bg-slate-900/55 p-4 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 sm:p-5">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-500/[0.08] blur-2xl" />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400/80 sm:text-xs">
                  Remaining
                </p>

                <h2 className="mt-1 text-2xl font-black text-blue-300 sm:text-3xl">
                  {remainingCount}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/15 bg-blue-500/10 text-blue-300">
                <FaPlay size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* ================= LEVEL TABS ================= */}
        <div className="mb-7 sm:mb-9">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-200 sm:text-sm">
                Learning Levels
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
                Select an available level to view its sessions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-1.5 shadow-lg shadow-black/10 backdrop-blur-xl min-[430px]:grid-cols-3">
            {[1, 2, 3].map((lvl) => {
              const isLocked = lvl > studentLevel;
              const isActive = activeTab === lvl;

              return (
                <button
                  key={lvl}
                  onClick={() => !isLocked && setActiveTab(lvl)}
                  disabled={isLocked}
                  className={`relative flex min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition-all duration-200 sm:px-4 sm:text-sm ${
                    isActive
                      ? "border-indigo-400/30 bg-indigo-500 text-white shadow-lg shadow-indigo-950/35 ring-1 ring-indigo-400/20"
                      : isLocked
                        ? "cursor-not-allowed border-transparent bg-white/[0.015] text-slate-600"
                        : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.045] hover:text-slate-200"
                  }`}
                >
                  <FaLayerGroup size={13} className="shrink-0" />

                  <span className="truncate">
                    Level {lvl === 1 ? "One" : lvl === 2 ? "Two" : "Three"}
                  </span>

                  {isLocked && (
                    <FaLock
                      size={10}
                      className="ml-0.5 shrink-0 text-slate-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= SESSIONS CONTENT ================= */}
        <div className="w-full">
          {activeTab > studentLevel ? (
            /* LOCKED */
            <div className="mx-auto my-10 max-w-lg overflow-hidden rounded-[28px] border border-red-500/15 bg-slate-900/55 p-6 text-center shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-10">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 sm:h-16 sm:w-16">
                <FaLock size={24} />
              </div>

              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-red-400/70">
                Access Restricted
              </p>

              <h3 className="text-xl font-black text-white sm:text-2xl">
                Level Locked
              </h3>

              <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-slate-400 sm:text-sm">
                You must reach Level {activeTab} to access these sessions. Keep
                up the good work!
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            /* EMPTY */
            <div className="rounded-[28px] border border-white/[0.07] bg-slate-900/50 px-5 py-14 text-center shadow-xl shadow-black/10 backdrop-blur-xl sm:py-16">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-slate-500">
                <FaLayerGroup size={18} />
              </div>

              <h3 className="text-base font-bold text-slate-200">
                No Sessions Yet
              </h3>

              <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                No sessions available for this level yet.
              </p>
            </div>
          ) : (
            <>
              {/* Sessions heading */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white sm:text-base">
                    Level {activeTab} Sessions
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
                    {filteredSessions.length} session
                    {filteredSessions.length !== 1 ? "s" : ""} available
                  </p>
                </div>

                <span className="rounded-lg border border-indigo-500/15 bg-indigo-500/[0.07] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-300">
                  Level {activeTab}
                </span>
              </div>

              {/* GRID */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {filteredSessions.map((s) => {
                  const data = completedMap?.[s.id];

                  const isCompleted = data?.completed === true;

                  const score = data?.score;

                  const rating = data?.rating || 0;

                  const sessionLvl =
                    s.level !== undefined ? s.level : s.Level || 1;

                  return (
                    <div
                      key={s.id}
                      className={`group relative flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-[24px] border p-4 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 sm:p-5 ${
                        isCompleted
                          ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.09] via-slate-900/65 to-slate-900/60 hover:border-emerald-400/35"
                          : "border-white/[0.07] bg-slate-900/55 hover:border-indigo-500/20"
                      }`}
                    >
                      {/* Top glow */}
                      <div
                        className={`pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl ${
                          isCompleted
                            ? "bg-emerald-500/10"
                            : "bg-indigo-500/[0.06]"
                        }`}
                      />

                      {/* Card top */}
                      <div className="relative z-10">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                              Learning Session
                            </p>

                            <h2 className="line-clamp-2 text-base font-black leading-snug text-white sm:text-lg">
                              {s.title}
                            </h2>
                          </div>

                          <span className="shrink-0 rounded-lg border border-indigo-500/15 bg-indigo-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-indigo-300">
                            Lvl {sessionLvl}
                          </span>
                        </div>

                        <p className="line-clamp-3 min-h-[3.75rem] text-xs leading-relaxed text-slate-400 sm:text-sm">
                          {s.description}
                        </p>

                        {/* BADGES */}
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          <span className="rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold text-blue-300 sm:text-[10px]">
                            Session
                          </span>

                          {s.quiz?.length > 0 && (
                            <span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300 sm:text-[10px]">
                              Quiz Available
                            </span>
                          )}

                          {s.sessionFile?.url && (
                            <span className="rounded-full border border-indigo-500/15 bg-indigo-500/10 px-2.5 py-1 text-[9px] font-bold text-indigo-300 sm:text-[10px]">
                              📁 Resources
                            </span>
                          )}

                          {s.sessionCode?.body && (
                            <span className="rounded-full border border-teal-500/15 bg-teal-500/10 px-2.5 py-1 text-[9px] font-bold text-teal-300 sm:text-[10px]">
                              💻 Code Included
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom */}
                      <div className="relative z-10 mt-5">
                        {/* STATUS */}
                        {isCompleted && (
                          <div className="mb-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.055] p-3">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold text-emerald-300 sm:text-xs">
                              <span>✓ Completed</span>

                              <span className="text-slate-600">•</span>

                              <span>
                                Score: {score} / {s.quiz?.length || 0}
                              </span>
                            </div>

                            {/* STARS FEEDBACK DISPLAY */}
                            {rating > 0 && (
                              <div className="mt-2.5 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-1.5">
                                <span className="mr-1 text-[9px] text-slate-500 sm:text-[10px]">
                                  Your Rating:
                                </span>

                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar
                                    key={star}
                                    size={11}
                                    className={
                                      rating >= star
                                        ? "text-yellow-400"
                                        : "text-slate-700"
                                    }
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* BUTTON */}
                        <button
                          onClick={() => navigate(`/session/${s.id}`)}
                          className="group/button flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-950/30 transition-all duration-200 hover:bg-indigo-400 active:scale-[0.98] sm:py-3 sm:text-sm"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">
                            <FaPlay
                              size={9}
                              className="transition-transform duration-200 group-hover/button:scale-110"
                            />
                          </span>

                          <span>Enter Session</span>
                        </button>
                      </div>

                      {/* COMPLETED GLOW */}
                      {isCompleted && (
                        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
