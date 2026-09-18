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

import {
  FaTrash,
  FaEdit,
  FaTimes,
  FaSearch,
  FaLayerGroup,
  FaClock,
  FaEye,
  FaPlus,
  FaYoutube,
  FaLink,
  FaCode,
  FaFileAlt,
} from "react-icons/fa";

export default function AdminSessions() {
  const { isAdmin, loading } = useAdmin();

  const [sessions, setSessions] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // UI only - for easier session searching
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  // States for Editing Session
  const [editingId, setEditingId] = useState(null);

  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    link: "",
    youtubeLink: "",
    level: 1,
    quizDurationMinutes: 5,
    sessionFile: {
      title: "",
      url: "",
    },
    sessionCode: {
      title: "",
      body: "",
    },
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
    if (isAdmin) {
      fetchSessions();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Loading Admin Panel
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/20 bg-red-500/[0.06] p-8 text-center">
          <h2 className="text-xl font-black text-red-400">غير مصرح</h2>

          <p className="mt-2 text-sm text-slate-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const fetchSessions = async () => {
    const snap = await getDocs(collection(db, "sessions"));

    setSessions(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })),
    );
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
      youtubeLink: s.youtubeLink || "",
      level: Number(s.level) || 1,

      quizDurationMinutes: Number(s.quizDurationMinutes || s.quizDuration) || 5,

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
        : [
            {
              question: "",
              options: ["", "", ""],
              correct: 0,
              points: 1,
            },
          ],
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetForm = () => {
    setEditingId(null);

    setNewSession({
      title: "",
      description: "",
      link: "",
      youtubeLink: "",
      level: 1,
      quizDurationMinutes: 5,

      sessionFile: {
        title: "",
        url: "",
      },

      sessionCode: {
        title: "",
        body: "",
      },
    });

    setQuiz([
      {
        question: "",
        options: ["", "", ""],
        correct: 0,
        points: 1,
      },
    ]);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "sessions", id));
    fetchSessions();
  };

  // UI only filtering
  const filteredSessions = sessions.filter((session) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      session.title?.toLowerCase().includes(search) ||
      session.description?.toLowerCase().includes(search);

    const sessionLevel = Number(session.level || 1);

    const matchesLevel =
      levelFilter === "all" || sessionLevel === Number(levelFilter);

    return matchesSearch && matchesLevel;
  });

  const inputClass =
    "w-full rounded-xl border border-white/[0.08] bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/40 focus:bg-slate-950/70 focus:ring-2 focus:ring-indigo-500/10";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-indigo-500/[0.07] blur-3xl" />

        <div className="absolute -left-40 top-[45%] h-96 w-96 rounded-full bg-violet-500/[0.035] blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[length:30px_30px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
        {/* ================= PAGE HEADER ================= */}

        <div className="mb-7 sm:mb-9">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 sm:text-xs">
            Administration
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                Sessions Management
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-400 sm:text-sm">
                Create, edit and manage learning sessions, resources and quizzes
                from one place.
              </p>
            </div>

            <div className="w-fit rounded-xl border border-indigo-500/15 bg-indigo-500/[0.07] px-4 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Total Sessions
              </p>

              <p className="mt-0.5 text-xl font-black text-indigo-300">
                {sessions.length}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            CREATE / EDIT FORM
        ====================================================== */}

        <section className="mx-auto mb-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/[0.08] bg-slate-900/55 shadow-2xl shadow-black/20 backdrop-blur-xl">
          {/* FORM HEADER */}

          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6 sm:py-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-400">
                Session Editor
              </p>

              <h2 className="mt-1 text-lg font-black text-white sm:text-xl">
                {editingId ? "Edit Session" : "Create New Session"}
              </h2>
            </div>

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                editingId
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                  : "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
              }`}
            >
              {editingId ? <FaEdit /> : <FaPlus />}
            </div>
          </div>

          <div className="space-y-7 p-4 sm:p-6">
            {/* EDITING MODE */}

            {editingId && (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-300">
                    Editing Session Mode
                  </p>

                  <p className="mt-1 text-[10px] text-amber-300/60">
                    You're currently editing an existing session.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.07] px-4 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/15 sm:w-auto"
                >
                  <FaTimes size={11} />
                  Cancel Edit
                </button>
              </div>
            )}

            {/* ================= BASIC DETAILS ================= */}

            <FormSection
              title="Main Details"
              subtitle="Basic information about the session"
            >
              <div className="grid gap-3">
                <div>
                  <InputLabel>Session Title</InputLabel>

                  <input
                    placeholder="Enter session title..."
                    className={inputClass}
                    value={newSession.title}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <InputLabel>Description</InputLabel>

                  <textarea
                    placeholder="Describe the session..."
                    className={`${inputClass} min-h-28 resize-y`}
                    value={newSession.description}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <InputLabel>Telegram Session Link</InputLabel>

                    <div className="relative">
                      <FaLink className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-600" />

                      <input
                        placeholder="Session recording / Telegram link"
                        className={`${inputClass} pl-10`}
                        value={newSession.link}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            link: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <InputLabel>YouTube Video Link</InputLabel>

                    <div className="relative">
                      <FaYoutube className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-red-400" />

                      <input
                        placeholder="https://youtube.com/..."
                        className={`${inputClass} border-red-500/10 pl-10 focus:border-red-500/35 focus:ring-red-500/10`}
                        value={newSession.youtubeLink}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            youtubeLink: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* LEVEL */}

                  <div>
                    <InputLabel>Session Level Target</InputLabel>

                    <select
                      className={inputClass}
                      value={newSession.level}
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          level: Number(e.target.value),
                        })
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

                  {/* TIMER */}

                  <div>
                    <InputLabel>Quiz Timer (Minutes)</InputLabel>

                    <div className="relative">
                      <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-600" />

                      <input
                        type="number"
                        min="1"
                        placeholder="Minutes (e.g. 5)"
                        className={`${inputClass} pl-10`}
                        value={newSession.quizDurationMinutes}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            quizDurationMinutes: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            {/* ================= RESOURCES ================= */}

            <FormSection
              title="Session Resources"
              subtitle="Optional files and source code"
            >
              {/* File */}
              <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.035] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FaFileAlt className="text-xs text-indigo-400" />

                  <p className="text-xs font-bold text-indigo-300">
                    Attached File
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    placeholder="File Title (e.g. Session Presentation)"
                    className={inputClass}
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
                    placeholder="File URL (Drive / Dropbox)"
                    className={inputClass}
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
              </div>

              {/* Code */}
              <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.025] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FaCode className="text-xs text-emerald-400" />

                  <p className="text-xs font-bold text-emerald-300">
                    Session Code
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    placeholder="Code Snippet Title (e.g. App.js Source)"
                    className={inputClass}
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
                    className={`${inputClass} min-h-40 resize-y font-mono text-xs leading-5`}
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
              </div>
            </FormSection>

            {/* ================= QUIZ ================= */}

            <FormSection
              title="Session Quiz"
              subtitle={`${quiz.length} question${
                quiz.length !== 1 ? "s" : ""
              } configured`}
            >
              <div className="space-y-4">
                {quiz.map((q, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/40 p-4 sm:p-5"
                  >
                    {/* QUESTION HEADER */}

                    <div className="mb-4 flex items-center justify-between gap-3 pr-9">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/15 bg-indigo-500/10 text-[10px] font-black text-indigo-300">
                          {i + 1}
                        </span>

                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            Question {i + 1}
                          </p>

                          <p className="text-[9px] text-slate-600">
                            Configure question and correct answer
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newQuiz = quiz.filter((_, index) => index !== i);

                        setQuiz(newQuiz);
                      }}
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.06] text-xs text-red-400 transition hover:bg-red-500/15"
                      title="Delete Question"
                    >
                      <FaTrash />
                    </button>

                    {/* QUESTION */}

                    <textarea
                      placeholder="Question text..."
                      className={`${inputClass} min-h-24 resize-y font-mono`}
                      value={q.question}
                      onChange={(e) => {
                        const newQuiz = [...quiz];

                        newQuiz[i].question = e.target.value;

                        setQuiz(newQuiz);
                      }}
                    />

                    {/* OPTIONS */}

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {q.options.map((opt, j) => (
                        <div key={j} className="relative">
                          <span className="absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-white/[0.05] text-[9px] font-bold text-slate-500">
                            {j + 1}
                          </span>

                          <input
                            placeholder={`Option ${j + 1}`}
                            className={`${inputClass} pl-11`}
                            value={opt}
                            onChange={(e) => {
                              const newQuiz = [...quiz];

                              newQuiz[i].options[j] = e.target.value;

                              setQuiz(newQuiz);
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {/* CORRECT */}

                      <div>
                        <InputLabel>Correct Answer</InputLabel>

                        <select
                          className={inputClass}
                          value={q.correct}
                          onChange={(e) => {
                            const newQuiz = [...quiz];

                            newQuiz[i].correct = Number(e.target.value);

                            setQuiz(newQuiz);
                          }}
                        >
                          <option value={0} className="bg-slate-900">
                            Option 1
                          </option>

                          <option value={1} className="bg-slate-900">
                            Option 2
                          </option>

                          <option value={2} className="bg-slate-900">
                            Option 3
                          </option>
                        </select>
                      </div>

                      {/* POINTS */}

                      <div>
                        <InputLabel>Points</InputLabel>

                        <input
                          type="number"
                          placeholder="Points"
                          className={inputClass}
                          value={q.points}
                          onChange={(e) => {
                            const newQuiz = [...quiz];

                            newQuiz[i].points = Number(e.target.value);

                            setQuiz(newQuiz);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* ADD QUESTION */}

                <button
                  type="button"
                  onClick={() =>
                    setQuiz([
                      ...quiz,

                      {
                        question: "",
                        options: ["", "", ""],
                        correct: 0,
                        points: 1,
                      },
                    ])
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-3 text-xs font-bold text-slate-400 transition hover:border-indigo-500/25 hover:bg-indigo-500/[0.05] hover:text-indigo-300"
                >
                  <FaPlus size={10} />
                  Add Question
                </button>
              </div>
            </FormSection>

            {/* SAVE */}

            <button
              type="button"
              onClick={handleSaveSession}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${
                editingId
                  ? "bg-amber-500 shadow-amber-950/25 hover:bg-amber-400"
                  : "bg-indigo-500 shadow-indigo-950/30 hover:bg-indigo-400"
              }`}
            >
              {editingId ? (
                <>
                  <FaEdit size={12} />
                  Update Session
                </>
              ) : (
                <>
                  <FaPlus size={11} />
                  Create Session
                </>
              )}
            </button>
          </div>
        </section>

        {/* =====================================================
            SESSIONS MANAGEMENT LIST
        ====================================================== */}

        <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-slate-900/55 shadow-2xl shadow-black/15 backdrop-blur-xl">
          {/* HEADER */}

          <div className="border-b border-white/[0.07] p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                  Session Library
                </p>

                <h2 className="mt-1 text-lg font-black text-white sm:text-xl">
                  Manage Existing Sessions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Search and find the session you want to edit quickly.
                </p>
              </div>

              <span className="w-fit rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1.5 text-[10px] font-bold text-slate-400">
                Showing {filteredSessions.length} of {sessions.length}
              </span>
            </div>

            {/* SEARCH + FILTER */}

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
              {/* SEARCH */}

              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-600" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search sessions by title or description..."
                  className={`${inputClass} pl-10`}
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-xs text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              {/* LEVEL FILTER */}

              <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/[0.07] bg-slate-950/40 p-1">
                {[
                  {
                    value: "all",
                    label: "All",
                  },
                  {
                    value: "1",
                    label: "L1",
                  },
                  {
                    value: "2",
                    label: "L2",
                  },
                  {
                    value: "3",
                    label: "L3",
                  },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setLevelFilter(item.value)}
                    className={`rounded-lg px-3 py-2 text-[10px] font-bold transition sm:text-xs ${
                      levelFilter === item.value
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/30"
                        : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LIST */}

          <div className="space-y-2.5 p-3 sm:p-4 lg:p-5">
            {filteredSessions.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-600">
                  <FaSearch />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-300">
                  No sessions found
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Try another search or level filter.
                </p>
              </div>
            ) : (
              filteredSessions.map((s, index) => {
                const currentlyEditing = editingId === s.id;

                return (
                  <div
                    key={s.id}
                    className={`group relative overflow-hidden rounded-2xl border p-3.5 transition-all duration-200 sm:p-4 ${
                      currentlyEditing
                        ? "border-amber-500/30 bg-amber-500/[0.06] ring-1 ring-amber-500/10"
                        : "border-white/[0.07] bg-slate-950/30 hover:border-indigo-500/20 hover:bg-slate-950/45"
                    }`}
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      {/* SESSION INFORMATION */}

                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        {/* NUMBER */}

                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[10px] font-black ${
                            currentlyEditing
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                              : "border-indigo-500/15 bg-indigo-500/[0.07] text-indigo-400"
                          }`}
                        >
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          {/* TITLE */}

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <h3 className="min-w-0 truncate text-sm font-black text-white sm:text-base">
                              {s.title}
                            </h3>

                            {currentlyEditing && (
                              <span className="w-fit shrink-0 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-300">
                                Editing
                              </span>
                            )}
                          </div>

                          {/* DESCRIPTION */}

                          <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500 sm:text-xs">
                            {s.description}
                          </p>

                          {/* BADGES */}

                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span className="flex items-center gap-1.5 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.07] px-2 py-1 text-[9px] font-bold text-indigo-300">
                              <FaLayerGroup size={8} />
                              Level {s.level || 1}
                            </span>

                            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-2 py-1 text-[9px] font-bold text-emerald-300">
                              <FaClock size={8} />
                              {s.quizDurationMinutes || s.quizDuration || 5} min
                            </span>

                            {s.quiz?.length > 0 && (
                              <span className="rounded-lg border border-purple-500/15 bg-purple-500/[0.06] px-2 py-1 text-[9px] font-bold text-purple-300">
                                {s.quiz.length} Questions
                              </span>
                            )}

                            {s.youtubeLink && (
                              <span className="flex items-center gap-1 rounded-lg border border-red-500/15 bg-red-500/[0.05] px-2 py-1 text-[9px] font-bold text-red-300">
                                <FaYoutube size={8} />
                                Video
                              </span>
                            )}

                            {s.sessionFile?.url && (
                              <span className="rounded-lg border border-blue-500/15 bg-blue-500/[0.05] px-2 py-1 text-[9px] font-bold text-blue-300">
                                File
                              </span>
                            )}

                            {s.sessionCode?.body && (
                              <span className="rounded-lg border border-teal-500/15 bg-teal-500/[0.05] px-2 py-1 text-[9px] font-bold text-teal-300">
                                Code
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="grid grid-cols-[1fr_auto_auto] gap-2 sm:flex sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedQuiz(s.quiz)}
                          className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.07] px-4 py-2 text-[10px] font-bold text-indigo-300 transition hover:border-indigo-400/30 hover:bg-indigo-500/15 sm:text-xs"
                        >
                          <FaEye size={10} />
                          View Quiz
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditClick(s)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/[0.07] text-amber-400 transition hover:border-amber-400/30 hover:bg-amber-500/15"
                          title="Edit Session"
                        >
                          <FaEdit size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.07] text-red-400 transition hover:border-red-400/30 hover:bg-red-500/15"
                          title="Delete Session"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* =====================================================
            QUIZ MODAL
        ====================================================== */}

        {selectedQuiz && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-5"
            onClick={() => setSelectedQuiz(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/[0.09] bg-slate-900 shadow-2xl shadow-black/50"
            >
              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4 sm:px-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-400">
                    Preview
                  </p>

                  <h2 className="mt-1 text-lg font-black text-white">
                    Quiz Preview
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedQuiz(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              {/* QUIZ CONTENT */}

              <div className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar sm:p-5">
                {selectedQuiz.map((q, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[9px] font-black text-indigo-300">
                        {i + 1}
                      </span>

                      <h3 className="whitespace-pre-wrap font-mono text-xs font-semibold leading-relaxed text-slate-200 sm:text-sm">
                        {q.sessionCode || q.question}
                      </h3>
                    </div>

                    <div className="mt-4 space-y-2">
                      {q.options.map((opt, j) => (
                        <div
                          key={j}
                          className={`flex gap-2 rounded-xl border p-3 text-xs sm:text-sm ${
                            j === q.correct
                              ? "border-emerald-500/25 bg-emerald-500/[0.08] font-bold text-emerald-300"
                              : "border-white/[0.05] bg-white/[0.02] text-slate-400"
                          }`}
                        >
                          <span className="font-black">{j + 1}.</span>

                          <span>{opt}</span>

                          {j === q.correct && (
                            <span className="ml-auto shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[8px] uppercase tracking-wide">
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* MODAL FOOTER */}

              <div className="border-t border-white/[0.07] p-4">
                <button
                  type="button"
                  onClick={() => setSelectedQuiz(null)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function FormSection({ title, subtitle, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3 border-b border-white/[0.07] pb-3">
        <div className="h-8 w-1 rounded-full bg-indigo-500" />

        <div>
          <h3 className="text-sm font-bold text-slate-100 sm:text-base">
            {title}
          </h3>

          <p className="mt-0.5 text-[9px] text-slate-600 sm:text-[10px]">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InputLabel({ children }) {
  return (
    <label className="mb-1.5 block text-[10px] font-bold text-slate-500 sm:text-xs">
      {children}
    </label>
  );
}
