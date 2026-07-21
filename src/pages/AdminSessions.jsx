import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import useAdmin from "../hooks/useAdmin";
import { FaTrash, FaEdit, FaTimes } from "react-icons/fa";

export default function AdminSessions() {
  const { isAdmin, loading } = useAdmin();

  const [sessions, setSessions] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // States for Editing Session
  const [editingId, setEditingId] = useState(null);

  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    link: "",
    youtubeLink: "", // ⭐ Added YouTube link field
    level: 1, // ⭐ Level selection added (default 1)
    sessionFile: { title: "", url: "" },
    sessionCode: { title: "", body: "" },
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

  const handleSaveSession = async () => {
    if (editingId) {
      // Update existing session
      await updateDoc(doc(db, "sessions", editingId), {
        ...newSession,
        quiz,
      });
    } else {
      // Create new session
      await addDoc(collection(db, "sessions"), {
        ...newSession,
        quiz,
        active: true,
        createdAt: Date.now(),
      });
    }

    resetForm();
    fetchSessions();
  };

  const handleEditClick = (s) => {
    setEditingId(s.id);
    setNewSession({
      title: s.title || "",
      description: s.description || "",
      link: s.link || "",
      youtubeLink: s.youtubeLink || "", // ⭐ Load YouTube link on edit
      level: Number(s.level) || 1,
      sessionFile: {
        title: s.sessionFile?.title || "",
        url: s.sessionFile?.url || "",
      },
      sessionCode: {
        title: s.sessionCode?.title || "",
        body: s.sessionCode?.body || "",
      },
    });
    setQuiz(
      s.quiz && s.quiz.length > 0
        ? s.quiz
        : [{ question: "", options: ["", "", ""], correct: 0, points: 1 }],
    );
    // Scroll smoothly to top form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setNewSession({
      title: "",
      description: "",
      link: "",
      youtubeLink: "",
      level: 1,
      sessionFile: { title: "", url: "" },
      sessionCode: { title: "", body: "" },
    });
    setQuiz([{ question: "", options: ["", "", ""], correct: 0, points: 1 }]);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "sessions", id));
    fetchSessions();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white px-4 sm:px-8 lg:px-12 py-10 flex flex-col items-center gap-10">
      <div className="w-full max-w-5xl flex flex-col items-center gap-10">
        <h2 className="text-3xl font-bold text-center">Admin Sessions Panel</h2>

        {/* ================= CREATE / EDIT FORM ================= */}
        <div className="w-full max-w-2xl bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-4 relative">
          {editingId && (
            <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-blue-300 text-sm">
              <span>Editing Session Mode...</span>
              <button
                onClick={resetForm}
                className="text-white hover:text-red-400 flex items-center gap-1 font-bold"
              >
                <FaTimes /> Cancel Edit
              </button>
            </div>
          )}

          <h3 className="text-lg font-semibold border-b border-white/10 pb-2 text-blue-400">
            {editingId ? "Edit Session Details" : "Main Details"}
          </h3>

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
            placeholder="Session Link (Video/Meeting)"
            className="p-3 rounded bg-white/10"
            value={newSession.link}
            onChange={(e) =>
              setNewSession({ ...newSession, link: e.target.value })
            }
          />

          {/* ⭐ YouTube Link Input */}
          <input
            placeholder="YouTube Link (e.g., https://youtube.com/...)"
            className="p-3 rounded bg-white/10 border border-red-500/20 focus:border-red-500 outline-none"
            value={newSession.youtubeLink}
            onChange={(e) =>
              setNewSession({ ...newSession, youtubeLink: e.target.value })
            }
          />

          {/* ⭐ Level Selection for Session */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">
              Session Level Target:
            </label>
            <select
              className="p-3 rounded bg-white/10 text-white border border-white/10"
              value={newSession.level}
              onChange={(e) =>
                setNewSession({ ...newSession, level: Number(e.target.value) })
              }
            >
              <option value={1} className="bg-slate-900 text-white">
                Level One (1)
              </option>
              <option value={2} className="bg-slate-900 text-white">
                Level Two (2)
              </option>
              <option value={3} className="bg-slate-900 text-white">
                Level Three (3)
              </option>
            </select>
          </div>

          {/* ATTACHMENTS (FILES & CODE) */}
          <h3 className="text-lg font-semibold border-b border-white/10 pt-4 pb-2 text-indigo-400">
            Session Resources (Optional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="File Title (e.g., Session Presentation)"
              className="p-3 rounded bg-white/10 text-sm"
              value={newSession.sessionFile.title}
              onChange={(e) =>
                setNewSession({
                  ...newSession,
                  sessionFile: {
                    ...newSession.sessionFile,
                    title: e.target.value,
                  },
                })
              }
            />
            <input
              placeholder="File URL (Drive / Dropbox Link)"
              className="p-3 rounded bg-white/10 text-sm"
              value={newSession.sessionFile.url}
              onChange={(e) =>
                setNewSession({
                  ...newSession,
                  sessionFile: {
                    ...newSession.sessionFile,
                    url: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            <input
              placeholder="Code Snippet Title (e.g., App.js Source)"
              className="p-3 rounded bg-white/10 text-sm"
              value={newSession.sessionCode.title}
              onChange={(e) =>
                setNewSession({
                  ...newSession,
                  sessionCode: {
                    ...newSession.sessionCode,
                    title: e.target.value,
                  },
                })
              }
            />
            <textarea
              placeholder="Paste your session code here..."
              className="p-3 rounded bg-white/10 text-sm font-mono h-32"
              value={newSession.sessionCode.body}
              onChange={(e) =>
                setNewSession({
                  ...newSession,
                  sessionCode: {
                    ...newSession.sessionCode,
                    body: e.target.value,
                  },
                })
              }
            />
          </div>

          {/* QUIZ */}
          <h3 className="text-lg font-semibold border-b border-white/10 pt-4 pb-2 text-emerald-400">
            Session Quiz
          </h3>
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
                className="absolute top-3 right-3 text-red-400 hover:text-red-300"
              >
                <FaTrash />
              </button>

              <textarea
                placeholder="Question text (Supports code & line breaks... Enter works here)"
                className="p-3 rounded bg-white/10 text-sm font-mono h-24 resize-y"
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
            className="bg-gray-700 hover:bg-gray-600 transition-colors p-2 rounded"
          >
            + Add Question
          </button>

          <button
            onClick={handleSaveSession}
            className="bg-blue-600 p-3 rounded font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
          >
            {editingId ? "Update Session" : "Create Session"}
          </button>
        </div>

        {/* ================= LIST ================= */}
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-lg">{s.title}</h3>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 font-bold">
                    Lvl {s.level || 1}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                  {s.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                    >
                      🔗 Session Link
                    </a>
                  )}
                  {s.youtubeLink && (
                    <a
                      href={s.youtubeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
                    >
                      ▶️ YouTube
                    </a>
                  )}
                  {s.sessionFile?.url && (
                    <span className="text-indigo-400 text-xs bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                      📁 Has File
                    </span>
                  )}
                  {s.sessionCode?.body && (
                    <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      💻 Has Code
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setSelectedQuiz(s.quiz)}
                  className="bg-indigo-600 hover:bg-indigo-500 transition-colors px-3 py-1.5 rounded text-sm font-medium flex-1"
                >
                  View Quiz
                </button>

                <button
                  onClick={() => handleEditClick(s)}
                  className="bg-amber-600 hover:bg-amber-500 transition-colors px-3 py-1.5 rounded text-sm font-medium text-white"
                  title="Edit Session"
                >
                  <FaEdit />
                </button>

                <button
                  onClick={() => handleDelete(s.id)}
                  className="bg-red-600 hover:bg-red-500 transition-colors px-3 py-1.5 rounded text-sm font-medium"
                  title="Delete Session"
                >
                  <FaTrash className="inline" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ================= QUIZ MODAL ================= */}
        {selectedQuiz && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 max-w-2xl w-full p-6 rounded-2xl max-h-[80vh] overflow-y-auto border border-white/10">
              <h2 className="text-xl font-bold mb-4">Quiz Preview</h2>

              {selectedQuiz.map((q, i) => (
                <div
                  key={i}
                  className="mb-5 bg-white/5 p-4 rounded border border-white/5"
                >
                  <h3 className="font-bold text-gray-200 mb-3 whitespace-pre-wrap font-mono text-sm leading-relaxed bg-black/20 p-3 rounded border border-white/5">
                    {i + 1}.{"\n"}
                    {q.question}
                  </h3>

                  {q.options.map((opt, j) => (
                    <p
                      key={j}
                      className={`p-2 rounded mt-1 text-sm ${
                        j === q.correct
                          ? "text-green-400 font-bold bg-green-500/10"
                          : "text-gray-300"
                      }`}
                    >
                      {j + 1}. {opt}
                    </p>
                  ))}
                </div>
              ))}

              <button
                onClick={() => setSelectedQuiz(null)}
                className="mt-3 bg-red-600 hover:bg-red-500 transition-colors px-4 py-2 rounded font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
