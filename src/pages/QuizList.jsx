import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      const quizSnap = await getDocs(collection(db, "quizzes"));

      setQuizzes(
        quizSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );

      if (user) {
        const resSnap = await getDocs(collection(db, "quizResults"));

        const userResults = resSnap.docs
          .map((d) => d.data())
          .filter((r) => r.userId === user.uid);

        setResults(userResults);
      }
    };

    fetchData();
  }, []);

  const getResult = (quizId) => results.find((r) => r.quizId === quizId);

  const isCompleted = (quizId) => results.some((r) => r.quizId === quizId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6">
      <h2 className="text-3xl font-bold text-center mb-10">
        🧠 Available Quizzes
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {quizzes.map((q) => {
          const completed = isCompleted(q.id);
          const result = getResult(q.id);

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border transition
              ${
                completed
                  ? "border-green-500 bg-green-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <h3 className="text-xl font-bold mb-2 flex justify-between">
                {q.title}

                {completed && (
                  <span className="text-xs bg-green-500 text-black px-2 py-1 rounded-full">
                    Completed
                  </span>
                )}
              </h3>

              <p className="text-gray-300 text-sm mb-4">{q.description}</p>

              <div className="flex gap-3 flex-wrap">
                {/* START */}
                <Link to={`/exam/${q.id}`}>
                  <button
                    disabled={completed}
                    className={`px-4 py-2 rounded font-bold ${
                      completed
                        ? "bg-gray-600"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    Start Exam 🚀
                  </button>
                </Link>

                {/* VIEW RESULT (MODAL) */}
                {completed && (
                  <button
                    onClick={() => setSelectedResult(result)}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700"
                  >
                    View Result 📊
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= RESULT MODAL ================= */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 w-full max-w-2xl p-6 rounded-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">📊 Detailed Result</h2>

            <p className="mb-4 text-green-400 font-bold">
              Score: {selectedResult.score} / {selectedResult.total}
            </p>

            {/* ================= QUESTIONS REVIEW ================= */}
            <div className="flex flex-col gap-4">
              {quizzes
                .find((q) => q.id === selectedResult.quizId)
                ?.questions.map((q, i) => {
                  const userAnswer = selectedResult.answers?.[i];
                  const correctAnswer = q.correct;

                  const isCorrect = userAnswer === correctAnswer;

                  return (
                    <div
                      key={i}
                      className="p-4 rounded border border-white/10 bg-white/5"
                    >
                      {/* QUESTION */}
                      <h3 className="font-bold mb-2">
                        {i + 1}. {q.question}
                      </h3>

                      {/* OPTIONS */}
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, j) => {
                          let style = "p-2 rounded bg-white/10";

                          // correct answer
                          if (j === correctAnswer) {
                            style =
                              "p-2 rounded bg-green-600 text-white font-bold";
                          }

                          // wrong selected answer
                          if (j === userAnswer && !isCorrect) {
                            style =
                              "p-2 rounded bg-red-600 text-white font-bold";
                          }

                          return (
                            <div key={j} className={style}>
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* CLOSE */}
            <button
              onClick={() => setSelectedResult(null)}
              className="mt-5 bg-red-600 px-4 py-2 rounded w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
