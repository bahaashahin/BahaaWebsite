import { useEffect, useState } from "react";
import { useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import {
  FaCheck,
  FaTimes,
  FaTrophy,
  FaStar,
  FaUser,
  FaMedal,
  FaLayerGroup,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import certificateBg from "../assets/CateRef.png";

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [rawStudents, setRawStudents] = useState([]); // حفظ البيانات الخام للطلاب
  const [students, setStudents] = useState([]); // الطلاب بعد الترتيب حسب التبويب
  const [sessionsStatus, setSessionsStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myRank, setMyRank] = useState("-");
  const [activeTab, setActiveTab] = useState(1); // 1 للمستوى الأول، 2 للمستوى الثاني

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const uid = user.uid;

      try {
        const [adminSnap, docSnap, completedSnap, sessionsSnap, rankingSnap] =
          await Promise.all([
            getDoc(doc(db, "admins", uid)).catch(() => null),
            getDoc(doc(db, "students", uid)),
            getDoc(doc(db, "completedSessions", uid)),
            getDocs(collection(db, "sessions")),
            getDocs(collection(db, "students")),
          ]);

        if (adminSnap && adminSnap.exists()) setIsAdmin(true);

        let studentData = null;
        if (docSnap.exists()) {
          studentData = docSnap.data();
          setStudent(studentData);
          if (studentData.Level) {
            setActiveTab(Number(studentData.Level));
          }
        }

        const completedData = completedSnap.exists()
          ? completedSnap.data()
          : {};

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
            level: sessionData.level || 1, // ربط السيشن بالمستوى إذا وجد، افتراضاً Level 1
          });
        });
        sessionsArr.sort((a, b) => b.createdAt - a.createdAt);
        setSessionsStatus(sessionsArr);

        const allStudents = [];
        rankingSnap.forEach((d) => {
          const data = d.data();
          allStudents.push({ id: d.id, ...data });
        });

        setRawStudents(allStudents);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // دالة حساب نقاط المستوى الأول
  const calculateLevel1Points = (user) => {
    if (!user?.points) return 0;
    return (
      (user.points.tasks || 0) +
      (user.points.attendance || 0) +
      (user.points.search || 0) +
      (user.points.bonus || 0)
    );
  };

  // دالة حساب نقاط المستوى الثاني
  const calculateLevel2Points = (user) => {
    if (!user?.points) return 0;
    return user.points.PointLevel2 || 0;
  };

  // إعادة حساب الترتيب والنقاط كلما تغير التبويب النشط (ActiveTab)
  useEffect(() => {
    if (rawStudents.length === 0) return;

    const processedStudents = rawStudents.map((s) => {
      const l1 = calculateLevel1Points(s);
      const l2 = calculateLevel2Points(s);
      const currentPoints = activeTab === 2 ? l2 : l1;
      return {
        ...s,
        totalPoints: currentPoints,
      };
    });

    processedStudents.sort((a, b) => b.totalPoints - a.totalPoints);
    setStudents(processedStudents);

    const uid = auth.currentUser?.uid;
    const rankIndex = processedStudents.findIndex((s) => s.id === uid);
    if (rankIndex !== -1) {
      setMyRank(rankIndex + 1);
    } else {
      setMyRank("-");
    }
  }, [activeTab, rawStudents]);

  const certificateRef = useRef(null);

  const downloadCertificate = async (format) => {
    try {
      await document.fonts.ready;
      const element = certificateRef.current;
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 4,
        backgroundColor: null,
      });

      if (format === "pdf") {
        const img = new Image();
        img.onload = () => {
          const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [img.width, img.height],
          });
          pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
          pdf.save(`Certificate_${student?.Name}.pdf`);
        };
        img.src = dataUrl;
      } else {
        const link = document.createElement("a");
        link.download = `Certificate_${student?.Name}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <SkeletonLoader />;

  const level1Points = calculateLevel1Points(student);
  const level2Points = calculateLevel2Points(student);
  const currentPoints = activeTab === 2 ? level2Points : level1Points;
  const topStudent = students[0];
  const isLvl2 = activeTab === 2;

  // فلترة السيشنز بناءً على التبويب إذا أردت فصلها (أو عرض الكل إذا لم يكن هناك حقل مستوى للسيشن)
  const filteredSessions = sessionsStatus.filter((session) => {
    if (activeTab === 2) {
      return (
        session.level === 2 ||
        session.name.toLowerCase().includes("level 2") ||
        session.name.toLowerCase().includes("lvl 2")
      );
    } else {
      return (
        session.level !== 2 &&
        !session.name.toLowerCase().includes("level 2") &&
        !session.name.toLowerCase().includes("lvl 2")
      );
    }
  });

  // إذا أردت إظهار كل السيشنز في حال لم تكن مقسمة بمسمى خاص، يمكنك استخدام sessionsStatus مباشرة. سنستخدم filteredSessions وإن كانت فارغة نعرض الكل لضمان عدم اختفائها:
  const displayedSessions =
    filteredSessions.length > 0 ? filteredSessions : sessionsStatus;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${isLvl2 ? "from-slate-950 via-slate-900 to-emerald-950" : "from-slate-950 via-slate-900 to-indigo-950"} p-4 sm:p-6 md:p-8 text-white transition-colors duration-500`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* شريط التنقل بين المستويات (Tabs) */}
        {(isAdmin || (student?.Level && Number(student.Level) >= 2)) && (
          <div className="flex justify-center gap-3 mt-16 mb-2">
            <button
              onClick={() => setActiveTab(1)}
              className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${
                activeTab === 1
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              <FaLayerGroup /> Level 1
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border ${
                activeTab === 2
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              <FaLayerGroup /> Level 2
            </button>
          </div>
        )}

        {/* هيدر ترحيبي */}
        <div
          className={`flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border ${isLvl2 ? "border-emerald-500/20" : "border-white/10"} p-5 sm:p-6 rounded-3xl backdrop-blur-xl ${!(isAdmin || (student?.Level && Number(student.Level) >= 2)) ? "mt-16" : ""}`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 ${isLvl2 ? "bg-emerald-600/30 border-emerald-500 text-emerald-400" : "bg-indigo-600/30 border-indigo-500 text-indigo-400"} border rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0`}
            >
              <FaUser />
            </div>
            <div>
              <p
                className={`text-xs sm:text-sm ${isLvl2 ? "text-emerald-400" : "text-indigo-400"} font-medium tracking-wide uppercase`}
              >
                Student Dashboard - Level {activeTab}
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
              <span
                className={`${isLvl2 ? "text-emerald-400" : "text-indigo-400"} font-semibold`}
              >
                {activeTab}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Status:</span> {student?.Student}
            </p>
          </div>
        </div>

        {/* محتوى الشهادة للمستوى الأول */}
        {activeTab === 1 ? (
          level1Points >= 200 ? (
            <>
              <div className="w-full overflow-x-auto flex justify-center py-4">
                <div
                  ref={certificateRef}
                  className="relative rounded-xl overflow-hidden bg-white shadow-2xl"
                  style={{ width: "800px", height: "567px", flexShrink: 0 }}
                >
                  <img
                    src={certificateBg}
                    alt="Certificate Background"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 z-10">
                    <div
                      className="absolute left-1/2 -translate-x-1/2 flex justify-center"
                      style={{
                        top: "44%",
                        width: "75%",
                        background: "linear-gradient(90deg,#e000f4,#1100d6)",
                        borderRadius: "9999px",
                        padding: "10px 28px",
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "28px",
                          fontWeight: 700,
                          color: "#fff",
                          lineHeight: 1,
                        }}
                      >
                        {student?.Name}
                      </span>
                    </div>

                    <div
                      className="absolute left-1/2 -translate-x-1/2 text-center"
                      style={{ top: "60%", width: "78%" }}
                    >
                      <p
                        className="text-white font-medium"
                        style={{ fontSize: "13px", lineHeight: "1.45" }}
                      >
                        <span
                          className="block font-bold mb-3"
                          style={{ color: "#b8c5ff", fontSize: "12px" }}
                        >
                          {myRank === 1
                            ? "Congratulations! You have been recognized as the Top Student of Level 1."
                            : "I wish you continued success."}
                        </span>
                        has successfully completed the
                        <br />
                        <span className="font-semibold">
                          "Level 1 HTML, CSS, Tailwind CSS"
                        </span>
                        <br />
                        presented by Bahaa Shaheen
                        <br />
                        We wish you continued success in all your future
                        endeavors.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <button
                  onClick={() => downloadCertificate("png")}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition"
                >
                  Download PNG
                </button>
                <button
                  onClick={() => downloadCertificate("pdf")}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition"
                >
                  Download PDF
                </button>
              </div>
            </>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
              <h3 className="text-xl font-bold text-yellow-400">
                Certificate Locked
              </h3>
              <p className="text-gray-300 mt-2">
                You need at least{" "}
                <span className="font-bold text-white">200 points</span> to
                unlock your certificate.
              </p>
              <p className="mt-3 text-lg font-bold text-indigo-400">
                Your Score: {level1Points} / 200
              </p>
            </div>
          )
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 text-center backdrop-blur-xl">
            <h3 className="text-xl font-bold text-emerald-400">
              Level 2 Dashboard Workspace
            </h3>
            <p className="text-gray-300 mt-2 text-sm">
              Welcome to Level 2. Track your advanced tasks and specialized
              point allocations below.
            </p>
            <p className="mt-3 text-2xl font-black text-emerald-300">
              Level 2 Score: {level2Points} pts
            </p>
          </div>
        )}

        {/* كروت الإحصاءات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            className={`p-5 rounded-3xl bg-gradient-to-br ${isLvl2 ? "from-emerald-600/20 to-emerald-900/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-200" : "from-indigo-600/20 to-indigo-900/10 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-200"} border shadow-xl flex justify-between items-center group transition-all duration-300`}
          >
            <div>
              <p
                className={`text-xs font-semibold ${isLvl2 ? "text-emerald-400" : "text-indigo-400"} uppercase tracking-wider`}
              >
                {isLvl2 ? "Level 2 Score" : "Level 1 Score"}
              </p>
              <p className="text-2xl sm:text-3xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
                {currentPoints}{" "}
                <span
                  className={`text-xs font-normal ${isLvl2 ? "text-emerald-300" : "text-indigo-300"}`}
                >
                  pts
                </span>
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl ${isLvl2 ? "bg-emerald-500/20" : "bg-indigo-500/20"} flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform shrink-0`}
            >
              <FaStar className="text-amber-400" />
            </div>
          </div>

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

        {/* الجداول السفلية */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl h-fit">
            <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
              <span
                className={`w-2 h-2 ${isLvl2 ? "bg-emerald-500" : "bg-blue-500"} rounded-full animate-pulse`}
              />
              Sessions Progress (Level {activeTab})
            </h2>
            <div className="space-y-2.5 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {displayedSessions.map((session) => {
                const isCompleted = session.completed;
                return (
                  <div
                    key={session.id}
                    className={`flex justify-between items-center p-3 sm:p-3.5 rounded-2xl transition-all duration-200 border gap-2 ${
                      isCompleted
                        ? isLvl2
                          ? "bg-emerald-600/10 border-emerald-500/20 hover:border-emerald-500/40"
                          : "bg-blue-600/10 border-blue-500/20 hover:border-blue-500/40"
                        : "bg-slate-900/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <span
                      className={`text-xs sm:text-sm truncate flex-1 ${
                        isCompleted
                          ? isLvl2
                            ? "text-emerald-100 font-medium"
                            : "text-blue-100 font-medium"
                          : "text-slate-400"
                      }`}
                    >
                      {session.name}
                    </span>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {isCompleted && (
                        <span
                          className={`text-[10px] sm:text-xs px-2 py-0.5 ${isLvl2 ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"} rounded-full font-semibold`}
                        >
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
                            ? isLvl2
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                              : "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
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

          <div className="md:col-span-2 bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl backdrop-blur-xl h-fit">
            <h2 className="text-base sm:text-lg font-bold mb-4 text-center border-b border-white/10 pb-3">
              Global Ranking (Level {activeTab})
            </h2>
            <div className="space-y-2 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {students.map((s, i) => {
                const isMe = s.id === auth.currentUser?.uid;
                return (
                  <div
                    key={s.id}
                    className={`p-2.5 sm:p-3 rounded-2xl flex justify-between items-center border transition-all ${
                      isMe
                        ? isLvl2
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-700 border-emerald-400 text-white font-bold shadow-lg shadow-emerald-600/20 scale-[1.01]"
                          : "bg-gradient-to-r from-indigo-600 to-indigo-700 border-indigo-400 text-white font-bold shadow-lg shadow-indigo-600/20 scale-[1.01]"
                        : "bg-slate-900/40 border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm truncate mr-2">
                      <span className="w-5 text-center font-bold text-xs text-slate-500">
                        {i + 1}
                      </span>
                      <span className="truncate">{s.Name}</span>
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-bold shrink-0 ${
                        isMe
                          ? "text-white"
                          : isLvl2
                            ? "text-emerald-400"
                            : "text-indigo-400"
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
