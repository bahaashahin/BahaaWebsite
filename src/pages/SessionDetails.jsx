import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";

export default function SessionDetails() {
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPassed, setIsPassed] = useState(false); // لمعرفة حالة النجاح لتشغيل الاحتفال
  const [confetti, setConfetti] = useState([]); // لتوليد عناصر الاحتفال المخصصة

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    fetchSession();
    checkCompleted();
  }, []);

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

  // دالة لتوليد جزيئات الاحتفال تلقائياً عند النجاح
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

    // إخفاء الاحتفال بعد 6 ثوانٍ لتوفير الأداء
    setTimeout(() => {
      setConfetti([]);
    }, 6000);
  };

  const fetchSession = async () => {
    const snap = await getDoc(doc(db, "sessions", id));
    const data = snap.data();
    setSession(data);
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
      }
    }
  };

  const startQuiz = () => setStarted(true);

  const handleSubmit = async () => {
    if (!session || !userId) return;

    if (answers.length !== session.quiz.length || answers.includes(undefined)) {
      setError("⚠️ Please answer all questions before submitting.");
      return;
    }

    let finalScore = 0;

    session.quiz.forEach((q, i) => {
      if (answers[i] === q.correct) finalScore++;
    });

    // شرط النجاح: حل نصف الأسئلة أو أكثر صحيح
    const passed = finalScore >= session.quiz.length / 2;

    const ref = doc(db, "completedSessions", userId);
    const snap = await getDoc(ref);

    const oldData = snap.exists() ? snap.data() : {};

    await setDoc(ref, {
      ...oldData,
      [id]: {
        sessionId: id,
        score: finalScore,
        completed: passed,
        answers,
        timestamp: Date.now(),
      },
    });

    setCompleted(true);
    setScore(finalScore);
    setIsPassed(passed);
    setStarted(false);

    // إذا نجح شغل تأثير الاحتفالات فوراً!
    if (passed) {
      triggerConfetti();
    }
  };

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setSuccessMsg("📋 Code copied to clipboard successfully!");
  };

  if (!session)
    return <p className="text-white text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen text-white p-6 bg-gradient-to-br from-slate-950 via-blue-950 to-black relative overflow-hidden">
      {/* 🔥 CUSTOM CONFETTI EFFECT */}
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

      {/* 🔥 Toast Notifications */}
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

      {/* HEADER */}
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

      {/* ================= RESOURCES SECTION ================= */}
      {((session.sessionFile && session.sessionFile.url) ||
        (session.sessionCode && session.sessionCode.body)) && (
        <div className="max-w-3xl mx-auto bg-white/5 p-6 rounded-2xl mb-6 border border-white/5 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-indigo-400 border-b border-white/10 pb-2">
            Session Resources
          </h2>

          {/* File Download */}
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

          {/* Code View */}
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

      {/* ================= CUSTOM ANIMATED RESULT UI ================= */}
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
                  / {session.quiz.length}
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

      {/* QUIZ */}
      {!completed && started && (
        <div className="max-w-3xl mx-auto space-y-4">
          {session.quiz.map((q, i) => (
            <div
              key={i}
              className="p-4 bg-white/5 rounded-xl border border-white/5 animate-fadeIn"
            >
              {/* ⭐ إضافة كلاسات الـ whitespace والخط ليعرض نص الكود والمسافات البرمجية بدقة للطالب */}
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
                    className="accent-blue-500"
                    onChange={() => {
                      const copy = [...answers];
                      copy[i] = j;
                      setAnswers(copy);
                    }}
                  />
                  <span className="ml-2 text-gray-300 text-sm">{opt}</span>
                </label>
              ))}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-500 transition-colors px-6 py-2.5 rounded-xl font-bold w-full sm:w-auto"
          >
            Submit Answers
          </button>
        </div>
      )}

      {!started && !completed && (
        <div className="max-w-3xl mx-auto text-center py-10 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-gray-400 mb-4 text-sm">
            Test your understanding of this session by taking a quick quiz!
          </p>
          <button
            onClick={startQuiz}
            className="bg-blue-600 hover:bg-blue-500 transition-colors px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20"
          >
            Start Quiz
          </button>
        </div>
      )}

      {/* REVIEW */}
      {showReview && completed && (
        <div className="max-w-3xl mx-auto mt-6 space-y-4 animate-fadeIn">
          <h3 className="text-lg font-bold text-gray-400 mb-2">
            Review Questions:
          </h3>
          {session.quiz.map((q, i) => (
            <div
              key={i}
              className="p-4 bg-white/5 rounded-xl border border-white/5"
            >
              {/* ⭐ تعديل عرض السؤال في جزء المراجعة لدعم الأكواد والمسافات */}
              <h3 className="font-semibold text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-black/20 p-3 rounded-xl border border-white/5 mb-3">
                {i + 1}. {q.question}
              </h3>

              {q.options.map((opt, j) => {
                const isCorrect = j === q.correct;
                const isUser = j === answers[i];

                return (
                  <div
                    key={j}
                    className={`p-2.5 rounded-lg mt-2 text-sm flex items-center justify-between ${
                      isCorrect
                        ? "bg-green-500/20 border border-green-500/30 text-green-300 font-medium"
                        : isUser
                          ? "bg-red-500/20 border border-red-500/30 text-red-300"
                          : "bg-black/10 text-gray-400"
                    }`}
                  >
                    <span>{opt}</span>
                    {isCorrect && (
                      <span className="text-xs bg-green-500/20 px-2 py-0.5 rounded text-green-300 font-bold">
                        Correct Answer
                      </span>
                    )}
                    {isUser && !isCorrect && (
                      <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded text-red-300 font-bold">
                        Your Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
