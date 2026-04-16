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
import Message from "../components/Message";
import useAdmin from "../hooks/useAdmin";

export default function AdminTasks() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [tasks, setTasks] = useState([]);
  const [formLink, setFormLink] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    points: "",
    type: "task",
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      fetchTasks();
      fetchSettings();
    }
  }, [isAdmin]);

  if (adminLoading)
    return (
      <p className="text-white text-center mt-20 text-xl font-semibold">
        Loading...
      </p>
    );

  if (!isAdmin)
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        ليس لديك صلاحية للدخول لهذه الصفحة
      </div>
    );

  const fetchTasks = async () => {
    const snapshot = await getDocs(collection(db, "tasks"));
    setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchSettings = async () => {
    const snap = await getDoc(doc(db, "settings", "main"));
    if (snap.exists()) {
      setFormLink(snap.data().formLink || "");
      setAdminMessage(snap.data().message || "");
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.description) {
      setMessage({ text: "املأ العنوان والوصف", type: "error" });
      return;
    }

    await addDoc(collection(db, "tasks"), {
      ...newTask,
      points: Number(newTask.points),
      createdAt: Date.now(),
      active: true,
    });

    setMessage({ text: "تم إنشاء المهمة بنجاح", type: "success" });

    setNewTask({
      title: "",
      description: "",
      deadline: "",
      points: "",
      type: "task",
    });

    fetchTasks();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
    setMessage({ text: "تم حذف المهمة", type: "info" });
    fetchTasks();
  };

  const toggleActive = async (id, current) => {
    await updateDoc(doc(db, "tasks", id), { active: !current });
    setMessage({
      text: current ? "تم إغلاق المهمة" : "تم فتح المهمة",
      type: "info",
    });
    fetchTasks();
  };

  const saveSettings = async () => {
    await setDoc(doc(db, "settings", "main"), {
      formLink,
      message: adminMessage,
    });
    setMessage({ text: "تم تحديث الإعدادات", type: "success" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 px-6 py-10 flex flex-col items-center gap-10">
      <div className="h-10" />

      <h2 className="text-white text-3xl font-bold tracking-wide">
        Tasks Management
      </h2>

      {/* ================= SETTINGS ================= */}
      <div className="w-full max-w-2xl p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col gap-4 text-white">
        <h3 className="font-bold text-lg">Admin Board</h3>

        <input
          className="p-3 rounded-xl bg-black/30 border border-white/10 outline-none text-white"
          placeholder="Form Link"
          value={formLink}
          onChange={(e) => setFormLink(e.target.value)}
        />

        <textarea
          className="p-3 rounded-xl bg-black/30 border border-white/10 outline-none text-white"
          placeholder="Message"
          value={adminMessage}
          onChange={(e) => setAdminMessage(e.target.value)}
        />

        <button
          onClick={saveSettings}
          className="bg-indigo-600 hover:bg-indigo-700 transition px-4 py-2 rounded-xl font-semibold"
        >
          Save Settings
        </button>
      </div>

      {/* ================= CREATE TASK ================= */}
      <div className="w-full max-w-2xl p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col gap-4 text-white">
        <h3 className="text-lg font-bold">Create New Task</h3>

        <input
          className="p-3 rounded-xl bg-black/30 border border-white/10 outline-none text-white"
          placeholder="Title Task"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />

        <textarea
          className="p-3 rounded-xl bg-black/30 border border-white/10 outline-none text-white"
          placeholder="Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
        />

        <input
          type="date"
          className="p-3 rounded-xl bg-black/30 border border-white/10 outline-none text-white"
          value={newTask.deadline}
          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
        />

        <input
          type="number"
          className="p-3 rounded-xl bg-black/30 border border-white/10 outline-none text-white"
          placeholder="Points"
          value={newTask.points}
          onChange={(e) => setNewTask({ ...newTask, points: e.target.value })}
        />

        <button
          className="bg-indigo-600 hover:bg-indigo-700 transition px-4 py-2 rounded-xl font-semibold"
          onClick={handleCreateTask}
        >
          Create Task
        </button>
      </div>

      {/* ================= TASKS LIST ================= */}
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-white shadow-lg hover:scale-[1.01] transition"
          >
            <h3 className="font-bold text-lg">{task.title}</h3>
            <p className="text-gray-300 text-sm mt-1">{task.description}</p>

            <p className="text-gray-400 mt-2 text-sm">
              Points: <span className="text-white">{task.points}</span>
            </p>

            <div className="flex gap-3 mt-4">
              <button
                className={`px-4 py-1 rounded-xl font-medium transition ${
                  task.active
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                onClick={() => toggleActive(task.id, task.active)}
              >
                {task.active ? "Close" : "Open"}
              </button>

              <button
                className="px-4 py-1 rounded-xl bg-gray-600 hover:bg-gray-700 transition"
                onClick={() => handleDelete(task.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
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
