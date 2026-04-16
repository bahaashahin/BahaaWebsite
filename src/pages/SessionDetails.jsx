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
  const [score, setScore] = useState(null);

  const [showReview, setShowReview] = useState(false); // ⭐ NEW

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    fetchSession();
    checkCompleted();
  }, []);

  const fetchSession = async () => {
    const snap = await getDoc(doc(db, "sessions", id));
    setSession(snap.data());
  };

  const checkCompleted = async () => {
    if (!userId) return;

    const snap = await getDoc(doc(db, "completedSessions", userId));

    if (snap.exists()) {
      const data = snap.data();
      if (data[id]) {
        setCompleted(true);
        setScore(data[id].score);
        setAnswers(data[id].answers || []);
      }
    }
  };

  const startQuiz = () => setStarted(true);

  const handleSubmit = async () => {
    let finalScore = 0;

    session.quiz.forEach((q, i) => {
      if (answers[i] == q.correct) finalScore++;
    });

    const passed = finalScore >= session.quiz.length / 2;

    const ref = doc(db, "completedSessions", userId);
    const snap = await getDoc(ref);

    const newData = snap.exists() ? snap.data() : {};

    await setDoc(ref, {
      ...newData,
      [id]: {
        score: finalScore,
        completed: passed,
        answers,
      },
    });

    setCompleted(true);
    setScore(finalScore);
    setStarted(false);
  };

  if (!session)
    return (
      <p className="text-white p-6 text-center text-lg animate-pulse">
        Loading...
      </p>
    );

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-black p-6">
      {/* background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 blur-[120px] -top-40 -left-40" />
        <div className="absolute w-[500px] h-[500px] bg-purple-500/20 blur-[140px] -bottom-40 -right-40" />
      </div>

      {/* HEADER */}
      <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl mb-6">
        <h1 className="text-3xl font-bold">{session.title}</h1>
        <p className="text-gray-300 mt-2">{session.description}</p>
      </div>

      {/* VIDEO */}
      {session.link && (
        <div className="max-w-3xl mx-auto mb-6">
          <a
            href={session.link}
            target="_blank"
            className="inline-block text-blue-400 hover:text-blue-300 underline"
          >
            ▶ Open Lesson Video
          </a>
        </div>
      )}

      {/* COMPLETED */}
      {completed && (
        <div className="max-w-3xl mx-auto mb-6 p-5 rounded-2xl bg-green-500/10 border border-green-500/30 backdrop-blur-xl">
          <h2 className="font-bold text-green-300 text-lg">
            🎉 Session Completed
          </h2>
          <p className="text-gray-200 mt-1">
            Score: <span className="font-bold">{score}</span> /{" "}
            {session.quiz.length}
          </p>

          {/* ⭐ BUTTON REVIEW */}
          <button
            onClick={() => setShowReview(!showReview)}
            className="mt-4 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition"
          >
            {showReview ? "Hide Review" : "Show Review"}
          </button>
        </div>
      )}

      {/* START BUTTON */}
      {!completed && !started && (
        <div className="max-w-3xl mx-auto">
          <button
            onClick={startQuiz}
            className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-xl font-semibold shadow-lg hover:scale-105"
          >
            Start Quiz
          </button>
        </div>
      )}

      {/* QUIZ */}
      {started && !completed && (
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          {session.quiz.map((q, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-lg"
            >
              <h3 className="font-bold mb-3 text-lg">
                {i + 1}. {q.question}
              </h3>

              <div className="flex flex-col gap-2">
                {q.options.map((opt, j) => (
                  <label
                    key={j}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`q${i}`}
                      className="accent-blue-500"
                      onChange={() => {
                        const newAns = [...answers];
                        newAns[i] = j;
                        setAnswers(newAns);
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 transition px-6 py-3 rounded-xl font-semibold"
          >
            Submit Quiz
          </button>
        </div>
      )}

      {/* ================= REVIEW SECTION ================= */}
      {showReview && completed && session.quiz && (
        <div className="max-w-3xl mx-auto mt-10 flex flex-col gap-5">
          <h2 className="text-2xl font-bold text-center">
            Review Your Answers
          </h2>

          {session.quiz.map((q, i) => {
            const userAnswer = answers?.[i];
            const correct = q.correct;

            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/5 border border-white/10"
              >
                <h3 className="font-bold mb-2">
                  {i + 1}. {q.question}
                </h3>

                {q.options.map((opt, j) => {
                  const isCorrect = j === correct;
                  const isUser = j === userAnswer;

                  return (
                    <div
                      key={j}
                      className={`p-2 rounded-lg mb-1 border ${
                        isCorrect
                          ? "bg-green-500/20 border-green-500"
                          : isUser && !isCorrect
                            ? "bg-red-500/20 border-red-500"
                            : "border-white/10"
                      }`}
                    >
                      {opt}
                      {isCorrect && (
                        <span className="text-green-400 ml-2">✔ Correct</span>
                      )}
                      {isUser && !isCorrect && (
                        <span className="text-red-400 ml-2">✖ Your answer</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
