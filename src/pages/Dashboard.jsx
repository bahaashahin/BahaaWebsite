import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import {
  FaCheck,
  FaTimes,
  FaTrophy,
  FaStar,
  FaUser,
  FaMedal,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessionsStatus, setSessionsStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myRank, setMyRank] = useState("-"); // State لتخزين ترتيب الطالب الحالي

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const uid = user.uid;

      try {
        // تشغيل كل الطلبات بالتوازي لسرعة خارقة
        const [adminSnap, docSnap, completedSnap, sessionsSnap, rankingSnap] =
          await Promise.all([
            getDoc(doc(db, "admins", uid)).catch(() => null),
            getDoc(doc(db, "students", uid)),
            getDoc(doc(db, "completedSessions", uid)),
            getDocs(collection(db, "sessions")),
            getDocs(collection(db, "students")),
          ]);

        // 1. Admin Check
        if (adminSnap && adminSnap.exists()) setIsAdmin(true);

        // 2. Student Data
        if (docSnap.exists()) setStudent(docSnap.data());

        // 3. Completed Sessions
        const completedData = completedSnap.exists()
          ? completedSnap.data()
          : {};

        // 4. Process Sessions
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
        sessionsArr.sort((a, b) => b.createdAt - a.createdAt);
        setSessionsStatus(sessionsArr);

        // 5. Process Ranking
        const allStudents = [];
        rankingSnap.forEach((d) => {
          const data = d.data();
          const totalPoints =
            (data.points?.tasks || 0) +
            (data.points?.attendance || 0) +
            (data.points?.search || 0) +
            (data.points?.bonus || 0);
          allStudents.push({ id: d.id, ...data, totalPoints });
        });

        // ترتيب الطلاب من الأعلى للأقل
        allStudents.sort((a, b) => b.totalPoints - a.totalPoints);
        setStudents(allStudents);

        // حساب ترتيب الطالب الحالي ديناميكياً
        const rankIndex = allStudents.findIndex((s) => s.id === uid);
        if (rankIndex !== -1) {
          setMyRank(rankIndex + 1); // +1 لأن المصفوفة تبدأ من 0
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const calculatePoints = (user) => {
    if (!user?.points) return 0;
    return (
      (user.points.tasks || 0) +
      (user.points.attendance || 0) +
      (user.points.search || 0) +
      (user.points.bonus || 0)
    );
  };

  if (loading) return <SkeletonLoader />;

  const studentPoints = calculatePoints(student);
  const topStudent = students[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* هيدر ترحيبي عالي الاحترافية */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl mt-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600/30 border border-indigo-500 text-indigo-400 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0">
              <FaUser />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-indigo-400 font-medium tracking-wide uppercase ">
                Student Dashboard
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight mt-0.5 break-words">
                {student?.Name || "Welcome back"}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:text-sm text-slate-400 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
            <p className="truncate">
              <span className="text-slate-500">Email:</span> {student?.Email}
            </p>
            <p>
              <span className="text-slate-500">Phone:</span> {student?.Phone}
            </p>
            <p>
              <span className="text-slate-500">Level:</span>{" "}
              <span className="text-indigo-400 font-semibold">
                {student?.Level}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Status:</span> {student?.Student}
            </p>
          </div>
        </div>

        {/* كروت الإحصائيات السريعة (تظهر تحت بعض في الموبايل، وجنب بعض بدءاً من الشاشات المتوسطة) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* كارت مجموع النقاط */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-indigo-900/10 border border-indigo-500/20 shadow-xl flex justify-between items-center group hover:border-indigo-500/40 transition-all duration-300">
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Your Total Score
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
                {studentPoints}{" "}
                <span className="text-xs font-normal text-indigo-300">pts</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
              <FaStar className="text-amber-400" />
            </div>
          </div>

          {/* كارت ترتيب الطالب الحالي */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-500/20 shadow-xl flex justify-between items-center group hover:border-purple-500/40 transition-all duration-300">
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Your Rank
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
                #{myRank}{" "}
                <span className="text-xs font-normal text-purple-300">
                  of {students.length}
                </span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
              <FaMedal className="text-purple-400" />
            </div>
          </div>

          {/* كارت الطالب الأول */}
          {topStudent && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-900/5 border border-amber-500/20 shadow-xl flex justify-between items-center group hover:border-amber-500/40 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Top Leaderboard
                </p>
                <h2 className="text-base sm:text-lg font-bold mt-1 truncate pr-2">
                  {topStudent.Name}
                </h2>
                <p className="text-xs text-amber-300/70 mt-0.5">
                  {topStudent.totalPoints} pts
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                <FaTrophy className="text-amber-400" />
              </div>
            </div>
          )}
        </div>

        {/* الجلسات والترتيب - تم إصلاح ريسبونسيف هذه المنطقة بالكامل */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* قسم الـ Sessions Progress */}
          <div className="md:col-span-3 bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl h-fit">
            <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Sessions Progress
            </h2>
            <div className="space-y-2.5 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {sessionsStatus.map((session) => {
                const isCompleted = session.completed;
                return (
                  <div
                    key={session.id}
                    className={`flex justify-between items-center p-3 sm:p-3.5 rounded-2xl transition-all duration-200 border gap-2 ${
                      isCompleted
                        ? "bg-blue-600/10 border-blue-500/20 hover:border-blue-500/40"
                        : "bg-slate-900/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <span
                      className={`text-xs sm:text-sm truncate flex-1 ${
                        isCompleted
                          ? "text-blue-100 font-medium"
                          : "text-slate-400"
                      }`}
                    >
                      {session.name}
                    </span>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {isCompleted && (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full font-semibold">
                          {session.score} pts
                        </span>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() =>
                            navigate(`/session-report/${session.id}`)
                          }
                          className="text-[10px] sm:text-[11px] font-medium bg-white/10 hover:bg-indigo-600 px-2 sm:px-2.5 py-1 rounded-lg border border-white/10 hover:border-indigo-500 transition-all"
                        >
                          Details
                        </button>
                      )}

                      <span
                        className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-xl text-[10px] sm:text-xs transition-colors ${
                          isCompleted
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                            : "bg-slate-800 text-slate-500"
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

          {/* قسم الـ Ranking */}
          <div className="md:col-span-2 bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl h-fit">
            <h2 className="text-base sm:text-lg font-bold mb-4 text-center border-b border-white/10 pb-3">
              🏆 Global Ranking
            </h2>
            <div className="space-y-2 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {students.map((s, i) => {
                const isMe = s.id === auth.currentUser?.uid;
                return (
                  <div
                    key={s.id}
                    className={`p-2.5 sm:p-3 rounded-2xl flex justify-between items-center border transition-all ${
                      isMe
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 border-indigo-400 text-white font-bold shadow-lg shadow-indigo-600/20 scale-[1.01]"
                        : "bg-slate-900/40 border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm truncate mr-2">
                      <span
                        className={`w-5 text-center font-bold text-xs ${
                          i === 0
                            ? "text-amber-400 text-sm"
                            : i === 1
                              ? "text-slate-300"
                              : i === 2
                                ? "text-amber-600"
                                : "text-slate-500"
                        }`}
                      >
                        {i === 0
                          ? "🥇"
                          : i === 1
                            ? "🥈"
                            : i === 2
                              ? "🥉"
                              : i + 1}
                      </span>
                      <span className="truncate">{s.Name}</span>
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-bold shrink-0 ${
                        isMe ? "text-white" : "text-indigo-400"
                      }`}
                    >
                      {s.totalPoints} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-center space-y-6 animate-pulse">
      <div className="w-full max-w-4xl h-32 bg-white/5 rounded-3xl" />
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 bg-white/5 rounded-3xl" />
        <div className="h-24 bg-white/5 rounded-3xl" />
        <div className="h-24 bg-white/5 rounded-3xl" />
      </div>
      <div className="w-full max-w-4xl h-80 bg-white/5 rounded-3xl" />
    </div>
  );
}
