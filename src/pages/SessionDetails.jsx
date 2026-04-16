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
      const sessionData = data?.[id];

      if (sessionData?.completed) {
        setCompleted(true);
        setScore(sessionData.score || 0);
        setAnswers(sessionData.answers || []);
      }
    }
  };

  const startQuiz = () => setStarted(true);

  const handleSubmit = async () => {
    if (!session || !userId) return;

    let finalScore = 0;

    session.quiz.forEach((q, i) => {
      if (answers[i] === q.correct) finalScore++;
    });

    const passed = finalScore >= session.quiz.length / 2;

    const ref = doc(db, "completedSessions", userId);
    const snap = await getDoc(ref);

    const oldData = snap.exists() ? snap.data() : {};

    await setDoc(ref, {
      ...oldData,
      [id]: {
        score: finalScore,
        completed: passed,
        answers,
        timestamp: Date.now(), // 🔥 مهم للترتيب
      },
    });

    setCompleted(true);
    setScore(finalScore);
    setStarted(false);
  };

  if (!session)
    return <p className="text-white text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen text-white p-6 bg-gradient-to-br from-slate-950 via-blue-950 to-black">
      {/* HEADER */}
      <div className="max-w-3xl mx-auto bg-white/5 p-6 rounded-2xl mb-6">
        <h1 className="text-2xl font-bold">{session.title}</h1>
        <p className="text-gray-300">{session.description}</p>
      </div>

      {/* RESULT */}
      {completed && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
          <div className="flex justify-between items-center">
            <h2 className="text-green-300 font-bold">🎉 Completed</h2>

            {/* ⭐ SCORE جنب الصح */}
            <span className="text-white font-bold bg-green-600 px-3 py-1 rounded-lg">
              {score} / {session.quiz.length}
            </span>
          </div>

          <button
            onClick={() => setShowReview(!showReview)}
            className="mt-3 bg-white/10 px-4 py-2 rounded-lg"
          >
            {showReview ? "Hide Review" : "Show Review"}
          </button>
        </div>
      )}

      {/* QUIZ */}
      {!completed && started && (
        <div className="max-w-3xl mx-auto space-y-4">
          {session.quiz.map((q, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl">
              <h3>{q.question}</h3>

              {q.options.map((opt, j) => (
                <label key={j} className="block mt-2">
                  <input
                    type="radio"
                    name={`q${i}`}
                    onChange={() => {
                      const copy = [...answers];
                      copy[i] = j;
                      setAnswers(copy);
                    }}
                  />
                  <span className="ml-2">{opt}</span>
                </label>
              ))}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="bg-green-600 px-6 py-2 rounded-xl"
          >
            Submit
          </button>
        </div>
      )}

      {!started && !completed && (
        <button
          onClick={startQuiz}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          Start Quiz
        </button>
      )}

      {/* REVIEW */}
      {showReview && completed && (
        <div className="max-w-3xl mx-auto mt-6 space-y-4">
          {session.quiz.map((q, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl">
              <h3>{q.question}</h3>

              {q.options.map((opt, j) => {
                const isCorrect = j === q.correct;
                const isUser = j === answers[i];

                return (
                  <div
                    key={j}
                    className={`p-2 rounded mt-1 ${
                      isCorrect
                        ? "bg-green-500/20"
                        : isUser
                          ? "bg-red-500/20"
                          : ""
                    }`}
                  >
                    {opt}
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
