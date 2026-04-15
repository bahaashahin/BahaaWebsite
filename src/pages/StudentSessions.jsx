import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function StudentSessions() {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const snap = await getDocs(collection(db, "sessions"));
    setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white px-4 py-10">
      {/* ================= HEADER ================= */}
      <h1 className="text-3xl font-bold text-center mb-10 pt-10">
        Sessions
      </h1>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-lg hover:scale-[1.03] transition duration-300"
          >
            {/* TITLE */}
            <h2 className="text-xl font-bold text-white">{s.title}</h2>

            {/* DESCRIPTION */}
            <p className="text-gray-300 text-sm line-clamp-3">
              {s.description}
            </p>

            {/* BADGE (optional future use) */}
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

            {/* BUTTON */}
            <button
              onClick={() => navigate(`/session/${s.id}`)}
              className="mt-3 bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-xl font-medium"
            >
              Enter Session
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
