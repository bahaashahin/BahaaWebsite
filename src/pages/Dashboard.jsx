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

      // جلب بيانات المستخدم فقط
      const docRef = doc(db, "students", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStudent(docSnap.data());
      }

      // جلب كل الطلاب بغض النظر عن الرول
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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-950 p-6 flex flex-col items-center space-y-6">
      <div className="mb-20"></div>

      {/* Student Info */}
      <div className="w-full max-w-2xl p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl text-white transition hover:bg-black/50 hover:scale-[1.02]">
        <h1 className="text-2xl font-bold mb-4">{student?.Name}</h1>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-200">
          <p>
            <span className="font-semibold">Email:</span> {student?.Email}
          </p>
          <p>
            <span className="font-semibold">Phone:</span> {student?.Phone}
          </p>
          <p>
            <span className="font-semibold">Age:</span> {student?.Age}
          </p>
          <p>
            <span className="font-semibold">Status:</span> {student?.Student}
          </p>
          <p>
            <span className="font-semibold">Level:</span> {student?.Level}
          </p>
        </div>
      </div>

      {/* Points Card */}
      <div className="w-full max-w-2xl grid md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl text-white flex justify-between items-center transition hover:bg-black/50 hover:scale-[1.03]">
          <div>
            <p className="text-sm text-gray-300">Your Total Points</p>
            <p className="text-4xl font-extrabold mt-1">{studentPoints}</p>
          </div>
          <div className="text-4xl opacity-80">⭐</div>
        </div>

        {/* Top Student */}
        {firstStudent && (
          <div className="p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl text-white flex justify-between items-center transition hover:bg-black/50 hover:scale-[1.03]">
            <div>
              <p className="text-sm text-gray-300">Top Student</p>
              <h2 className="text-2xl font-bold mt-1">{firstStudent.Name}</h2>
              <p className="text-sm text-gray-300 mt-1">
                {firstStudent.totalPoints} pts | Level {firstStudent.Level}
              </p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        )}
      </div>

      {/* Ranking List */}
      <div className="w-full max-w-2xl p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-center text-white">
          Student Rankings
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
              <span className="font-semibold">
                {i + 1}
                {i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"}{" "}
                {s.Name}
              </span>
              <span className="text-sm font-semibold">
                {s.totalPoints} pts | Lv {s.Level}
              </span>
            </div>
          ))}
        </div>
      </div>
      
    </div>
    
  );
}
