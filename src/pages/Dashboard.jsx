import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { FaCheck, FaTimes } from "react-icons/fa";

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessionsStatus, setSessionsStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      // student
      const docRef = doc(db, "students", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setStudent(docSnap.data());

      // completed sessions
      const completedRef = doc(db, "completedSessions", uid);
      const completedSnap = await getDoc(completedRef);

      let completedData = {};
      if (completedSnap.exists()) {
        completedData = completedSnap.data();
      }

      // sessions
      const sessionsSnap = await getDocs(collection(db, "sessions"));

      const sessionsArr = [];

      sessionsSnap.forEach((s) => {
        const sessionId = s.id;
        const sessionData = s.data();
        const userSession = completedData[sessionId] || {};

        sessionsArr.push({
          id: sessionId,
          name: sessionData.title || sessionId,
          completed: userSession.completed || false,
          score: userSession.score || 0,
          createdAt: sessionData.createdAt || 0,
        });
      });

      // 🔥 FIXED SORT (NEWEST FIRST)
      sessionsArr.sort((a, b) => b.createdAt - a.createdAt);

      setSessionsStatus(sessionsArr);

      // students ranking
      const querySnapshot = await getDocs(collection(db, "students"));
      const allStudents = [];

      querySnapshot.forEach((d) => {
        const data = d.data();
        const totalPoints =
          (data.points?.tasks || 0) +
          (data.points?.attendance || 0) +
          (data.points?.search || 0) +
          (data.points?.bonus || 0);

        allStudents.push({ id: d.id, ...data, totalPoints });
      });

      allStudents.sort((a, b) => b.totalPoints - a.totalPoints);
      setStudents(allStudents);

      setLoading(false);
    };

    const unsubscribe = auth.onAuthStateChanged(() => fetchData());
    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <p className="text-white text-center mt-20 text-xl font-semibold">
        Loading...
      </p>
    );

  const studentPoints =
    (student?.points?.tasks || 0) +
    (student?.points?.attendance || 0) +
    (student?.points?.search || 0) +
    (student?.points?.bonus || 0);

  const firstStudent = students[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6 flex flex-col items-center space-y-6">
      <div className="mb-10" />

      {/* STUDENT */}
      <div className="w-full max-w-3xl p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-white">
        <h1 className="text-3xl font-bold mb-4">{student?.Name}</h1>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-200">
          <p>Email: {student?.Email}</p>
          <p>Phone: {student?.Phone}</p>
          <p>Age: {student?.Age}</p>
          <p>Status: {student?.Student}</p>
          <p>Level: {student?.Level}</p>
        </div>
      </div>

      {/* SESSIONS */}
      {/* ================= SESSIONS STATUS ================= */}
      {/* ================= SESSIONS STATUS ================= */}
      <div className="w-full max-w-3xl p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-white">
        <h2 className="text-xl font-bold mb-4">Sessions Progress</h2>

        <div className="space-y-2">
          {[...sessionsStatus]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .map((session) => {
              const isCompleted = session.completed;
              const score = session.score;

              return (
                <div
                  key={session.id}
                  className={`flex justify-between items-center p-3 rounded-xl transition
            ${isCompleted ? "bg-blue-500/20" : "bg-black/30"}`}
                >
                  <span className="flex items-center gap-2">
                    {session.name}
                  </span>

                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <span className="text-xs text-green-300">
                        {score} pts
                      </span>
                    )}

                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        isCompleted ? "bg-blue-500" : "bg-gray-500"
                      }`}
                    >
                      {isCompleted ? <FaCheck /> : <FaTimes />}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* STATS */}
      <div className="w-full max-w-3xl grid md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl text-white flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Total Points</p>
            <p className="text-4xl font-bold mt-1">{studentPoints}</p>
          </div>
          <div className="text-4xl">⭐</div>
        </div>

        {firstStudent && (
          <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl text-white flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Top Student</p>
              <h2 className="text-2xl font-bold">{firstStudent.Name}</h2>
              <p className="text-sm text-gray-400 mt-1">
                {firstStudent.totalPoints} pts
              </p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        )}
      </div>

      {/* RANKING */}
      <div className="w-full max-w-3xl p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-center text-white">
          Ranking
        </h2>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {students.map((s, i) => (
            <div
              key={s.id}
              className={`p-3 rounded-xl flex justify-between items-center ${
                s.id === auth.currentUser.uid
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-black/30 text-gray-200"
              }`}
            >
              <span>
                <span className="font-bold mr-2">{i + 1}</span>
                {s.Name}
              </span>

              <span className="font-semibold">{s.totalPoints} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
