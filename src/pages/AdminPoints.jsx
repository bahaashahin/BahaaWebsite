import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDocs, collection, updateDoc } from "firebase/firestore";
import {
  FaCrown,
  FaMedal,
  FaSearch,
  FaGraduationCap, // تم تعديل الأيقونة هنا لتجنب خطأ التصدير 🎓
  FaPlus,
  FaTasks,
  FaCalendarCheck,
  FaDatabase,
  FaGift,
} from "react-icons/fa";
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
      setMessage({ text: "فشل تحميل قائمة الطلاب", type: "error" });
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
      setMessage({ text: "الرجاء إدخال عدد نقاط صحيح", type: "error" });
      return;
    }

    const studentRef = doc(db, "students", id);
    const studentData = students.find((s) => s.id === id);

    if (!studentData) return;

    const newPoints = {
      tasks: studentData.points?.tasks || 0,
      attendance: studentData.points?.attendance || 0,
      search: studentData.points?.search || 0,
      bonus: (studentData.points?.bonus || 0) + addedPoints,
    };

    try {
      setStudents((prevStudents) =>
        prevStudents
          .map((s) => {
            if (s.id === id) {
              const updatedTotal =
                newPoints.tasks +
                newPoints.attendance +
                newPoints.search +
                newPoints.bonus;
              return { ...s, points: newPoints, totalPoints: updatedTotal };
            }
            return s;
          })
          .sort((a, b) => b.totalPoints - a.totalPoints),
      );

      setInputValues((prev) => ({ ...prev, [id]: "" }));

      setMessage({
        text: `تم إضافة ${addedPoints} نقطة بنجاح للطالب: ${studentData.Name}`,
        type: "success",
      });

      await updateDoc(studentRef, { points: newPoints });
    } catch (err) {
      console.error(err);
      setMessage({ text: "حدث خطأ أثناء حفظ النقاط بالسيرفر", type: "error" });
      fetchStudents();
    }
  };

  if (loading || adminLoading) return <SkeletonLoader />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 text-center">
        ليس لديك صلاحية للدخول لهذه الصفحة
      </div>
    );
  }

  const filteredStudents = students.filter((s) =>
    s.Name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getRankBadge = (index) => {
    if (index === 0)
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
          <FaCrown className="text-sm animate-pulse" />
        </div>
      );
    if (index === 1)
      return (
        <div className="w-8 h-8 rounded-xl bg-slate-300/20 text-slate-300 flex items-center justify-center border border-slate-300/30">
          <FaMedal className="text-sm" />
        </div>
      );
    if (index === 2)
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-700/20 text-amber-600 flex items-center justify-center border border-amber-700/30">
          <FaMedal className="text-sm" />
        </div>
      );
    return (
      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center text-xs font-bold font-mono">
        #{index + 1}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* الهيدر الرئيسي */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <div className="w-12 h-12 bg-indigo-600/30 border border-indigo-500 text-indigo-400 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0">
            <FaGraduationCap />
          </div>
          <div>
            <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">
              Scoreboard Control
            </p>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              Manage Students Points
            </h1>
          </div>
        </div>

        {/* صندوق البحث */}
        <div className="relative group">
          <FaSearch className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors text-sm" />
          <input
            type="text"
            placeholder="Search student by name..."
            className="w-full p-3.5 pl-11 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* قائمة الطلاب */}
        <div className="space-y-3">
          {filteredStudents.map((s, i) => (
            <div
              key={s.id}
              className="p-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-white shadow-xl hover:border-white/20 transition-all duration-200 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(i)}
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-white truncate">
                      {s.Name}
                    </h3>
                    <p className="text-[11px] text-indigo-400 font-medium uppercase tracking-wider mt-0.5">
                      Level {s.Level || 1}
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 rounded-xl shrink-0 text-center shadow-inner">
                  <span className="text-sm font-black text-indigo-300 font-mono">
                    {s.totalPoints}
                  </span>
                  <span className="text-[10px] text-indigo-400 block font-medium uppercase">
                    Total Pts
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-2 bg-slate-950/40 p-2 rounded-xl border border-white/5">
                  <FaTasks className="text-blue-400 shrink-0" />
                  <span className="truncate">
                    Tasks:{" "}
                    <strong className="text-white font-mono">
                      {s.points?.tasks || 0}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/40 p-2 rounded-xl border border-white/5">
                  <FaCalendarCheck className="text-emerald-400 shrink-0" />
                  <span className="truncate">
                    Attend:{" "}
                    <strong className="text-white font-mono">
                      {s.points?.attendance || 0}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/40 p-2 rounded-xl border border-white/5">
                  <FaDatabase className="text-purple-400 shrink-0" />
                  <span className="truncate">
                    Search:{" "}
                    <strong className="text-white font-mono">
                      {s.points?.search || 0}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-950/30 p-2 rounded-xl border border-indigo-500/10">
                  <FaGift className="text-amber-400 shrink-0" />
                  <span className="truncate">
                    Bonus:{" "}
                    <strong className="text-amber-300 font-mono">
                      {s.points?.bonus || 0}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-1 pt-3 border-t border-white/5">
                <input
                  type="number"
                  placeholder="Enter Bonus Points (e.g. 10 or -5)"
                  className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-600 text-xs flex-1 outline-none focus:border-indigo-500 transition-colors font-mono"
                  value={inputValues[s.id] || ""}
                  onChange={(e) => handleInputChange(s.id, e.target.value)}
                />

                <button
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 px-5 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 shrink-0"
                  onClick={() => handleAddPoints(s.id)}
                >
                  <FaPlus className="text-[10px]" /> Add
                </button>
              </div>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm bg-white/5 border border-white/10 rounded-3xl">
              No students found matching "{searchQuery}".
            </div>
          )}
        </div>
      </div>

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

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center space-y-6 animate-pulse">
      <div className="w-full max-w-2xl h-20 bg-white/5 rounded-3xl" />
      <div className="w-full max-w-2xl h-12 bg-white/5 rounded-2xl" />
      <div className="w-full max-w-2xl space-y-3">
        <div className="h-36 bg-white/5 rounded-3xl" />
        <div className="h-36 bg-white/5 rounded-3xl" />
        <div className="h-36 bg-white/5 rounded-3xl" />
      </div>
    </div>
  );
}
