import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";

export default function SessionReport() {
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
    const [openAnswers, setOpenAnswers] = useState(null);
    const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);

    const sessionSnap = await getDoc(doc(db, "sessions", id));
    setSession(sessionSnap.data());

    const studentsSnap = await getDocs(collection(db, "students"));
    const completedSnap = await getDocs(collection(db, "completedSessions"));

    const completedMap = {};

    completedSnap.forEach((docu) => {
      const data = docu.data();
      const attempt = data?.[id];

      if (attempt?.sessionId === id) {
        completedMap[docu.id] = attempt;
      }
    });

    let result = [];

    studentsSnap.forEach((s) => {
      const studentId = s.id;
      const student = s.data();

      const attempt = completedMap[studentId];

      result.push({
        uid: studentId,
        name: student?.Name || "Unknown",
        email: student?.Email || "",
        score: attempt?.score || 0,
        completed: attempt?.completed || false,
        answers: attempt?.answers || [],
      });
    });

    result.sort((a, b) => b.score - a.score);

    setReports(result);
    setLoading(false);
  };

  if (loading)
    return <p className="text-white text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-950 to-black text-white">
      {/* HEADER */}
      <div className="max-w-3xl mx-auto mb-6 bg-white/5 p-5 rounded-2xl">
        <h1 className="text-2xl font-bold">{session?.title}</h1>
        <p className="text-gray-400">{session?.description}</p>
      </div>

      {/* STATS */}
      <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-500/10 p-4 rounded-xl text-center">
          <h2 className="text-xl font-bold text-green-300">
            {reports.filter((r) => r.completed).length}
          </h2>
          <p>Completed</p>
        </div>

        <div className="bg-red-500/10 p-4 rounded-xl text-center">
          <h2 className="text-xl font-bold text-red-300">
            {reports.filter((r) => !r.completed).length}
          </h2>
          <p>Not Completed</p>
        </div>
      </div>
      {/* SEARCH */}
      <div className="max-w-3xl mx-auto mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500"
        />
      </div>
      {/* LIST */}
      <div className="max-w-3xl mx-auto space-y-4">
        {reports
          .filter(
            (r) =>
              r.name.toLowerCase().includes(search.toLowerCase()) ||
              r.email.toLowerCase().includes(search.toLowerCase()),
          )
          .map((r, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-xl">
              {/* USER INFO */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{r.name}</h3>
                  <p className="text-gray-400 text-sm">{r.email}</p>
                </div>

                <div className="text-right">
                  <p className="font-bold">{r.score} pts</p>
                  <p
                    className={r.completed ? "text-green-400" : "text-red-400"}
                  >
                    {r.completed ? "Passed" : "Not Passed"}
                  </p>
                </div>
              </div>

              {/* BUTTON */}
              {r.answers.length > 0 && (
                <button
                  onClick={() => setOpenAnswers(openAnswers === i ? null : i)}
                  className="mt-3 text-sm bg-blue-600 px-3 py-1 rounded"
                >
                  {openAnswers === i ? "Hide Answers" : "View Answers"}
                </button>
              )}

              {/* ANSWERS (🔥 NEW UPGRADE) */}
              {openAnswers === i && (
                <div className="mt-4 space-y-3 bg-black/30 p-3 rounded">
                  {session?.quiz?.map((q, qIndex) => {
                    const userAns = r.answers?.[qIndex];
                    const correctAns = q.correct;

                    return (
                      <div key={qIndex} className="p-2 rounded">
                        {/* QUESTION */}
                        <p className="font-semibold mb-2">
                          Q{qIndex + 1}: {q.question}
                        </p>

                        {/* OPTIONS */}
                        {q.options.map((opt, j) => {
                          const isCorrect = j === correctAns;
                          const isUser = j === userAns;

                          return (
                            <div
                              key={j}
                              className={`p-2 rounded mt-1 ${
                                isCorrect
                                  ? "bg-green-500/30 border border-green-400"
                                  : isUser
                                    ? "bg-red-500/30 border border-red-400"
                                    : "bg-white/5"
                              }`}
                            >
                              {opt}
                              {isCorrect && " ✅"}
                              {isUser && !isCorrect && " ❌"}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
