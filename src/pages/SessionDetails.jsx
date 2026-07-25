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
import { FaTasks, FaLink, FaCalendarAlt, FaClock } from "react-icons/fa";

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

  const [timeLeft, setTimeLeft] = useState(300);

  const userId = auth.currentUser?.uid;
  const storageKey = `quiz_timer_${id}_${userId}`;

  // 🚀 استخدام useRef للحفاظ على أحدث قيمة لـ answers و completed لتجنب مشاكل الـ Closure
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

  // 🚀 التايمر المحسّن باستخدام الـ Refs لضمان العمل السليم عند انتهاء الوقت
  useEffect(() => {
    let timer;
    if (started && !completed) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // استخدام القيمة المحدثة مباشرة من الـ Ref لمنع ضياع الإجابات
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

  // 🔥 Auto hide messages
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
    const pieces = Array.from({ length: 80 }).map((_, i) => ({
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

      if (sessionData?.completed !== undefined) {
        setCompleted(true);
        setScore(sessionData.score || 0);
        setAnswers(sessionData.answers || []);
        setIsPassed(sessionData.completed);
        localStorage.removeItem(storageKey);
      }
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
      JSON.stringify({ startTime, durationInSeconds: durationSec }),
    );

    setTimeLeft(durationSec);
    setStarted(true);
  };

  const handleSubmit = async (currentAnswers = answersRef.current) => {
    if (!session || !userId) return;

    // منع التكرار لو تم الحفظ مسبقاً
    if (completedRef.current) return;

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

    // تحديث الحالة لتغيير واجهة المستخدم وإغلاق الامتحان فوراً
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

  if (!session)
    return <p className="text-white text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen text-white p-6 bg-gradient-to-br from-slate-950 via-blue-950 to-black relative overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-[-20px] rounded-sm pointer-events-none animate-fall z-50"
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

      {error && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-red-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-lg border border-red-300/30">
            {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-emerald-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-lg border border-emerald-300/30">
            {successMsg}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto bg-white/5 p-6 rounded-2xl mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-white/5">
        <div>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-gray-300 mt-1">{session.description}</p>
        </div>

        {session.link && (
          <a
            href={session.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 transition-colors text-white font-medium px-5 py-2.5 rounded-xl text-sm flex items-center justify-center whitespace-nowrap shadow-lg shadow-blue-600/20"
          >
            Join Session 🚀
          </a>
        )}
      </div>

      {session.youtubeLink && (
        <div className="max-w-3xl mx-auto bg-white/5 p-4 rounded-2xl mb-6 border border-white/5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span></span> Recorded YouTube Session
          </h2>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10">
            <iframe
              src={getEmbedUrl(session.youtubeLink)}
              title={session.title}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {((session.sessionFile && session.sessionFile.url) ||
        (session.sessionCode && session.sessionCode.body)) && (
        <div className="max-w-3xl mx-auto bg-white/5 p-6 rounded-2xl mb-6 border border-white/5 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-indigo-400 border-b border-white/10 pb-2">
            Session Resources
          </h2>

          {session.sessionFile?.url && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/20 p-4 rounded-xl border border-white/5">
              <div>
                <p className="text-sm text-gray-400">Attached File:</p>
                <h4 className="font-semibold text-white">
                  {session.sessionFile.title || "Session Material"}
                </h4>
              </div>
              <a
                href={session.sessionFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs font-medium px-4 py-2 rounded-lg whitespace-nowrap"
              >
                Download File 📁
              </a>
            </div>
          )}

          {session.sessionCode?.body && (
            <div className="flex flex-col gap-2 bg-black/40 rounded-xl border border-white/5 overflow-hidden">
              <div className="bg-white/5 px-4 py-2.5 flex justify-between items-center border-b border-white/5">
                <span className="text-xs font-mono text-gray-400">
                  📄 {session.sessionCode.title || "Session Code"}
                </span>
                <button
                  onClick={() => handleCopyCode(session.sessionCode.body)}
                  className="text-xs bg-white/10 hover:bg-white/20 transition-colors px-3 py-1 rounded"
                >
                  Copy Code
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-64 whitespace-pre">
                {session.sessionCode.body}
              </pre>
            </div>
          )}
        </div>
      )}

      {sessionTasks.length > 0 && (
        <div className="max-w-3xl mx-auto bg-white/5 p-6 rounded-2xl mb-6 border border-white/5 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-blue-400 border-b border-white/10 pb-2 flex items-center gap-2">
            <FaTasks /> Required Tasks for This Session ({sessionTasks.length})
          </h2>

          <div className="space-y-3">
            {sessionTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-black/30 border border-white/10 flex flex-col gap-2 transition-all hover:border-blue-500/30"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-white text-base">
                    {task.title}
                  </h3>
                  {task.points > 0 && (
                    <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                      {task.points} pts
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                  {task.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5 text-xs text-gray-400">
                  {task.deadline && (
                    <span className="flex items-center gap-1 text-rose-400 font-medium">
                      <FaCalendarAlt /> Deadline: {task.deadline}
                    </span>
                  )}

                  {task.formLink && (
                    <a
                      href={task.formLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors ml-auto shadow-md shadow-indigo-600/20"
                    >
                      <FaLink className="text-[10px]" /> Submit Assignment
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed && (
        <div
          className={`max-w-3xl mx-auto mb-6 p-6 rounded-2xl border transition-all duration-700 transform scale-100 animate-popIn
          ${
            isPassed
              ? "bg-gradient-to-r from-emerald-950/40 to-green-900/20 border-emerald-500/40 shadow-xl shadow-emerald-500/10"
              : "bg-gradient-to-r from-rose-950/40 to-red-900/20 border-rose-500/40 shadow-xl shadow-rose-500/10"
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h2
                className={`text-2xl font-black tracking-wide ${isPassed ? "text-emerald-400" : "text-rose-400"}`}
              >
                {isPassed
                  ? "🎉 Brilliant! Session Completed"
                  : "👍 Quiz Finished! Keep Improving"}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isPassed
                  ? "Great job! You have fully grasped this session's concepts."
                  : "You can review your incorrect answers and try again anytime."}
              </p>
            </div>

            <div
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border min-w-[120px] backdrop-blur-sm
              ${isPassed ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}
            >
              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                Your Score
              </span>
              <span
                className={`text-3xl font-black mt-1 ${isPassed ? "text-emerald-300" : "text-rose-300"}`}
              >
                {score}{" "}
                <span className="text-sm text-gray-500">
                  / {session.quiz ? session.quiz.length : 0}
                </span>
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
            <button
              onClick={() => setShowReview(!showReview)}
              className="bg-white/5 hover:bg-white/10 text-white font-medium px-4 py-2 rounded-xl text-xs transition-colors border border-white/5"
            >
              {showReview ? "Hide Quiz Review" : "Show Quiz Review"}
            </button>
          </div>
        </div>
      )}

      {completed && showReview && session.quiz && (
        <div className="max-w-3xl mx-auto space-y-4 mb-6 animate-fadeIn">
          <h3 className="text-xl font-bold text-indigo-300 mb-4">
            🔍 Detailed Quiz Review
          </h3>
          {session.quiz.map((q, i) => {
            const studentChoice = answers[i];
            const isCorrect = studentChoice === q.correct;

            return (
              <div
                key={i}
                className={`p-5 rounded-xl border ${
                  isCorrect
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : "bg-rose-950/20 border-rose-500/30"
                }`}
              >
                <h4 className="font-mono text-sm text-gray-200 mb-3 bg-black/30 p-3 rounded-lg border border-white/5">
                  {i + 1}. {q.question}
                </h4>

                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    let optionStyle =
                      "bg-black/10 text-gray-300 border-transparent";
                    let badge = null;

                    if (j === q.correct) {
                      optionStyle =
                        "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold";
                      badge = (
                        <span className="float-right text-xs bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded">
                          Correct Answer
                        </span>
                      );
                    } else if (j === studentChoice && !isCorrect) {
                      optionStyle =
                        "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold";
                      badge = (
                        <span className="float-right text-xs bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded">
                          Your Choice
                        </span>
                      );
                    } else if (j === studentChoice && isCorrect) {
                      badge = (
                        <span className="float-right text-xs bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded">
                          Your Choice (Correct)
                        </span>
                      );
                    }

                    return (
                      <div
                        key={j}
                        className={`p-2.5 rounded-lg text-sm border ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {badge}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!completed && !started && session.quiz && session.quiz.length > 0 && (
        <div className="max-w-3xl mx-auto bg-white/5 p-6 rounded-2xl mb-6 text-center border border-white/5">
          <h3 className="text-lg font-bold mb-2">Session Knowledge Quiz</h3>
          <p className="text-sm text-gray-300 mb-4">
            Test your understanding of what you learned in this session.
          </p>
          <button
            onClick={startQuiz}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            Start Quiz 🎯
          </button>
        </div>
      )}

      {!completed && started && session.quiz && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="sticky top-4 z-40 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex justify-between items-center shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Quiz in Progress...
            </div>
            <div
              className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-1.5 rounded-xl border ${timeLeft < 60 ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse" : "bg-blue-500/20 text-blue-300 border-blue-500/30"}`}
            >
              <FaClock />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {session.quiz.map((q, i) => (
            <div
              key={i}
              className="p-4 bg-white/5 rounded-xl border border-white/5 animate-fadeIn"
            >
              <h3 className="font-semibold text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-mono bg-black/10 p-3 rounded-xl border border-white/5 mb-3">
                {i + 1}. {q.question}
              </h3>

              {q.options.map((opt, j) => (
                <label
                  key={j}
                  className="block mt-2 cursor-pointer p-2.5 rounded-lg bg-black/10 hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                >
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === j}
                    className="accent-blue-500"
                    onChange={() => {
                      const copy = [...answers];
                      copy[i] = j;
                      setAnswers(copy);
                    }}
                  />{" "}
                  <span className="ml-2 text-gray-300 text-sm">{opt}</span>
                </label>
              ))}
            </div>
          ))}

          <div className="text-center pt-4">
            <button
              onClick={() => handleSubmit(answers)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/25"
            >
              Submit Quiz Answers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
