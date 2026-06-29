import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import {
  FaPlus,
  FaTrashAlt,
  FaToggleOn,
  FaToggleOff,
  FaCog,
  FaBullhorn,
  FaLink,
  FaTasks,
  FaExclamationTriangle,
} from "react-icons/fa";
import Message from "../components/Message";
import useAdmin from "../hooks/useAdmin";

export default function AdminTasks() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [tasks, setTasks] = useState([]);
  const [adminMessage, setAdminMessage] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    points: "",
    formLink: "",
    type: "task",
  });
  const [message, setMessage] = useState(null);

  // الـ States الخاصة بـ كرت التأكيد المخصص للحذف 🚨
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: "",
  });

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [tasksSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, "tasks")),
        getDoc(doc(db, "settings", "main")),
      ]);

      setTasks(tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      if (settingsSnap.exists()) {
        setAdminMessage(settingsSnap.data().message || "");
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    }
  };

  if (adminLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-xl font-semibold animate-pulse">
          Loading Admin Panel...
        </p>
      </div>
    );

  if (!isAdmin)
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 text-center">
        ليس لديك صلاحية للدخول لهذه الصفحة
      </div>
    );

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.description) {
      setMessage({ text: "املأ العنوان والوصف بشكل أساسي", type: "error" });
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        ...newTask,
        points: Number(newTask.points) || 0,
        createdAt: Date.now(),
        active: true,
      });

      setMessage({ text: "تم إنشاء المهمة بنجاح 🚀", type: "success" });

      setNewTask({
        title: "",
        description: "",
        deadline: "",
        points: "",
        formLink: "",
        type: "task",
      });

      const tasksSnap = await getDocs(collection(db, "tasks"));
      setTasks(tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setMessage({ text: "حدث خطأ أثناء إنشاء المهمة", type: "error" });
    }
  };

  // فتح كرت التأكيد بدلاً من استخدام window.confirm التقليدي
  const triggerDeleteConfirm = (id, title) => {
    setConfirmModal({
      isOpen: true,
      taskId: id,
      taskTitle: title,
    });
  };

  // تنفيذ الحذف الفعلي بعد التأكيد المخصص
  const executeDelete = async () => {
    const id = confirmModal.taskId;
    try {
      await deleteDoc(doc(db, "tasks", id));
      setMessage({ text: "تم حذف المهمة بنجاح نهائياً", type: "info" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setMessage({ text: "فشل حذف المهمة", type: "error" });
    } finally {
      // إغلاق المودال وتصفيره
      setConfirmModal({ isOpen: false, taskId: null, taskTitle: "" });
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await updateDoc(doc(db, "tasks", id), { active: !current });
      setMessage({
        text: current
          ? "تم إغلاق المهمة وحجبها عن الطلاب 🔒"
          : "تم فتح المهمة للطلاب بنجاح 🎉",
        type: "info",
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, active: !current } : t)),
      );
    } catch (err) {
      setMessage({ text: "فشل تحديث الحالة", type: "error" });
    }
  };

  const saveSettings = async () => {
    try {
      await setDoc(
        doc(db, "settings", "main"),
        {
          message: adminMessage,
        },
        { merge: true },
      );
      setMessage({ text: "تم تحديث الإعلان العام بنجاح 📢", type: "success" });
    } catch (err) {
      setMessage({ text: "فشل حفظ الإعدادات", type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6 md:p-8 text-white relative">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* الهيدر الرئيسي */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <div className="w-12 h-12 bg-indigo-600/30 border border-indigo-500 text-indigo-400 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0">
            <FaCog />
          </div>
          <div>
            <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">
              Control Center
            </p>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              Tasks Management
            </h1>
          </div>
        </div>

        {/* ================= GENERAL ANNOUNCEMENT ================= */}
        <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col gap-4">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-indigo-400 border-b border-white/5 pb-2">
            <FaBullhorn /> General Announcement
          </h3>
          <textarea
            className="p-3 rounded-xl bg-slate-950/60 border border-white/10 outline-none text-sm text-white placeholder-slate-500 h-24 focus:border-indigo-500 transition-colors resize-none"
            placeholder="Write a message to show on all students' task boards..."
            value={adminMessage}
            onChange={(e) => setAdminMessage(e.target.value)}
          />
          <button
            onClick={saveSettings}
            className="bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/20"
          >
            Save Announcement
          </button>
        </div>

        {/* ================= CREATE NEW TASK ================= */}
        <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col gap-4">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-blue-400 border-b border-white/5 pb-2">
            <FaPlus className="text-sm" /> Create New Assignment
          </h3>

          <div className="space-y-3 text-sm">
            <input
              className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/10 outline-none text-white placeholder-slate-500 focus:border-blue-500 transition-colors"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
            />

            <textarea
              className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/10 outline-none text-white placeholder-slate-500 h-24 focus:border-blue-500 transition-colors resize-none"
              placeholder="Task Description and Instructions..."
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
            />

            <div className="relative">
              <FaLink className="absolute left-3 top-3.5 text-slate-500 text-xs" />
              <input
                className="w-full p-3 pl-9 rounded-xl bg-slate-950/60 border border-white/10 outline-none text-white placeholder-slate-500 focus:border-blue-500 transition-colors"
                placeholder="Google Form Link for THIS Task (Optional)"
                value={newTask.formLink}
                onChange={(e) =>
                  setNewTask({ ...newTask, formLink: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium pl-1">
                  Deadline Date
                </label>
                <input
                  type="date"
                  className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/10 outline-none text-white focus:border-blue-500 transition-colors"
                  value={newTask.deadline}
                  onChange={(e) =>
                    setNewTask({ ...newTask, deadline: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium pl-1">
                  Points Reward
                </label>
                <input
                  type="number"
                  className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/10 outline-none text-white placeholder-slate-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g. 50"
                  value={newTask.points}
                  onChange={(e) =>
                    setNewTask({ ...newTask, points: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <button
            className="bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-blue-600/20 mt-2"
            onClick={handleCreateTask}
          >
            Create Task
          </button>
        </div>

        {/* ================= LIVE TASKS LIST ================= */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-400 px-1 flex items-center gap-2">
            <FaTasks className="text-xs" /> Active Dashboard Tasks (
            {tasks.length})
          </h3>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-5 rounded-3xl bg-white/5 backdrop-blur-xl border shadow-lg hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between gap-4 ${
                task.active
                  ? "border-white/10"
                  : "border-red-500/20 bg-red-950/5"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-lg text-white truncate flex-1">
                    {task.title}
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${task.active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}
                  >
                    {task.active ? "Visible" : "Hidden"}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mt-1.5 leading-relaxed break-words">
                  {task.description}
                </p>

                {task.formLink && (
                  <p className="text-xs text-indigo-400 truncate mt-2 flex items-center gap-1.5 bg-indigo-950/30 p-2 rounded-xl border border-indigo-500/10">
                    <FaLink className="text-[10px]" /> Form:{" "}
                    <a
                      href={task.formLink}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-indigo-300 hover:text-indigo-200"
                    >
                      {task.formLink}
                    </a>
                  </p>
                )}

                <div className="flex gap-4 text-xs text-slate-400 mt-3 pt-3 border-t border-white/5 font-medium">
                  <p>
                    Points:{" "}
                    <span className="text-blue-400 font-bold">
                      {task.points || 0} pts
                    </span>
                  </p>
                  <p>
                    Deadline:{" "}
                    <span className="text-rose-400 font-bold">
                      {task.deadline || "Open"}
                    </span>
                  </p>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="grid grid-cols-2 gap-3 text-xs font-bold pt-1">
                <button
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    task.active
                      ? "bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30"
                      : "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30"
                  }`}
                  onClick={() => toggleActive(task.id, task.active)}
                >
                  {task.active ? <FaToggleOff /> : <FaToggleOn />}
                  {task.active ? "Hide Task" : "Show Task"}
                </button>

                <button
                  className="py-2.5 rounded-xl bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20 hover:border-rose-500/40 transition-all flex items-center justify-center gap-1.5"
                  onClick={() => triggerDeleteConfirm(task.id, task.title)}
                >
                  <FaTrashAlt className="text-[10px]" /> Delete
                </button>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm bg-white/5 border border-white/10 rounded-3xl">
              No assignments available yet.
            </div>
          )}
        </div>
      </div>

      {/* ================= PREMIUM CUSTOM CONFIRMATION MODAL ================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900/90 border border-white/10 rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl space-y-4 backdrop-blur-xl animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl mx-auto">
              <FaExclamationTriangle />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                تأكيد حذف المهمة؟
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                هل أنت متأكد من حذف مهمة{" "}
                <span className="text-rose-400 font-semibold">
                  "{confirmModal.taskTitle}"
                </span>{" "}
                نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-bold">
              <button
                className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
                onClick={() =>
                  setConfirmModal({
                    isOpen: false,
                    taskId: null,
                    taskTitle: "",
                  })
                }
              >
                إلغاء
              </button>
              <button
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-colors"
                onClick={executeDelete}
              >
                نعم، احذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* رسائل الـ Toast العادية */}
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
