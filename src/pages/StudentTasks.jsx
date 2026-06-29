import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import {
  FaCheck,
  FaCalendarAlt,
  FaAward,
  FaExternalLinkAlt,
  FaBullhorn,
  FaClipboardList,
  FaTasks,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function StudentTasks() {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [adminMessage, setAdminMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const uid = user.uid;

      try {
        // تشغيل كافة الطلبات توازياً لزيادة سرعة الأداء
        const [tasksSnap, settingsSnap, completedSnap] = await Promise.all([
          getDocs(collection(db, "tasks")),
          getDoc(doc(db, "settings", "main")),
          getDoc(doc(db, "completedTasks", uid)),
        ]);

        // 1. معالجة وتصفية المهام المتاحة فقط
        const tasksArr = tasksSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((t) => t.active !== false); // عرض المهام المفتوحة والنشطة فقط للطلاب
        setTasks(tasksArr);

        // 2. معالجة الإعلان العام للأدمن لو وُجد
        if (settingsSnap.exists()) {
          setAdminMessage(settingsSnap.data().message || "");
        }

        // 3. معالجة المهام التي أنجزها هذا الطالب مسبقاً
        if (completedSnap.exists()) {
          setCompletedTasks(completedSnap.data().tasks || []);
        }
      } catch (error) {
        console.error("Error fetching student tasks data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleComplete = async (taskId) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const updated = completedTasks.includes(taskId)
      ? completedTasks.filter((id) => id !== taskId)
      : [...completedTasks, taskId];

    setCompletedTasks(updated);

    try {
      await setDoc(doc(db, "completedTasks", uid), { tasks: updated });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  if (loading) return <SkeletonLoader />;

  // حساب مؤشرات الإنجاز الشخصية بشكل تفاعلي
  const totalTasksCount = tasks.length;
  const completedTasksCount = completedTasks.filter((id) =>
    tasks.some((t) => t.id === id),
  ).length;
  const completionPercentage =
    totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* هيدر الصفحة الرئيسي */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl mt-16">
          <div className="w-12 h-12 bg-blue-600/30 border border-blue-500 text-blue-400 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0">
            <FaClipboardList />
          </div>
          <div>
            <p className="text-xs text-blue-400 font-medium tracking-wide uppercase">
              Assignments
            </p>
            <h1 className="text-2xl font-black tracking-tight mt-0.5">
              My Tasks
            </h1>
          </div>
        </div>

        {/* مؤشر النسبة المئوية لإنجاز المهام */}
        {totalTasksCount > 0 && (
          <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium flex items-center gap-2">
                <FaTasks className="text-indigo-400" /> Tasks Tracker
              </span>
              <span className="text-indigo-300 font-bold">
                {completedTasksCount} of {totalTasksCount} (
                {completionPercentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* ================= ANNOUNCEMENT FROM ADMIN ================= */}
        {adminMessage && (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-900/5 border border-amber-500/20 shadow-xl backdrop-blur-xl flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base shrink-0">
              <FaBullhorn />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Announcement
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed break-words">
                {adminMessage}
              </p>
            </div>
          </div>
        )}

        {/* ================= TASKS STREAM LIST ================= */}
        <div className="space-y-4">
          {tasks.map((task) => {
            const isCompleted = completedTasks.includes(task.id);

            return (
              <div
                key={task.id}
                className={`p-5 rounded-3xl shadow-xl backdrop-blur-xl border transition-all duration-300 flex flex-col group ${
                  isCompleted
                    ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                {/* تفاصيل وبيانات المهمة */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-bold text-lg sm:text-xl transition-colors ${isCompleted ? "text-emerald-300 line-through decoration-emerald-500/50" : "text-white"}`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-slate-300 mt-1.5 text-sm leading-relaxed break-words">
                    {task.description}
                  </p>
                </div>

                {/* الميتا داتا الإحصائية (النقاط والموعد النهائي لكل مهمة) */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5 text-xs text-slate-400">
                  <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-2 rounded-xl border border-white/5">
                    <FaAward className="text-amber-400 text-sm shrink-0" />
                    <span className="truncate">
                      Points:{" "}
                      <strong className="text-white">{task.points || 0}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-2 rounded-xl border border-white/5">
                    <FaCalendarAlt className="text-rose-400 text-sm shrink-0" />
                    <span className="truncate">
                      Deadline:{" "}
                      <strong className="text-white">
                        {task.deadline || "Open"}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* زرار فتح الرابط المخصص للمهمة (يظهر هنا بداخل كل كارت بشكل مستقل تماماً 🔥) */}
                {task.formLink && (
                  <a
                    href={task.formLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 hover:border-indigo-500 text-indigo-300 hover:text-white font-bold text-sm py-2.5 rounded-xl transition-all"
                  >
                    Open Task Form <FaExternalLinkAlt className="text-[10px]" />
                  </a>
                )}

                {/* زرار تحديث حالة الإنجاز (Done / Undone) */}
                <button
                  onClick={() => handleComplete(task.id)}
                  className={`mt-3 w-full py-3 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
                    isCompleted
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/10"
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <FaCheck className="text-xs animate-bounce" /> Completed
                    </>
                  ) : (
                    "Mark as Done"
                  )}
                </button>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm bg-white/5 border border-white/10 rounded-3xl">
              No active tasks found at this moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center space-y-6 animate-pulse">
      <div className="w-full max-w-2xl h-20 bg-white/5 rounded-3xl" />
      <div className="w-full max-w-2xl h-14 bg-white/5 rounded-3xl" />
      <div className="w-full max-w-2xl space-y-4">
        <div className="h-48 bg-white/5 rounded-3xl" />
        <div className="h-48 bg-white/5 rounded-3xl" />
      </div>
    </div>
  );
}
