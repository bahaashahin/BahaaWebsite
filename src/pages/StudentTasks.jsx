// src/pages/StudentTasks.jsx
import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

export default function StudentTasks() {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [formLink, setFormLink] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const fetchTasks = async () => {
    const snapshot = await getDocs(collection(db, "tasks"));
    setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const fetchSettings = async () => {
    const snap = await getDoc(doc(db, "settings", "main"));
    if (snap.exists()) {
      setFormLink(snap.data().formLink);
      setAdminMessage(snap.data().message);
    }
  };

  const fetchCompleted = async () => {
    const uid = auth.currentUser.uid;

    const snap = await getDoc(doc(db, "completedTasks", uid));

    if (snap.exists()) {
      setCompletedTasks(snap.data().tasks || []);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchSettings();
    fetchCompleted();
  }, []);

  const handleComplete = async (taskId) => {
    const uid = auth.currentUser.uid;

    let updated;

    if (completedTasks.includes(taskId)) {
      updated = completedTasks.filter((id) => id !== taskId);
    } else {
      updated = [...completedTasks, taskId];
    }

    setCompletedTasks(updated);

    await setDoc(doc(db, "completedTasks", uid), {
      tasks: updated,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6 flex flex-col items-center gap-6">
      <div className="h-10" />

      <h2 className="text-white text-3xl font-bold mb-2">My Tasks</h2>

      {/* ================= ADMIN MESSAGE ================= */}
      {adminMessage && (
        <div className="w-full max-w-2xl p-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-white shadow-lg">
          {adminMessage}
        </div>
      )}

      {/* ================= FORM LINK ================= */}
      {formLink && (
        <div className="w-full max-w-2xl p-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-white shadow-lg">
          <h3 className="font-bold mb-2 text-lg">Student Form</h3>
          <a
            href={formLink}
            target="_blank"
            className="text-blue-400 underline"
          >
            Open Form
          </a>
        </div>
      )}

      {/* ================= TASKS ================= */}
      <div className="flex flex-col gap-4 w-full max-w-2xl">
        {tasks.map((task) => {
          const isCompleted = completedTasks.includes(task.id);

          return (
            <div
              key={task.id}
              className={`p-5 rounded-3xl shadow-lg backdrop-blur-xl border transition hover:scale-[1.01]
              ${
                isCompleted
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <h3 className="font-bold text-xl text-white">{task.title}</h3>

              <p className="text-gray-300 mt-1 text-sm">{task.description}</p>

              <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
                <span>Points: {task.points}</span>
                <span>Deadline: {task.deadline || "Not set"}</span>
              </div>

              <button
                onClick={() => handleComplete(task.id)}
                className={`mt-4 w-full py-2 rounded-xl font-medium transition
                ${
                  isCompleted
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isCompleted ? "Completed ✔" : "Mark as Done"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
