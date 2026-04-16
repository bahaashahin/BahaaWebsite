import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDocs, collection, updateDoc } from "firebase/firestore";
import Message from "../components/Message";
import useAdmin from "../hooks/useAdmin";

export default function AdminPoints() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValues, setInputValues] = useState({});
  const { isAdmin, loading: adminLoading } = useAdmin();

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const allStudents = [];

      querySnapshot.forEach((d) => {
        const data = d.data();

        const totalPoints =
          (data.points?.tasks || 0) +
          (data.points?.attendance || 0) +
          (data.points?.search || 0) +
          (data.points?.bonus || 0);

        allStudents.push({
          id: d.id,
          ...data,
          totalPoints,
        });
      });

      allStudents.sort((a, b) => b.totalPoints - a.totalPoints);

      setStudents(allStudents);
    } catch (error) {
      console.error(error);
      setMessage({ text: "فشل تحميل الطلاب", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchStudents();
    else if (!adminLoading) setLoading(false);
  }, [isAdmin, adminLoading]);

  const handleInputChange = (id, value) => {
    setInputValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddPoints = async (id) => {
    const addedPoints = Number(inputValues[id]);

    if (!addedPoints || addedPoints === 0) {
      setMessage({ text: "أدخل عدد نقاط صحيح", type: "error" });
      return;
    }

    const studentRef = doc(db, "students", id);
    const studentData = students.find((s) => s.id === id);

    if (!studentData) return;

    const newPoints = {
      tasks: studentData.points?.tasks || 0,
      attendance: studentData.points?.attendance || 0,
      search: studentData.points?.search || 0,
      bonus: studentData.points?.bonus || 0,
    };

    newPoints.bonus += addedPoints;

    await updateDoc(studentRef, { points: newPoints });

    setMessage({
      text: `تم إضافة ${addedPoints} نقطة لـ ${studentData.Name}`,
      type: "success",
    });

    setInputValues((prev) => ({ ...prev, [id]: "" }));

    fetchStudents();
  };

  if (loading || adminLoading) {
    return (
      <p className="text-white text-center mt-20 text-xl font-semibold">
        Loading...
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        ليس لديك صلاحية للدخول لهذه الصفحة
      </div>
    );
  }

  const filteredStudents = students.filter((s) =>
    s.Name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 px-6 py-10 flex flex-col items-center gap-8">
      <div className="h-10" />

      <h1 className="text-3xl font-bold text-white">Manage Students Points</h1>

      {/* ================= SEARCH ================= */}
      <input
        type="text"
        placeholder="Search by name"
        className="w-full max-w-2xl p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* ================= STUDENTS ================= */}
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {filteredStudents.map((s, i) => (
          <div
            key={s.id}
            className="p-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-white shadow-lg transition hover:scale-[1.01]"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">
                {i + 1}. {s.Name}
              </span>

              <span className="text-gray-300 text-sm">
                {s.totalPoints} pts | Level {s.Level}
              </span>
            </div>

            {/* BONUS INFO */}
            <div className="text-sm text-gray-400 mt-2">
              Bonus: {s.points?.bonus || 0}
            </div>

            {/* INPUT */}
            <div className="flex gap-2 mt-4">
              <input
                type="number"
                placeholder="Add Bonus"
                className="p-3 rounded-xl bg-black/30 border border-white/10 text-white flex-1 outline-none"
                value={inputValues[s.id] || ""}
                onChange={(e) => handleInputChange(s.id, e.target.value)}
              />

              <button
                className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition font-medium"
                onClick={() => handleAddPoints(s.id)}
              >
                إضافة
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= MESSAGE ================= */}
      {message && (
        <Message
          text={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}
    </div>
  );
}
