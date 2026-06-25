import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function StudentSessions() {
  const [sessions, setSessions] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);
  const [completedMap, setCompletedMap] = useState({});

  const navigate = useNavigate();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const snap = await getDocs(collection(db, "sessions"));

    let sessionsData = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // ترتيب الأحدث
    sessionsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    setSessions(sessionsData);

    let completedData = {};

    if (uid) {
      const ref = doc(db, "completedSessions", uid);
      const completedSnap = await getDoc(ref);

      if (completedSnap.exists()) {
        completedData = completedSnap.data();
      }
    }

    setCompletedMap(completedData);

    const total = sessionsData.length;

    const completed = sessionsData.filter(
      (s) => completedData?.[s.id]?.completed === true,
    ).length;

    setCompletedCount(completed);
    setRemainingCount(total - completed);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-6">Sessions</h1>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-6xl mx-auto mb-10 w-full">
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
          <h2 className="text-3xl font-bold text-blue-400">{remainingCount}</h2>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
        {sessions.map((s) => {
          const data = completedMap?.[s.id];
          const isCompleted = data?.completed === true;
          const score = data?.score;

          return (
            <div
              key={s.id}
              className={`relative p-5 rounded-2xl border transition flex flex-col justify-between h-full
              ${
                isCompleted
                  ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/5"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div>
                <h2 className="text-xl font-bold">{s.title}</h2>

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

                  {/* شارة الملف المرفق */}
                  {s.sessionFile?.url && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/10">
                      📁 Resources
                    </span>
                  )}

                  {/* شارة الكود المرفق */}
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

                {/* BUTTON */}
                <button
                  onClick={() => navigate(`/session/${s.id}`)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-500 transition-colors py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-blue-600/10"
                >
                  Enter Session
                </button>
              </div>

              {/* GLOW */}
              {isCompleted && (
                <div className="absolute -top-8 -right-8 w-28 h-28 bg-green-500/10 blur-3xl rounded-full pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
