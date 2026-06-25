import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useParams } from "react-router-dom";

export default function Exam() {
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [started, setStarted] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);
  const [timeOut, setTimeOut] = useState(false);

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  const user = auth.currentUser;

  const resultDocId = `${id}_${user?.uid}`;

  // ================= FETCH QUIZ =================
  useEffect(() => {
    const fetchQuiz = async () => {
      const snap = await getDoc(doc(db, "quizzes", id));

      if (snap.exists()) {
        const data = snap.data();
        setQuiz(data);
        setTimeLeft((data.timer || 10) * 60);
      } else {
        setQuiz(null);
      }
    };

    fetchQuiz();
  }, [id]);

  // ================= CHECK IF ALREADY DONE =================
  useEffect(() => {
    const checkDone = async () => {
      if (!user) return;

      const snap = await getDoc(doc(db, "quizResults", resultDocId));

      if (snap.exists()) {
        setAlreadyDone(true);
      }
    };

    checkDone();
  }, [id, user]);

  // ================= TIMER =================
  useEffect(() => {
    if (!started || submitted || timeOut) return;

    if (timeLeft <= 0) {
      setTimeOut(true);
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timeLeft]);

  // ================= START =================
  const startExam = () => {
    setStarted(true);
  };

  // ================= ANSWERS =================
  const handleAnswer = (qIndex, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: value,
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (submitted || !quiz || !user) return;

    setSubmitted(true);

    let score = 0;

    quiz.questions.forEach((q, i) => {
      if (q.type === "mcq" && answers[i] === q.correct) {
        score += q.points || 1;
      }
    });

    const data = {
      userId: user.uid,
      quizId: id,
      answers,
      score,
      total: quiz.questions.length,
      createdAt: serverTimestamp(),
    };

    // 💾 SAVE (ONE TIME ONLY)
    await setDoc(doc(db, "quizResults", resultDocId), data);

    setResult({
      score,
      total: quiz.questions.length,
    });
  };

  // ================= BLOCK IF ALREADY DONE =================
  if (alreadyDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <h1 className="text-2xl text-red-500 font-bold">
          ❌ You already submitted this exam
        </h1>
      </div>
    );
  }

  // ================= NOT FOUND =================
  if (!quiz) return <p>❌ Quiz Not Found</p>;

  // ================= RESULT =================
  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-black text-white p-6">
        <h1 className="text-3xl text-green-400 font-bold">🎉 Exam Finished</h1>

        <p className="text-xl mt-3">
          Score: {result.score} / {result.total}
        </p>
      </div>
    );
  }

  // ================= TIMEOUT =================
  if (timeOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <h1 className="text-3xl text-red-500 font-bold">⛔ Time Out</h1>
      </div>
    );
  }

  // ================= START SCREEN =================
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-3">{quiz.title}</h1>

        <p>⏱ Time: {quiz.timer} min</p>

        <button
          onClick={startExam}
          className="bg-green-600 px-6 py-3 rounded mt-5"
        >
          Start Exam
        </button>
      </div>
    );
  }

  // ================= EXAM UI =================
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* TIMER */}
      <div className="fixed top-4 right-4 bg-red-600 px-4 py-2 rounded">
        ⏱ {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </div>

      <h1 className="text-2xl font-bold mb-6">{quiz.title}</h1>

      {quiz.questions.map((q, i) => (
        <div
          key={i}
          className="mb-6 p-4 bg-white/5 rounded border border-white/10"
        >
          <h3 className="font-bold mb-3">
            {i + 1}. {q.question}
          </h3>

          {q.type === "mcq" &&
            q.options.map((opt, j) => (
              <button
                key={j}
                onClick={() => handleAnswer(i, j)}
                className={`block w-full text-left p-2 my-1 rounded ${
                  answers[i] === j ? "bg-green-600" : "bg-white/10"
                }`}
              >
                {opt}
              </button>
            ))}

          {(q.type === "essay" || q.type === "code") && (
            <textarea
              className="w-full p-2 bg-white/10 rounded"
              onChange={(e) => handleAnswer(i, e.target.value)}
            />
          )}
        </div>
      ))}

      <button onClick={handleSubmit} className="bg-blue-600 px-6 py-3 rounded">
        Submit Exam
      </button>
    </div>
  );
}
