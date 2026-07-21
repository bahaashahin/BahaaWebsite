import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaLock, FaLayerGroup, FaPlay } from "react-icons/fa";

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
          setActiveTab(currentLevel); // Default active tab to student's own level
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
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white px-4 sm:px-8 lg:px-12 py-10">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Sessions</h1>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 w-full">
          <div className="bg-white/5 p-5 rounded-2xl text-center border border-white/5">
            <p className="text-gray-400">Total</p>
            <h2 className="text-3xl font-bold">{sessions.length}</h2>
          </div>

          <div className="bg-white/5 p-5 rounded-2xl text-center border border-white/5">
            <p className="text-gray-400">Completed</p>
            <h2 className="text-3xl font-bold text-green-400">
              {completedCount}
            </h2>
          </div>

          <div className="bg-white/5 p-5 rounded-2xl text-center border border-white/5">
            <p className="text-gray-400">Remaining</p>
            <h2 className="text-3xl font-bold text-blue-400">
              {remainingCount}
            </h2>
          </div>
        </div>

        {/* LEVEL TABS */}
        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {[1, 2, 3].map((lvl) => {
            const isLocked = lvl > studentLevel;
            const isActive = activeTab === lvl;

            return (
              <button
                key={lvl}
                onClick={() => !isLocked && setActiveTab(lvl)}
                disabled={isLocked}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border ${
                  isActive
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20 scale-105"
                    : isLocked
                      ? "bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <FaLayerGroup size={16} />
                <span>
                  Level {lvl === 1 ? "One" : lvl === 2 ? "Two" : "Three"}
                </span>
                {isLocked && (
                  <FaLock size={12} className="ml-1 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* GRID OR LOCKED MESSAGE */}
        <div className="w-full">
          {activeTab > studentLevel ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center max-w-md mx-auto my-12 backdrop-blur-md">
              <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <FaLock size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Level Locked
              </h3>
              <p className="text-slate-400 text-sm">
                You must reach Level {activeTab} to access these sessions. Keep
                up the good work!
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
              <p className="text-gray-400">
                No sessions available for this level yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((s) => {
                const data = completedMap?.[s.id];
                const isCompleted = data?.completed === true;
                const score = data?.score;
                const sessionLvl =
                  s.level !== undefined ? s.level : s.Level || 1;

                return (
                  <div
                    key={s.id}
                    className={`relative p-5 rounded-2xl border transition flex flex-col justify-between h-full ${
                      isCompleted
                        ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/5"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h2 className="text-xl font-bold">{s.title}</h2>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 font-bold">
                          Lvl {sessionLvl}
                        </span>
                      </div>

                      <p className="text-gray-300 text-sm mt-2 line-clamp-3">
                        {s.description}
                      </p>

                      {/* BADGES */}
                      <div className="flex gap-2 mt-4 flex-wrap">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/10">
                          Session
                        </span>

                        {s.quiz?.length > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/10">
                            Quiz Available
                          </span>
                        )}

                        {s.sessionFile?.url && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/10">
                            📁 Resources
                          </span>
                        )}

                        {s.sessionCode?.body && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/10">
                            💻 Code Included
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {/* STATUS */}
                      {isCompleted && (
                        <div className="mt-4 text-green-300 text-sm font-semibold flex items-center gap-1">
                          <span>✓ Completed</span>
                          <span className="text-gray-500">•</span>
                          <span>
                            Score: {score} / {s.quiz?.length || 0}
                          </span>
                        </div>
                      )}

                      {/* BUTTON WITH PLAY ICON */}
                      <button
                        onClick={() => navigate(`/session/${s.id}`)}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-500 transition-colors py-2.5 px-4 rounded-xl font-medium text-sm shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 group"
                      >
                        <FaPlay
                          size={12}
                          className="transition-transform group-hover:scale-110"
                        />
                        <span>Enter Session</span>
                      </button>
                    </div>

                    {/* GLOW */}
                    {isCompleted && (
                      <div className="absolute -top-8 -right-8 w-28 h-28 bg-green-500/15 blur-3xl rounded-full pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
