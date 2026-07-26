import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import {
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Check,
  X,
  BookOpen,
  UserCheck,
  UserX,
} from "lucide-react";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium tracking-wide">Loading report...</p>
      </div>
    );
  }

  const completedCount = reports.filter((r) => r.completed).length;
  const notCompletedCount = reports.filter((r) => !r.completed).length;

  const activeStudent = openAnswers !== null ? reports[openAnswers] : null;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 hidden sm:block">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {session?.title || "Session Report"}
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                {session?.description ||
                  "No description available for this session."}
              </p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex items-center gap-4 transition-all hover:bg-emerald-500/10">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-emerald-400">
                {completedCount}
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                Completed / Passed
              </p>
            </div>
          </div>

          <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl flex items-center gap-4 transition-all hover:bg-rose-500/10">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-rose-400">
                {notCompletedCount}
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                Not Completed
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner text-sm md:text-base"
          />
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {reports
            .filter(
              (r) =>
                r.name.toLowerCase().includes(search.toLowerCase()) ||
                r.email.toLowerCase().includes(search.toLowerCase()),
            )
            .map((r, i) => (
              <div
                key={i}
                className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl transition-all hover:border-slate-700 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                {/* USER INFO */}
                <div className="space-y-0.5">
                  <h3 className="font-bold text-base text-white tracking-wide">
                    {r.name}
                  </h3>
                  <p className="text-slate-400 text-xs md:text-sm">
                    {r.email || "No email provided"}
                  </p>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <p className="font-extrabold text-blue-400 text-base">
                      {r.score}{" "}
                      <span className="text-xs text-slate-400 font-normal">
                        pts
                      </span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {r.completed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BUTTON */}
                  {r.answers.length > 0 && (
                    <button
                      onClick={() => setOpenAnswers(i)}
                      className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                      <Eye className="w-4 h-4" /> View Answers
                    </button>
                  )}
                </div>
              </div>
            ))}

          {reports.length === 0 && (
            <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <p className="text-slate-400 text-sm">
                No reports are currently available.
              </p>
            </div>
          )}
        </div>

        {/* MODAL / POPUP OVERLAY FOR ANSWERS */}
        {openAnswers !== null && activeStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              {/* MODAL HEADER */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {activeStudent.name}&apos;s Answers
                  </h3>
                  <p className="text-xs text-slate-400">
                    Score: {activeStudent.score} pts
                  </p>
                </div>
                <button
                  onClick={() => setOpenAnswers(null)}
                  className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL CONTENT */}
              <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
                {session?.quiz?.map((q, qIndex) => {
                  const userAns = activeStudent.answers?.[qIndex];
                  const correctAns = q.correct;

                  return (
                    <div
                      key={qIndex}
                      className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-3"
                    >
                      <p className="font-semibold text-sm md:text-base text-slate-200">
                        <span className="text-blue-400 font-bold ml-1">
                          Q{qIndex + 1}:
                        </span>{" "}
                        {q.question}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt, j) => {
                          const isCorrect = j === correctAns;
                          const isUser = j === userAns;

                          let optionStyle =
                            "bg-slate-900/60 border-slate-800 text-slate-300";
                          if (isCorrect) {
                            optionStyle =
                              "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium";
                          } else if (isUser && !isCorrect) {
                            optionStyle =
                              "bg-rose-500/10 border-rose-500/30 text-rose-300 font-medium";
                          }

                          return (
                            <div
                              key={j}
                              className={`p-3 rounded-xl border text-sm flex items-center justify-between transition-all ${optionStyle}`}
                            >
                              <span>{opt}</span>
                              <div className="flex items-center gap-1.5">
                                {isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                                    <Check className="w-3.5 h-3.5" /> Correct
                                  </span>
                                )}
                                {isUser && !isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-lg border border-rose-500/30">
                                    <X className="w-3.5 h-3.5" /> Student Answer
                                  </span>
                                )}
                                {isUser && isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                                    <Check className="w-3.5 h-3.5" /> Student
                                    Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
                <button
                  onClick={() => setOpenAnswers(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
