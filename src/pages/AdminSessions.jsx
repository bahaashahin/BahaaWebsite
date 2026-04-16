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
import { FaTrash } from "react-icons/fa";

export default function AdminSessions() {
  const { isAdmin, loading } = useAdmin();

  const [sessions, setSessions] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null); // ⭐ NEW

  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    link: "",
  });

  const [quiz, setQuiz] = useState([
    {
      question: "",
      options: ["", "", ""],
      correct: 0,
      points: 1,
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white px-4 py-10 flex flex-col items-center gap-10">
      <h2 className="text-3xl font-bold text-center">Admin Sessions Panel</h2>

      {/* ================= CREATE ================= */}
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

        {/* QUIZ */}
        {quiz.map((q, i) => (
          <div
            key={i}
            className="bg-black/30 p-4 rounded flex flex-col gap-3 relative"
          >
            <button
              onClick={() => {
                const newQuiz = quiz.filter((_, index) => index !== i);
                setQuiz(newQuiz);
              }}
              className="absolute top-3 right-3 text-red-400"
            >
              <FaTrash />
            </button>

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

            {q.options.map((opt, j) => (
              <input
                key={j}
                placeholder={`Option ${j + 1}`}
                className="p-2 rounded bg-white/10"
                value={opt}
                onChange={(e) => {
                  const newQuiz = [...quiz];
                  newQuiz[i].options[j] = e.target.value;
                  setQuiz(newQuiz);
                }}
              />
            ))}

            <div className="flex items-center gap-2">
              <span>Correct:</span>
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

            <input
              type="number"
              placeholder="Points"
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

      {/* ================= LIST ================= */}
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

            {/* ⭐ VIEW QUIZ BUTTON */}
            <button
              onClick={() => setSelectedQuiz(s.quiz)}
              className="bg-indigo-600 px-3 py-1 rounded mt-3 mr-2"
            >
              View Quiz
            </button>

            <button
              onClick={() => handleDelete(s.id)}
              className="bg-red-600 px-3 py-1 rounded mt-3"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* ================= QUIZ MODAL ================= */}
      {selectedQuiz && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 max-w-2xl w-full p-6 rounded-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Quiz Preview</h2>

            {selectedQuiz.map((q, i) => (
              <div key={i} className="mb-5 bg-white/5 p-4 rounded">
                <h3 className="font-bold mb-2">
                  {i + 1}. {q.question}
                </h3>

                {q.options.map((opt, j) => (
                  <p
                    key={j}
                    className={`p-1 ${
                      j === q.correct ? "text-green-400 font-bold" : ""
                    }`}
                  >
                    {opt}
                  </p>
                ))}
              </div>
            ))}

            <button
              onClick={() => setSelectedQuiz(null)}
              className="mt-3 bg-red-600 px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
