import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Footer from "../components/Footer";

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      const docRef = doc(db, "students", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setStudent(docSnap.data());

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

      {/* ================= STUDENT CARD ================= */}
      <div className="w-full max-w-3xl p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-white transition hover:scale-[1.01] hover:bg-white/10">
        <h1 className="text-3xl font-bold mb-4">{student?.Name}</h1>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-200">
          <p>
            <span className="text-gray-400">Email:</span> {student?.Email}
          </p>
          <p>
            <span className="text-gray-400">Phone:</span> {student?.Phone}
          </p>
          <p>
            <span className="text-gray-400">Age:</span> {student?.Age}
          </p>
          <p>
            <span className="text-gray-400">Status:</span> {student?.Student}
          </p>
          <p>
            <span className="text-gray-400">Level:</span> {student?.Level}
          </p>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="w-full max-w-3xl grid md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl text-white flex justify-between items-center hover:bg-white/10 transition">
          <div>
            <p className="text-sm text-gray-400">Total Points</p>
            <p className="text-4xl font-bold mt-1">{studentPoints}</p>
          </div>
          <div className="text-4xl">⭐</div>
        </div>

        {firstStudent && (
          <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl text-white flex justify-between items-center hover:bg-white/10 transition">
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

      {/* ================= RANKING ================= */}
      <div className="w-full max-w-3xl p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-center text-white">
          Ranking
        </h2>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {students.map((s, i) => (
            <div
              key={s.id}
              className={`p-3 rounded-xl flex justify-between items-center transition hover:scale-[1.02]
              ${
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
