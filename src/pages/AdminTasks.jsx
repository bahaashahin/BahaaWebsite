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
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-xl font-bold">
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
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-950 flex flex-col items-center gap-6">
      <div className="mb-20"></div>

      <h2 className="text-white text-2xl font-bold mb-4"> Tasks</h2>

      {/* إعدادات الفورم والرسالة */}
      <div className="w-full max-w-md p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl flex flex-col gap-3 text-white">
        <h3 className="font-bold text-lg">Admin Board</h3>
        <input
          className="p-2 rounded text-black"
          placeholder="Form Link"
          value={formLink}
          onChange={(e) => setFormLink(e.target.value)}
        />
        <textarea
          className="p-2 rounded text-black"
          placeholder="Message"
          value={adminMessage}
          onChange={(e) => setAdminMessage(e.target.value)}
        />
        <button
          onClick={saveSettings}
          className="bg-indigo-700 px-4 py-2 rounded hover:bg-indigo-800"
        >
          حفظ
        </button>
      </div>

      {/* إنشاء المهمة */}
      <div className="w-full max-w-md p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl flex flex-col gap-3 text-white">
        <h3 className="text-lg font-bold">Create New Task</h3>
        <input
          className="p-2 rounded text-black"
          placeholder="Title Task"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />
        <textarea
          className="p-2 rounded text-black"
          placeholder="Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
        />
        <input
          type="date"
          className="p-2 rounded text-black"
          value={newTask.deadline}
          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
        />
        <input
          type="number"
          className="p-2 rounded text-black"
          placeholder="Points"
          value={newTask.points}
          onChange={(e) => setNewTask({ ...newTask, points: e.target.value })}
        />
        <button
          className="bg-indigo-700 px-4 py-2 rounded hover:bg-indigo-800"
          onClick={handleCreateTask}
        >
          Create
        </button>
      </div>

      {/* قائمة المهام */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 text-white"
          >
            <h3 className="font-bold">{task.title}</h3>
            <p>{task.description}</p>
            <p>Points: {task.points}</p>
            <div className="flex gap-2 mt-2">
              <button
                className={`px-3 py-1 rounded ${task.active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                onClick={() => toggleActive(task.id, task.active)}
              >
                {task.active ? "close" : "open"}
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-500 hover:bg-gray-600"
                onClick={() => handleDelete(task.id)}
              >
                حذف
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
