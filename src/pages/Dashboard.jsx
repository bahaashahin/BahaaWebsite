import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  FaCheck,
  FaChevronDown,
  FaDownload,
  FaEnvelope,
  FaLayerGroup,
  FaLock,
  FaMedal,
  FaPhoneAlt,
  FaRoad,
  FaStar,
  FaTimes,
  FaTrophy,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import certificateBg from "../assets/CateRef.png";
import roadmapImg from "../assets/roadmapJs.png";

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [rawStudents, setRawStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessionsStatus, setSessionsStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myRank, setMyRank] = useState("-");
  const [activeTab, setActiveTab] = useState(1);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const navigate = useNavigate();
  const certificateRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const uid = user.uid;

      try {
        const [
          adminSnap,
          docSnap,
          completedSnap,
          sessionsSnap,
          rankingSnap,
          allCompletedSnap,
        ] = await Promise.all([
          getDoc(doc(db, "admins", uid)).catch(() => null),
          getDoc(doc(db, "students", uid)),
          getDoc(doc(db, "completedSessions", uid)),
          getDocs(collection(db, "sessions")),
          getDocs(collection(db, "students")),
          getDocs(collection(db, "completedSessions")),
        ]);

        if (adminSnap && adminSnap.exists()) {
          setIsAdmin(true);
        }

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
            score: Number(userSession.score || 0),
            createdAt: sessionData.createdAt || 0,
            level: Number(sessionData.level || 1),
          });
        });

        sessionsArr.sort((a, b) => b.createdAt - a.createdAt);

        setSessionsStatus(sessionsArr);

        // حساب مجموع نقاط Level 2 Sessions لكل الطلاب
        const level2SessionsScores = {};

        allCompletedSnap.forEach((docSnap) => {
          const studentUid = docSnap.id;
          const completedData = docSnap.data();

          let total = 0;

          sessionsArr.forEach((session) => {
            if (session.level === 2) {
              const userSession = completedData[session.id];

              if (userSession?.completed) {
                total += Number(userSession.score || 0);
              }
            }
          });

          level2SessionsScores[studentUid] = total;
        });

        // دمج نقاط Level 2 Sessions مع بيانات الطلاب
        const allStudents = [];

        rankingSnap.forEach((d) => {
          const studentId = d.id;

          const data =
            studentId === uid
              ? {
                  ...d.data(),
                  ...studentData,
                }
              : d.data();

          if (!data.points) {
            data.points = {};
          }

          const dynamicSessionsScoreL2 = level2SessionsScores[studentId] || 0;

          data.points.sessionsScoreL2 = dynamicSessionsScoreL2;

          allStudents.push({
            id: studentId,
            ...data,
          });
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

  const calculateLevel1Points = (user) => {
    if (!user?.points) return 0;

    return (
      (user.points.tasks || 0) +
      (user.points.attendance || 0) +
      (user.points.search || 0) +
      (user.points.bonus || 0)
    );
  };

  const calculateLevel2Points = (user) => {
    if (!user?.points) return 0;

    const baseL2 = Number(user.points.PointLevel2 || 0);

    const sessionsScoreL2 = Number(user.points.sessionsScoreL2 || 0);

    return baseL2 + sessionsScoreL2;
  };

  // حفظ مجموع نقاط Sessions Level 2 في Firebase
  useEffect(() => {
    const updateMyTotalPointsInDB = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser || sessionsStatus.length === 0) {
        return;
      }

      let sessionsScoreL2 = 0;

      sessionsStatus.forEach((session) => {
        if (session.level === 2 && session.completed) {
          sessionsScoreL2 += Number(session.score || 0);
        }
      });

      try {
        const studentRef = doc(db, "students", currentUser.uid);

        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) return;

        const studentData = studentSnap.data();

        const currentPoints = studentData.points || {};

        const currentSessionsScoreL2 = Number(
          currentPoints.sessionsScoreL2 || 0,
        );

        if (currentSessionsScoreL2 !== sessionsScoreL2) {
          await updateDoc(studentRef, {
            "points.sessionsScoreL2": sessionsScoreL2,
          });

          console.log("✅ sessionsScoreL2 updated:", sessionsScoreL2);

          setStudent((prev) => ({
            ...prev,
            points: {
              ...(prev?.points || {}),
              sessionsScoreL2,
            },
          }));

          setRawStudents((prev) =>
            prev.map((s) =>
              s.id === currentUser.uid
                ? {
                    ...s,
                    points: {
                      ...(s.points || {}),
                      sessionsScoreL2,
                    },
                  }
                : s,
            ),
          );
        }
      } catch (error) {
        console.error("❌ Error updating sessions score in DB:", error);
      }
    };

    updateMyTotalPointsInDB();
  }, [sessionsStatus]);

  // إعادة حساب الترتيب والنقاط للـ Leaderboard
  useEffect(() => {
    if (rawStudents.length === 0) {
      return;
    }

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
  }, [activeTab, rawStudents, sessionsStatus]);

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

  if (loading) {
    return <SkeletonLoader />;
  }

  const level1Points = calculateLevel1Points(student);

  const level2Points = calculateLevel2Points(student);

  const currentPoints = activeTab === 2 ? level2Points : level1Points;

  const topStudent = students[0];

  const isLvl2 = activeTab === 2;

  const hasLevel2Access =
    isAdmin || (student?.Level && Number(student.Level) >= 2);

  const filteredSessions = sessionsStatus.filter((session) => {
    if (activeTab === 2) {
      return (
        session.level === 2 ||
        session.name.toLowerCase().includes("level 2") ||
        session.name.toLowerCase().includes("lvl 2")
      );
    }

    return (
      session.level !== 2 &&
      !session.name.toLowerCase().includes("level 2") &&
      !session.name.toLowerCase().includes("lvl 2")
    );
  });

  const displayedSessions =
    filteredSessions.length > 0 ? filteredSessions : sessionsStatus;

  const completedSessions = displayedSessions.filter(
    (session) => session.completed,
  ).length;

  const theme = isLvl2
    ? {
        page: "from-slate-950 via-slate-950 to-emerald-950/90",

        accentText: "text-emerald-400",

        accentTextSoft: "text-emerald-300",

        accentBg: "bg-emerald-500",

        accentBgSoft: "bg-emerald-500/10",

        accentBorder: "border-emerald-500/25",

        accentHoverBorder: "hover:border-emerald-400/50",

        accentRing: "ring-emerald-500/20",
      }
    : {
        page: "from-slate-950 via-slate-950 to-indigo-950/90",

        accentText: "text-indigo-400",

        accentTextSoft: "text-indigo-300",

        accentBg: "bg-indigo-500",

        accentBgSoft: "bg-indigo-500/10",

        accentBorder: "border-indigo-500/25",

        accentHoverBorder: "hover:border-indigo-400/50",

        accentRing: "ring-indigo-500/20",
      };

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${theme.page} text-white transition-colors duration-500`}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -right-24 top-16 h-72 w-72 rounded-full blur-3xl ${
            isLvl2 ? "bg-emerald-500/10" : "bg-indigo-500/10"
          }`}
        />

        <div className="absolute -left-28 top-[42%] h-80 w-80 rounded-full bg-purple-500/5 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:28px_28px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl space-y-5 px-4 pb-10 pt-16 sm:px-6 sm:pb-14 md:space-y-6 md:px-8">
        {/* Level Switcher */}
        {hasLevel2Access && (
          <div className="flex justify-center">
            <div className="inline-flex w-full max-w-md items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1.5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab(1)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 sm:flex-none sm:px-7 ${
                  activeTab === 1
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-400/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <FaLayerGroup className="text-xs" />
                Level 1
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(2)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 sm:flex-none sm:px-7 ${
                  activeTab === 2
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <FaLayerGroup className="text-xs" />
                Level 2
              </button>
            </div>
          </div>
        )}

        {/* Student Overview */}
        <section
          className={`overflow-hidden rounded-[28px] border ${theme.accentBorder} bg-slate-900/55 shadow-2xl shadow-black/20 backdrop-blur-xl`}
        >
          <div
            className={`h-1 w-full bg-gradient-to-r ${
              isLvl2
                ? "from-emerald-500 via-teal-400 to-cyan-400"
                : "from-indigo-500 via-violet-500 to-fuchsia-500"
            }`}
          />

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:p-7">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-xl shadow-lg sm:h-16 sm:w-16 sm:text-2xl ${theme.accentBorder} ${theme.accentBgSoft} ${theme.accentText}`}
              >
                <FaUser />
              </div>

              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${theme.accentBorder} ${theme.accentBgSoft} ${theme.accentText}`}
                  >
                    Level {activeTab}
                  </span>

                  {isAdmin && (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
                      Admin
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
                  Student Dashboard
                </p>

                <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {student?.Name || "Welcome back"}
                </h1>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Track your progress, sessions, score and ranking in one place.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <InfoItem
                icon={<FaEnvelope />}
                label="Email"
                value={student?.Email || "—"}
              />

              <InfoItem
                icon={<FaPhoneAlt />}
                label="Phone"
                value={student?.Phone || "—"}
              />

              <InfoItem
                icon={<FaLayerGroup />}
                label="Level"
                value={`Level ${activeTab}`}
                valueClass={theme.accentText}
              />

              <InfoItem
                icon={<FaCheck />}
                label="Status"
                value={student?.Student || "—"}
              />
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section>
          <button
            type="button"
            onClick={() => setShowRoadmap((prev) => !prev)}
            aria-expanded={showRoadmap}
            className={`group flex w-full items-center justify-between rounded-2xl border bg-slate-900/50 px-4 py-3.5 text-left shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-300 sm:px-5 ${theme.accentBorder} ${theme.accentHoverBorder}`}
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.accentBgSoft} ${theme.accentText}`}
              >
                <FaRoad />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-100 sm:text-base">
                  Level {activeTab} Learning Roadmap
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Open the visual learning path for this level.
                </p>
              </div>
            </div>

            <div
              className={`ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 group-hover:text-white ${
                showRoadmap ? "rotate-180" : ""
              }`}
            >
              <FaChevronDown className="text-xs" />
            </div>
          </button>

          {showRoadmap && (
            <div className="mt-3 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/55 p-3 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 sm:text-base">
                    Roadmap Overview
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Your visual guide for Level {activeTab}.
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.accentBorder} ${theme.accentBgSoft} ${theme.accentText}`}
                >
                  Visual Guide
                </span>
              </div>

              <div className="flex w-full justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-2 sm:p-3">
                <img
                  src={roadmapImg}
                  alt={`Level ${activeTab} Roadmap`}
                  className="max-h-[540px] w-full rounded-xl object-contain"
                  draggable={false}
                />
              </div>
            </div>
          )}
        </section>

        {/* Certificate / Level 2 */}
        {activeTab === 1 ? (
          level1Points >= 200 ? (
            <section className="rounded-[28px] border border-indigo-500/20 bg-slate-900/50 p-4 shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-400">
                    Achievement Unlocked
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white">
                    Level 1 Certificate
                  </h2>
                </div>

                <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                  {level1Points} points earned
                </span>
              </div>

              <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/50 p-3 sm:p-4">
                <div className="flex min-w-[800px] justify-center">
                  <div
                    ref={certificateRef}
                    className="relative shrink-0 overflow-hidden rounded-xl bg-white shadow-2xl"
                    style={{
                      width: "800px",
                      height: "567px",
                    }}
                  >
                    <img
                      src={certificateBg}
                      alt="Certificate Background"
                      className="absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                    />

                    <div className="absolute inset-0 z-10">
                      <div
                        className="absolute left-1/2 flex -translate-x-1/2 justify-center"
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
                        style={{
                          top: "60%",
                          width: "78%",
                        }}
                      >
                        <p
                          className="font-medium text-white"
                          style={{
                            fontSize: "13px",
                            lineHeight: "1.45",
                          }}
                        >
                          <span
                            className="mb-3 block font-bold"
                            style={{
                              color: "#b8c5ff",
                              fontSize: "12px",
                            }}
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
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => downloadCertificate("png")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition-all hover:bg-indigo-400"
                >
                  <FaDownload className="text-xs" />
                  Download PNG
                </button>

                <button
                  type="button"
                  onClick={() => downloadCertificate("pdf")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition-all hover:bg-purple-400"
                >
                  <FaDownload className="text-xs" />
                  Download PDF
                </button>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-[28px] border border-amber-400/20 bg-slate-900/55 shadow-xl shadow-black/15 backdrop-blur-xl">
              <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[auto_1fr] md:items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-xl text-amber-300">
                  <FaLock />
                </div>

                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400">
                        Certificate Progress
                      </p>

                      <h2 className="mt-1 text-xl font-black text-white">
                        Certificate Locked
                      </h2>
                    </div>

                    <p className="text-sm font-bold text-indigo-300">
                      {level1Points} / 200 pts
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    You need at least 200 points to unlock your Level 1
                    certificate.
                  </p>

                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                      style={{
                        width: `${Math.min((level1Points / 200) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          )
        ) : (
          <section className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-slate-900/55 shadow-xl shadow-black/15 backdrop-blur-xl">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
                    Advanced Workspace
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                    Level 2 Dashboard
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                    Track your advanced tasks and specialized point allocations
                    below.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-center sm:min-w-36">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                    Level 2 Score
                  </p>

                  <p className="mt-1 text-2xl font-black text-emerald-200">
                    {level2Points}

                    <span className="ml-1 text-xs font-semibold text-emerald-400">
                      pts
                    </span>
                  </p>
                </div>
              </div>

              {level2Points < 100 && (
                <div className="mt-5 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                    <FaTimes />
                  </div>

                  <div>
                    <p className="font-bold text-red-300">
                      ⚠️ تحذير: نقاطك أقل من 100!
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-red-300/75 sm:text-sm">
                      يجب عليك الالتزام بحضور السيشنز وتسليم المهام المطلوبة
                      لتجنب الاستبعاد من المستوى الثاني. نرجو منك العمل بجد لرفع
                      نقاطك.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={`Level ${activeTab} Score`}
            value={currentPoints}
            suffix="pts"
            icon={<FaStar />}
            tone={isLvl2 ? "emerald" : "indigo"}
          />

          <StatCard
            label="Your Rank"
            value={`#${myRank}`}
            suffix={`of ${students.length}`}
            icon={<FaMedal />}
            tone="purple"
          />

          <StatCard
            label="Sessions Done"
            value={completedSessions}
            suffix={`of ${displayedSessions.length}`}
            icon={<FaCheck />}
            tone="cyan"
          />

          {topStudent && (
            <StatCard
              label="Top Leaderboard"
              value={topStudent.Name}
              suffix={`${topStudent.totalPoints} pts`}
              icon={<FaTrophy />}
              tone="amber"
              compactValue
            />
          )}
        </section>

        {/* Sessions + Ranking */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/55 shadow-xl shadow-black/15 backdrop-blur-xl lg:col-span-3">
            <SectionHeader
              title={`Sessions Progress · Level ${activeTab}`}
              subtitle={`${completedSessions} of ${displayedSessions.length} sessions completed`}
              accentClass={theme.accentBg}
              badge={`${displayedSessions.length} Sessions`}
            />

            <div className="max-h-[430px] space-y-2 overflow-y-auto px-4 pb-4 pr-3 custom-scrollbar sm:px-5 sm:pb-5">
              {displayedSessions.map((session) => {
                const isCompleted = session.completed;

                return (
                  <div
                    key={session.id}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all duration-200 sm:p-3.5 ${
                      isCompleted
                        ? isLvl2
                          ? "border-emerald-500/20 bg-emerald-500/[0.07] hover:border-emerald-400/40"
                          : "border-indigo-500/20 bg-indigo-500/[0.07] hover:border-indigo-400/40"
                        : "border-white/[0.07] bg-slate-950/35 hover:border-white/15 hover:bg-slate-950/55"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] transition-all ${
                          isCompleted
                            ? isLvl2
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-950/30"
                              : "bg-indigo-500 text-white shadow-md shadow-indigo-950/30"
                            : "bg-white/5 text-slate-600 ring-1 ring-white/10"
                        }`}
                      >
                        {isCompleted ? <FaCheck /> : <FaTimes />}
                      </span>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-xs font-semibold sm:text-sm ${
                            isCompleted ? "text-slate-100" : "text-slate-400"
                          }`}
                        >
                          {session.name}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-600 sm:text-[11px]">
                          {isCompleted ? "Completed" : "Not completed yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isCompleted && (
                        <span
                          className={`rounded-lg border px-2 py-1 text-[10px] font-bold sm:text-xs ${
                            isLvl2
                              ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-300"
                              : "border-indigo-500/15 bg-indigo-500/10 text-indigo-300"
                          }`}
                        >
                          {session.score} pts
                        </span>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/session-report/${session.id}`)
                          }
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-300 transition hover:border-indigo-400/30 hover:bg-indigo-500/15 hover:text-white sm:text-[11px]"
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ranking */}
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/55 shadow-xl shadow-black/15 backdrop-blur-xl lg:col-span-2">
            <SectionHeader
              title={`Global Ranking · Level ${activeTab}`}
              subtitle="Current leaderboard standings"
              accentClass="bg-amber-400"
              badge={`${students.length} Students`}
            />

            <div className="max-h-[430px] space-y-2 overflow-y-auto px-4 pb-4 pr-3 custom-scrollbar sm:px-5 sm:pb-5">
              {students.map((s, index) => {
                const isMe = s.id === auth.currentUser?.uid;

                const isTopThree = index < 3;

                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                      isMe
                        ? isLvl2
                          ? "border-emerald-400/40 bg-emerald-500/15 shadow-lg shadow-emerald-950/15 ring-1 ring-emerald-500/10"
                          : "border-indigo-400/40 bg-indigo-500/15 shadow-lg shadow-indigo-950/15 ring-1 ring-indigo-500/10"
                        : "border-white/[0.07] bg-slate-950/35 hover:border-white/15"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                          index === 0
                            ? "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/20"
                            : index === 1
                              ? "bg-slate-300/10 text-slate-300 ring-1 ring-slate-300/15"
                              : index === 2
                                ? "bg-orange-400/10 text-orange-300 ring-1 ring-orange-400/15"
                                : "bg-white/5 text-slate-500 ring-1 ring-white/[0.07]"
                        }`}
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-xs font-bold sm:text-sm ${
                            isMe ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {s.Name}

                          {isMe && (
                            <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                              You
                            </span>
                          )}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-600">
                          {isTopThree ? "Top performer" : `Rank #${index + 1}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-black ${
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
        </section>
      </main>
    </div>
  );
}

function InfoItem({ icon, label, value, valueClass = "text-slate-200" }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[10px] text-slate-500">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
          {label}
        </p>

        <p className={`truncate text-xs font-semibold ${valueClass}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon,
  tone = "indigo",
  compactValue = false,
}) {
  const tones = {
    indigo: {
      border: "border-indigo-500/20",

      bg: "from-indigo-500/10 to-indigo-500/[0.025]",

      iconBg: "bg-indigo-500/10",

      iconText: "text-indigo-300",

      label: "text-indigo-400",
    },

    emerald: {
      border: "border-emerald-500/20",

      bg: "from-emerald-500/10 to-emerald-500/[0.025]",

      iconBg: "bg-emerald-500/10",

      iconText: "text-emerald-300",

      label: "text-emerald-400",
    },

    purple: {
      border: "border-purple-500/20",

      bg: "from-purple-500/10 to-purple-500/[0.025]",

      iconBg: "bg-purple-500/10",

      iconText: "text-purple-300",

      label: "text-purple-400",
    },

    cyan: {
      border: "border-cyan-500/20",

      bg: "from-cyan-500/10 to-cyan-500/[0.025]",

      iconBg: "bg-cyan-500/10",

      iconText: "text-cyan-300",

      label: "text-cyan-400",
    },

    amber: {
      border: "border-amber-500/20",

      bg: "from-amber-500/10 to-amber-500/[0.025]",

      iconBg: "bg-amber-500/10",

      iconText: "text-amber-300",

      label: "text-amber-400",
    },
  };

  const selectedTone = tones[tone] || tones.indigo;

  return (
    <div
      className={`group flex min-w-0 items-center justify-between gap-3 rounded-2xl border bg-gradient-to-br p-4 shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 ${selectedTone.border} ${selectedTone.bg}`}
    >
      <div className="min-w-0">
        <p
          className={`truncate text-[10px] font-extrabold uppercase tracking-[0.14em] ${selectedTone.label}`}
        >
          {label}
        </p>

        <p
          className={`mt-1 truncate font-black text-white ${
            compactValue ? "text-base" : "text-2xl sm:text-3xl"
          }`}
        >
          {value}
        </p>

        <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500 sm:text-xs">
          {suffix}
        </p>
      </div>

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base transition-transform duration-200 group-hover:scale-110 ${selectedTone.iconBg} ${selectedTone.iconText}`}
      >
        {icon}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, accentClass, badge }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`h-8 w-1 shrink-0 rounded-full ${accentClass}`} />

        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-slate-100 sm:text-base">
            {title}
          </h2>

          <p className="mt-0.5 truncate text-[10px] text-slate-500 sm:text-xs">
            {subtitle}
          </p>
        </div>
      </div>

      <span className="shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:text-[10px]">
        {badge}
      </span>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-6xl animate-pulse space-y-5">
        <div className="mx-auto h-12 w-72 rounded-2xl bg-white/5" />

        <div className="h-40 w-full rounded-[28px] bg-white/5" />

        <div className="h-16 w-full rounded-2xl bg-white/5" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 rounded-2xl bg-white/5" />

          <div className="h-28 rounded-2xl bg-white/5" />

          <div className="h-28 rounded-2xl bg-white/5" />

          <div className="h-28 rounded-2xl bg-white/5" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="h-96 rounded-[28px] bg-white/5 lg:col-span-3" />

          <div className="h-96 rounded-[28px] bg-white/5 lg:col-span-2" />
        </div>
      </div>
    </div>
  );
}
