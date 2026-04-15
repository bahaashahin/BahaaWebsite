import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";

export default function SessionDetails() {
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(null);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    fetchSession();
    checkCompleted();
  }, []);

  // ================= FETCH SESSION =================
  const fetchSession = async () => {
    const snap = await getDoc(doc(db, "sessions", id));
    setSession(snap.data());
  };

  // ================= CHECK IF ALREADY DONE =================
  const checkCompleted = async () => {
    if (!userId) return;

    const snap = await getDoc(doc(db, "completedSessions", userId));

    if (snap.exists()) {
      const data = snap.data();
      if (data[id]) {
        setCompleted(true);
        setScore(data[id].score);
      }
    }
  };

  // ================= START QUIZ =================
  const startQuiz = () => {
    setStarted(true);
  };

  // ================= SUBMIT =================
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
      },
    });

    setCompleted(true);
    setScore(finalScore);
    setStarted(false);
  };

  if (!session) return <p className="text-white p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6 flex flex-col gap-6">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-3xl font-bold">{session.title}</h1>
        <p className="text-gray-300">{session.description}</p>
      </div>

      {/* ================= VIDEO ================= */}
      {session.link && (
        <a
          href={session.link}
          target="_blank"
          className="text-blue-400 underline"
        >
          Open Lesson Video
        </a>
      )}

      {/* ================= COMPLETED ================= */}
      {completed && (
        <div className="bg-green-500/20 border border-green-500/40 p-4 rounded-xl">
          🎉 You already completed this session
          <br />
          Score: {score} / {session.quiz.length}
        </div>
      )}

      {/* ================= START BUTTON ================= */}
      {!completed && !started && (
        <button
          onClick={startQuiz}
          className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-xl w-fit"
        >
          Start Quiz
        </button>
      )}

      {/* ================= QUIZ ================= */}
      {started && !completed && (
        <div className="flex flex-col gap-5">
          {session.quiz.map((q, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 p-4 rounded-xl"
            >
              <h3 className="font-bold mb-2">{q.question}</h3>

              {q.options.map((opt, j) => (
                <label key={j} className="block mb-1">
                  <input
                    type="radio"
                    name={`q${i}`}
                    className="mr-2"
                    onChange={() => {
                      const newAns = [...answers];
                      newAns[i] = j;
                      setAnswers(newAns);
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 transition px-6 py-3 rounded-xl"
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
}
