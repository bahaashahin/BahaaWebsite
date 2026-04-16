import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function StudentSessions() {
  const [sessions, setSessions] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);
  const [completedMap, setCompletedMap] = useState({}); // 🔥 مهم
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const uid = auth.currentUser?.uid;

    const snap = await getDocs(collection(db, "sessions"));
    let sessionsData = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // 🔥 SORT BY CREATED AT (NEWEST FIRST)
    sessionsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    setSessions(sessionsData);

    let completedData = {};

    if (uid) {
      const completedRef = doc(db, "completedSessions", uid);
      const completedSnap = await getDoc(completedRef);

      if (completedSnap.exists()) {
        completedData = completedSnap.data();
      }
    }

    setCompletedMap(completedData); // 🔥 store map

    const total = sessionsData.length;

    const completed = sessionsData.filter(
      (s) => completedData?.[s.id]?.completed === true,
    ).length;

    setCompletedCount(completed);
    setRemainingCount(total - completed);
  };

  const uid = auth.currentUser?.uid;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-6 pt-10">Sessions</h1>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-6xl mx-auto mb-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-center shadow-lg">
          <p className="text-gray-400 text-sm">Total Sessions</p>
          <h2 className="text-3xl font-bold">{sessions.length}</h2>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-green-500/20 rounded-2xl p-5 text-center shadow-lg">
          <p className="text-gray-400 text-sm">Completed</p>
          <h2 className="text-3xl font-bold text-green-400">
            {completedCount}
          </h2>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-5 text-center shadow-lg">
          <p className="text-gray-400 text-sm">Remaining</p>
          <h2 className="text-3xl font-bold text-blue-400">{remainingCount}</h2>
        </div>
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {sessions.map((s) => {
          const isCompleted = completedMap?.[s.id]?.completed === true; // ✅ FIXED

          return (
            <div
              key={s.id}
              className={`relative backdrop-blur-xl border rounded-2xl p-5 flex flex-col gap-3 shadow-lg transition duration-300 hover:scale-[1.03]
              ${
                isCompleted
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              {/* glow */}
              {isCompleted && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/20 blur-3xl rounded-full" />
              )}

              <h2 className="text-xl font-bold">{s.title}</h2>

              <p className="text-gray-300 text-sm line-clamp-3">
                {s.description}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300">
                  Session
                </span>

                {s.quiz?.length > 0 && (
                  <span className="text-xs px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300">
                    Quiz Available
                  </span>
                )}
              </div>

              <button
                onClick={() => navigate(`/session/${s.id}`)}
                className="mt-3 bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-xl font-medium"
              >
                Enter Session
              </button>

              {isCompleted && (
                <span className="text-xs text-green-300 font-semibold mt-1">
                  ✓ Completed
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
