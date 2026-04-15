import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import useAdmin from "../hooks/useAdmin";

export default function AdminSessions() {
  const { isAdmin, loading } = useAdmin();

  const [sessions, setSessions] = useState([]);
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    link: "",
  });

  // 🔥 added points per question
  const [quiz, setQuiz] = useState([
    {
      question: "",
      options: ["", "", ""],
      correct: 0,
      points: 1, // ⭐ NEW
    },
  ]);

  useEffect(() => {
    if (isAdmin) fetchSessions();
  }, [isAdmin]);

  if (loading)
    return <p className="text-white text-center mt-20 text-lg">Loading...</p>;

  if (!isAdmin)
    return <p className="text-white text-center mt-20 text-lg">غير مصرح</p>;

  const fetchSessions = async () => {
    const snap = await getDocs(collection(db, "sessions"));
    setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const handleCreate = async () => {
    await addDoc(collection(db, "sessions"), {
      ...newSession,
      quiz,
      active: true,
      createdAt: Date.now(),
    });

    setNewSession({ title: "", description: "", link: "" });

    setQuiz([{ question: "", options: ["", "", ""], correct: 0, points: 1 }]);

    fetchSessions();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "sessions", id));
    fetchSessions();
  };

  // ================= UI =================
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white px-4 py-10 flex flex-col items-center gap-10">
      <h2 className="text-3xl font-bold text-center">Admin Sessions Panel</h2>

      {/* CREATE */}
      <div className="w-full max-w-2xl bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
        <input
          placeholder="Session Title"
          className="p-3 rounded bg-white/10"
          value={newSession.title}
          onChange={(e) =>
            setNewSession({ ...newSession, title: e.target.value })
          }
        />

        <textarea
          placeholder="Description"
          className="p-3 rounded bg-white/10"
          value={newSession.description}
          onChange={(e) =>
            setNewSession({ ...newSession, description: e.target.value })
          }
        />

        <input
          placeholder="Session Link"
          className="p-3 rounded bg-white/10"
          value={newSession.link}
          onChange={(e) =>
            setNewSession({ ...newSession, link: e.target.value })
          }
        />

        {/* ================= QUIZ ================= */}
        {quiz.map((q, i) => (
          <div key={i} className="bg-black/30 p-4 rounded flex flex-col gap-3">
            <input
              placeholder="Question"
              className="p-2 rounded bg-white/10"
              value={q.question}
              onChange={(e) => {
                const newQuiz = [...quiz];
                newQuiz[i].question = e.target.value;
                setQuiz(newQuiz);
              }}
            />

            {/* OPTIONS */}
            {q.options.map((opt, j) => (
              <input
                key={j}
                placeholder={`Option ${j + 1}`}
                className="p-2 rounded bg-white/10 mb-1"
                value={opt}
                onChange={(e) => {
                  const newQuiz = [...quiz];
                  newQuiz[i].options[j] = e.target.value;
                  setQuiz(newQuiz);
                }}
              />
            ))}

            {/* CORRECT ANSWER */}
            <div className="flex items-center gap-2">
              <span>Correct Answer:</span>
              <select
                className="text-black p-1 rounded"
                value={q.correct}
                onChange={(e) => {
                  const newQuiz = [...quiz];
                  newQuiz[i].correct = Number(e.target.value);
                  setQuiz(newQuiz);
                }}
              >
                <option value={0}>Option 1</option>
                <option value={1}>Option 2</option>
                <option value={2}>Option 3</option>
              </select>
            </div>

            {/* ⭐ POINTS */}
            <input
              type="number"
              placeholder="Question Points"
              className="p-2 rounded bg-white/10"
              value={q.points}
              onChange={(e) => {
                const newQuiz = [...quiz];
                newQuiz[i].points = Number(e.target.value);
                setQuiz(newQuiz);
              }}
            />
          </div>
        ))}

        <button
          onClick={() =>
            setQuiz([
              ...quiz,
              { question: "", options: ["", "", ""], correct: 0, points: 1 },
            ])
          }
          className="bg-gray-700 p-2 rounded"
        >
          + Add Question
        </button>

        <button
          onClick={handleCreate}
          className="bg-blue-600 p-3 rounded font-bold"
        >
          Create Session
        </button>
      </div>

      {/* LIST */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-white/5 p-4 rounded border border-white/10"
          >
            <h3 className="font-bold text-lg">{s.title}</h3>
            <p className="text-gray-300 text-sm">{s.description}</p>

            <a href={s.link} className="text-blue-400 underline">
              Open Session
            </a>

            <button
              onClick={() => handleDelete(s.id)}
              className="bg-red-600 mt-3 px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
