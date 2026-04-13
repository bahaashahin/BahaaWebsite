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
    <div className="min-h-screen p-6 bg-blue-950 flex flex-col items-center gap-6">
      <h2 className="text-white text-2xl font-bold">المهام المخصصة لك</h2>

      {/* رسالة الأدمن */}
      {adminMessage && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-black/40 backdrop-blur-md text-white">
          {adminMessage}
        </div>
      )}

      {/* الفورم */}
      {formLink && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-blue-900 text-white shadow-lg">
          <h3 className="font-bold mb-2">نموذج الطلاب</h3>
          <a
            href={formLink}
            target="_blank"
            className="underline text-blue-200"
          >
            فتح النموذج
          </a>
        </div>
      )}

      {/* المهام */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        {tasks.map((task) => {
          const isCompleted = completedTasks.includes(task.id);

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl shadow-lg flex flex-col gap-2 ${
                isCompleted
                  ? "bg-green-600 text-white"
                  : "bg-blue-800 text-white"
              }`}
            >
              <h3 className="font-bold text-lg">{task.title}</h3>

              <p>{task.description}</p>

              <p>نقاط: {task.points}</p>

              <p>Deadline: {task.deadline || "غير محدد"}</p>

              <button
                onClick={() => handleComplete(task.id)}
                className="mt-2 px-3 py-1 rounded bg-black/30"
              >
                {isCompleted ? "تم الإنجاز" : "أكمل المهمة"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
