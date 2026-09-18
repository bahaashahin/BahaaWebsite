import { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { useParams } from "react-router-dom";

import {
  FaTasks,
  FaLink,
  FaCalendarAlt,
  FaClock,
  FaStar,
  FaTelegramPlane,
  FaPlay,
  FaCheckCircle,
  FaCopy,
  FaDownload,
} from "react-icons/fa";

export default function SessionDetails() {
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [sessionTasks, setSessionTasks] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPassed, setIsPassed] = useState(false);
  const [confetti, setConfetti] = useState([]);

  // States for feedback and ratings
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [timeLeft, setTimeLeft] = useState(300);

  const userId = auth.currentUser?.uid;

  const storageKey = `quiz_timer_${id}_${userId}`;

  // الحفاظ على أحدث قيمة للإجابات
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const completedRef = useRef(completed);

  useEffect(() => {
    completedRef.current = completed;
  }, [completed]);

  useEffect(() => {
    fetchSession();
    checkCompleted();
    fetchSessionTasks();
  }, [id]);

  useEffect(() => {
    if (!completed && id && userId) {
      const savedQuizState = localStorage.getItem(storageKey);

      if (savedQuizState) {
        const { startTime, durationInSeconds } = JSON.parse(savedQuizState);

        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

        const remaining = durationInSeconds - elapsedSeconds;

        if (remaining > 0) {
          setTimeLeft(remaining);
          setStarted(true);
        } else {
          setTimeLeft(0);
          setStarted(true);
        }
      }
    }
  }, [id, userId, completed]);

  // Timer
  useEffect(() => {
    let timer;

    if (started && !completed) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);

            handleSubmit(answersRef.current);

            setError(
              "⏰ Time is up! Your answers were submitted automatically.",
            );

            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [started, completed]);

  // Auto hide messages
  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => {
        setError("");
        setSuccessMsg("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  const triggerConfetti = () => {
    const colors = [
      "#10B981",
      "#3B82F6",
      "#F59E0B",
      "#EC4899",
      "#8B5CF6",
      "#10B981",
    ];

    const pieces = Array.from({
      length: 80,
    }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      size: `${Math.random() * 8 + 6}px`,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: `${Math.random() * 2 + 2}s`,
    }));

    setConfetti(pieces);

    setTimeout(() => {
      setConfetti([]);
    }, 6000);
  };

  const fetchSession = async () => {
    const snap = await getDoc(doc(db, "sessions", id));

    if (snap.exists()) {
      const data = snap.data();

      setSession(data);

      if (!localStorage.getItem(storageKey)) {
        const durationSec = data.quizDurationMinutes
          ? data.quizDurationMinutes * 60
          : 300;

        setTimeLeft(durationSec);
      }
    }
  };

  const fetchSessionTasks = async () => {
    try {
      const q = query(collection(db, "tasks"), where("sessionId", "==", id));

      const querySnapshot = await getDocs(q);

      const tasksList = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setSessionTasks(tasksList);
    } catch (err) {
      console.error("Error fetching session tasks:", err);
    }
  };

  const checkCompleted = async () => {
    if (!userId) return;

    const snap = await getDoc(doc(db, "completedSessions", userId));

    if (snap.exists()) {
      const data = snap.data();

      const sessionData = data?.[id];

      if (sessionData) {
        if (sessionData.completed !== undefined) {
          setCompleted(true);

          setScore(sessionData.score || 0);

          setAnswers(sessionData.answers || []);

          setIsPassed(sessionData.completed);

          localStorage.removeItem(storageKey);
        }

        if (sessionData.feedback) {
          setFeedback(sessionData.feedback);

          setIsFeedbackSubmitted(true);
        }

        if (sessionData.rating) {
          setRating(sessionData.rating);
        }
      }
    }
  };

  const handleSaveFeedback = async () => {
    if (!userId || rating === 0) {
      setError("Please select at least a star rating before submitting.");

      return;
    }

    setSubmittingFeedback(true);

    try {
      const ref = doc(db, "completedSessions", userId);

      const snap = await getDoc(ref);

      const oldData = snap.exists() ? snap.data() : {};

      await setDoc(
        ref,
        {
          ...oldData,

          [id]: {
            ...(oldData[id] || {}),

            feedback: feedback,
            rating: rating,
          },
        },
        {
          merge: true,
        },
      );

      setIsFeedbackSubmitted(true);

      setSuccessMsg(
        "⭐ Thank you! Your feedback has been submitted successfully.",
      );
    } catch (err) {
      console.error("Error saving feedback:", err);

      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return "";

    let videoId = "";

    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0];
    } else if (url.includes("embed/")) {
      videoId = url.split("embed/")[1]?.split("?")[0];
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const startQuiz = () => {
    const durationSec = session?.quizDurationMinutes
      ? session.quizDurationMinutes * 60
      : 300;

    const startTime = Date.now();

    localStorage.setItem(
      storageKey,

      JSON.stringify({
        startTime,
        durationInSeconds: durationSec,
      }),
    );

    setTimeLeft(durationSec);
    setStarted(true);
  };

  const handleSubmit = async (currentAnswers = answersRef.current) => {
    if (!session || !userId) {
      return;
    }

    if (completedRef.current) {
      return;
    }

    let finalScore = 0;

    if (session.quiz && Array.isArray(session.quiz)) {
      session.quiz.forEach((q, i) => {
        if (
          currentAnswers[i] !== undefined &&
          currentAnswers[i] === q.correct
        ) {
          finalScore++;
        }
      });
    }

    const passed = finalScore >= (session.quiz?.length || 1) / 2;

    try {
      const ref = doc(db, "completedSessions", userId);

      const snap = await getDoc(ref);

      const oldData = snap.exists() ? snap.data() : {};

      await setDoc(ref, {
        ...oldData,

        [id]: {
          ...(oldData[id] || {}),

          sessionId: id,

          score: finalScore,

          completed: passed,

          answers: currentAnswers,

          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("Error saving quiz score:", err);
    }

    setCompleted(true);
    setScore(finalScore);
    setIsPassed(passed);
    setStarted(false);

    localStorage.removeItem(storageKey);

    if (passed) {
      triggerConfetti();
    }
  };

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);

    setSuccessMsg("📋 Code copied to clipboard successfully!");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Loading Session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950 px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {/* ================= BACKGROUND ================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-indigo-500/[0.08] blur-3xl" />

        <div className="absolute -left-32 top-[45%] h-96 w-96 rounded-full bg-violet-500/[0.04] blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:30px_30px]" />
      </div>

      {/* ================= CONFETTI ================= */}

      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="pointer-events-none absolute top-[-20px] z-50 animate-fall rounded-sm"
          style={{
            left: piece.left,

            width: piece.size,

            height: piece.size,

            backgroundColor: piece.color,

            animationDelay: piece.delay,

            animationDuration: piece.duration,

            opacity: 0.8,
          }}
        />
      ))}

      {/* ================= ALERTS ================= */}

      {error && (
        <div className="fixed left-1/2 top-20 z-[100] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 animate-slideDown md:top-5">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/90 px-4 py-3 text-center text-xs font-semibold text-white shadow-2xl shadow-red-950/30 backdrop-blur-xl sm:px-6 sm:text-sm">
            {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed left-1/2 top-20 z-[100] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 animate-slideDown md:top-5">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/90 px-4 py-3 text-center text-xs font-semibold text-white shadow-2xl shadow-emerald-950/30 backdrop-blur-xl sm:px-6 sm:text-sm">
            {successMsg}
          </div>
        </div>
      )}

      {/* ================= CONTENT ================= */}

      <main className="relative z-10 mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        {/* =====================================================
            VIDEO - FIRST SECTION
        ====================================================== */}

        {session.youtubeLink && (
          <section className="overflow-hidden rounded-[28px] border border-indigo-500/20 bg-slate-900/60 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <FaPlay size={13} />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                    Session Video
                  </p>

                  <h2 className="text-sm font-bold text-white sm:text-base">
                    Recorded YouTube Session
                  </h2>
                </div>
              </div>

              <span className="w-fit rounded-full border border-red-500/15 bg-red-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-red-300">
                Recorded
              </span>
            </div>

            <div className="p-2.5 sm:p-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                <iframe
                  src={getEmbedUrl(session.youtubeLink)}
                  title={session.title}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            SESSION INFO
        ====================================================== */}

        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-slate-900/60 shadow-xl shadow-black/15 backdrop-blur-xl">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-indigo-500/[0.07] blur-3xl" />

          <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.7)]" />

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                  Learning Session
                </p>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                {session.title}
              </h1>

              <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-400 sm:text-sm sm:leading-6">
                {session.description}
              </p>
            </div>

            {/* TELEGRAM RECORDING */}
            {session.link && (
              <a
                href={session.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full shrink-0 items-center justify-center gap-3 rounded-2xl border border-sky-400/20 bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-sky-400 hover:to-blue-500 active:scale-[0.98] lg:w-auto"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                  <FaTelegramPlane
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>

                <span className="text-left">
                  <span className="block">Join Session</span>

                  <span className="block text-[9px] font-semibold text-sky-100/80">
                    Telegram Recording
                  </span>
                </span>
              </a>
            )}
          </div>
        </section>

        {/* =====================================================
            RESOURCES
        ====================================================== */}

        {((session.sessionFile && session.sessionFile.url) ||
          (session.sessionCode && session.sessionCode.body)) && (
          <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-slate-900/55 shadow-xl shadow-black/15 backdrop-blur-xl">
            <SectionHeader
              title="Session Resources"
              subtitle="Files and code related to this session"
            />

            <div className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
              {/* FILE */}

              {session.sessionFile?.url && (
                <div className="flex flex-col gap-4 rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-400">
                      Attached File
                    </p>

                    <h4 className="mt-1 truncate text-sm font-bold text-slate-100 sm:text-base">
                      {session.sessionFile.title || "Session Material"}
                    </h4>
                  </div>

                  <a
                    href={session.sessionFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-950/30 transition-all hover:bg-indigo-400"
                  >
                    <FaDownload size={10} />
                    Download File
                  </a>
                </div>
              )}

              {/* CODE */}

              {session.sessionCode?.body && (
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/70">
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.025] px-4 py-3">
                    <span className="min-w-0 truncate font-mono text-[10px] text-slate-400 sm:text-xs">
                      📄 {session.sessionCode.title || "Session Code"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(session.sessionCode.body)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <FaCopy size={9} />
                      Copy
                    </button>
                  </div>

                  <pre className="max-h-72 overflow-x-auto p-4 font-mono text-[11px] leading-5 text-emerald-400 sm:text-xs sm:leading-6">
                    {session.sessionCode.body}
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =====================================================
            TASKS
        ====================================================== */}

        {sessionTasks.length > 0 && (
          <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-slate-900/55 shadow-xl shadow-black/15 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/15 bg-blue-500/10 text-blue-400">
                  <FaTasks size={14} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white sm:text-base">
                    Required Tasks
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
                    Assignments for this session
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold text-blue-300">
                {sessionTasks.length} Tasks
              </span>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              {sessionTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="group rounded-2xl border border-white/[0.07] bg-slate-950/35 p-4 transition-all duration-200 hover:border-blue-500/20 hover:bg-slate-950/50 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-[10px] font-black text-slate-500">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="text-sm font-bold text-white sm:text-base">
                          {task.title}
                        </h3>

                        {task.points > 0 && (
                          <span className="w-fit shrink-0 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold text-blue-300">
                            {task.points} pts
                          </span>
                        )}
                      </div>

                      <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-400 sm:text-sm">
                        {task.description}
                      </p>

                      {(task.deadline || task.formLink) && (
                        <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
                          {task.deadline && (
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-400 sm:text-xs">
                              <FaCalendarAlt />
                              Deadline: {task.deadline}
                            </span>
                          )}

                          {task.formLink && (
                            <a
                              href={task.formLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500 px-4 py-2.5 text-[10px] font-bold text-white shadow-lg shadow-indigo-950/25 transition hover:bg-indigo-400 sm:ml-auto sm:w-auto sm:text-xs"
                            >
                              <FaLink size={9} />
                              Submit Assignment
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================
            QUIZ RESULT
        ====================================================== */}

        {completed && (
          <section
            className={`overflow-hidden rounded-[28px] border shadow-xl backdrop-blur-xl ${
              isPassed
                ? "border-emerald-500/25 bg-gradient-to-br from-emerald-950/50 to-slate-900/60 shadow-emerald-950/10"
                : "border-rose-500/25 bg-gradient-to-br from-rose-950/50 to-slate-900/60 shadow-rose-950/10"
            }`}
          >
            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div
                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border ${
                    isPassed
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  <FaCheckCircle />
                </div>

                <h2
                  className={`text-xl font-black tracking-tight sm:text-2xl ${
                    isPassed ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {isPassed
                    ? "🎉 Brilliant! Session Completed"
                    : "👍 Quiz Finished! Keep Improving"}
                </h2>

                <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {isPassed
                    ? "Great job! You have fully grasped this session's concepts."
                    : "You can review your incorrect answers and try again anytime."}
                </p>
              </div>

              <div
                className={`flex min-w-32 flex-col items-center justify-center rounded-2xl border p-4 ${
                  isPassed
                    ? "border-emerald-500/20 bg-emerald-500/[0.07]"
                    : "border-rose-500/20 bg-rose-500/[0.07]"
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Your Score
                </span>

                <span
                  className={`mt-1 text-3xl font-black ${
                    isPassed ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {score}

                  <span className="ml-1 text-xs text-slate-500">
                    / {session.quiz ? session.quiz.length : 0}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/[0.06] px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setShowReview(!showReview)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[10px] font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white sm:text-xs"
              >
                {showReview ? "Hide Quiz Review" : "Show Quiz Review"}
              </button>
            </div>
          </section>
        )}

        {/* =====================================================
            QUIZ REVIEW
        ====================================================== */}

        {completed && showReview && session.quiz && (
          <section className="animate-fadeIn overflow-hidden rounded-[28px] border border-white/[0.08] bg-slate-900/55 shadow-xl shadow-black/15 backdrop-blur-xl">
            <SectionHeader
              title="Detailed Quiz Review"
              subtitle="Review your answers and the correct solutions"
            />

            <div className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
              {session.quiz.map((q, i) => {
                const studentChoice = answers[i];

                const isCorrect = studentChoice === q.correct;

                return (
                  <div
                    key={i}
                    className={`rounded-2xl border p-4 sm:p-5 ${
                      isCorrect
                        ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                        : "border-rose-500/20 bg-rose-500/[0.04]"
                    }`}
                  >
                    <div className="mb-4 flex items-start gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                          isCorrect
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-rose-500/15 text-rose-300"
                        }`}
                      >
                        {i + 1}
                      </span>

                      <h4 className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-200 sm:text-sm">
                        {q.question}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, j) => {
                        let optionStyle =
                          "border-white/[0.05] bg-slate-950/30 text-slate-400";

                        let badge = null;

                        if (j === q.correct) {
                          optionStyle =
                            "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-semibold";

                          badge = (
                            <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-1 text-[8px] font-bold text-emerald-300 sm:text-[9px]">
                              Correct Answer
                            </span>
                          );
                        } else if (j === studentChoice && !isCorrect) {
                          optionStyle =
                            "border-rose-500/30 bg-rose-500/10 text-rose-300 font-semibold";

                          badge = (
                            <span className="shrink-0 rounded-md bg-rose-500/15 px-2 py-1 text-[8px] font-bold text-rose-300 sm:text-[9px]">
                              Your Choice
                            </span>
                          );
                        } else if (j === studentChoice && isCorrect) {
                          badge = (
                            <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-1 text-[8px] font-bold text-emerald-300 sm:text-[9px]">
                              Your Choice
                            </span>
                          );
                        }

                        return (
                          <div
                            key={j}
                            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs sm:text-sm ${optionStyle}`}
                          >
                            <span className="min-w-0">{opt}</span>

                            {badge}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =====================================================
            FEEDBACK
        ====================================================== */}

        <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-slate-900/55 shadow-xl shadow-black/15 backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/[0.07] p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/15 bg-yellow-500/10 text-yellow-400">
              <FaStar size={14} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white sm:text-base">
                Rate & Review this Session
              </h3>

              <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
                Help us improve future sessions.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
              Share your thoughts or rate this session to help us improve!
            </p>

            {/* STARS */}

            <div className="mt-4 flex w-fit items-center gap-1.5 rounded-xl border border-white/[0.06] bg-slate-950/40 px-3 py-2.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  disabled={isFeedbackSubmitted}
                  onClick={() => !isFeedbackSubmitted && setRating(star)}
                  className={`rounded-lg p-1 transition-transform focus:outline-none ${
                    isFeedbackSubmitted
                      ? "cursor-default"
                      : "cursor-pointer hover:scale-110 active:scale-95"
                  }`}
                >
                  <FaStar
                    size={20}
                    className={
                      rating >= star
                        ? "text-yellow-400"
                        : "text-slate-700 transition-colors hover:text-slate-500"
                    }
                  />
                </button>
              ))}
            </div>

            {/* TEXTAREA */}

            <textarea
              value={feedback}
              disabled={isFeedbackSubmitted}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write your feedback about this session..."
              className={`mt-4 h-28 w-full resize-none rounded-2xl border border-white/[0.08] bg-slate-950/50 p-4 text-xs leading-relaxed text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 sm:text-sm ${
                isFeedbackSubmitted ? "cursor-not-allowed opacity-60" : ""
              }`}
            />

            {!isFeedbackSubmitted && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveFeedback}
                  disabled={submittingFeedback}
                  className="w-full rounded-xl border border-indigo-400/20 bg-indigo-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-950/25 transition-all hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            )}

            {isFeedbackSubmitted && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.055] px-3 py-2.5 text-[10px] font-semibold text-emerald-300 sm:text-xs">
                <FaCheckCircle />
                Feedback submitted successfully and locked.
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            START QUIZ
        ====================================================== */}

        {!completed && !started && session.quiz && session.quiz.length > 0 && (
          <section className="relative overflow-hidden rounded-[28px] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.08] to-slate-900/60 p-5 text-center shadow-xl shadow-black/15 backdrop-blur-xl sm:p-7">
            <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                <FaStar />
              </div>

              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                Knowledge Check
              </p>

              <h3 className="mt-1 text-lg font-black text-white sm:text-xl">
                Session Knowledge Quiz
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400 sm:text-sm">
                Test your understanding of what you learned in this session.
              </p>

              <button
                type="button"
                onClick={startQuiz}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-400 active:scale-[0.98] sm:w-auto"
              >
                <FaPlay size={11} />
                Start Quiz
              </button>
            </div>
          </section>
        )}

        {/* =====================================================
            ACTIVE QUIZ
        ====================================================== */}

        {!completed && started && session.quiz && (
          <section className="space-y-4">
            {/* TIMER */}

            <div className="sticky top-20 z-40 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/90 p-3.5 shadow-2xl shadow-black/30 backdrop-blur-xl md:top-4 sm:p-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>

                <span className="truncate text-[10px] font-bold text-slate-300 sm:text-sm">
                  Quiz in Progress...
                </span>
              </div>

              <div
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-black sm:px-4 sm:text-lg ${
                  timeLeft < 60
                    ? "animate-pulse border-rose-500/30 bg-rose-500/10 text-rose-400"
                    : "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
                }`}
              >
                <FaClock size={13} />

                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* QUESTIONS */}

            {session.quiz.map((q, i) => (
              <div
                key={i}
                className="animate-fadeIn rounded-[24px] border border-white/[0.08] bg-slate-900/55 p-4 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-5"
              >
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-500/15 bg-indigo-500/10 text-[10px] font-black text-indigo-300">
                    {i + 1}
                  </span>

                  <h3 className="whitespace-pre-wrap font-mono text-xs font-semibold leading-relaxed text-slate-200 sm:text-sm sm:leading-6">
                    {q.question}
                  </h3>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const selected = answers[i] === j;

                    return (
                      <label
                        key={j}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition-all duration-200 sm:text-sm ${
                          selected
                            ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-100"
                            : "border-white/[0.06] bg-slate-950/30 text-slate-400 hover:border-white/15 hover:bg-white/[0.035] hover:text-slate-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${i}`}
                          checked={selected}
                          className="h-4 w-4 shrink-0 accent-indigo-500"
                          onChange={() => {
                            const copy = [...answers];

                            copy[i] = j;

                            setAnswers(copy);
                          }}
                        />

                        <span className="leading-relaxed">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* SUBMIT */}

            <div className="pb-4 pt-2 text-center">
              <button
                type="button"
                onClick={() => handleSubmit(answers)}
                className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 active:scale-[0.98] sm:w-auto"
              >
                Submit Quiz Answers
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.07] p-4 sm:p-5">
      <div className="h-8 w-1 shrink-0 rounded-full bg-indigo-500" />

      <div className="min-w-0">
        <h2 className="text-sm font-bold text-white sm:text-base">{title}</h2>

        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
