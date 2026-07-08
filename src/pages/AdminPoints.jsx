import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  FaCrown,
  FaMedal,
  FaSearch,
  FaGraduationCap,
  FaCheck,
  FaTrash,
  FaEnvelope,
  FaBirthdayCake,
  FaEdit,
} from "react-icons/fa";
import Message from "../components/Message";
import useAdmin from "../hooks/useAdmin";

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-32 bg-slate-900 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-slate-900 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPoints() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValues, setInputValues] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    studentId: null,
    name: "",
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    studentId: null,
    name: "",
  });
  const [newName, setNewName] = useState("");
  const { isAdmin, loading: adminLoading } = useAdmin();

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const allStudents = querySnapshot.docs.map((d) => {
        const data = d.data();
        const totalPoints =
          (data.points?.tasks || 0) +
          (data.points?.attendance || 0) +
          (data.points?.search || 0) +
          (data.points?.bonus || 0);
        return { id: d.id, ...data, totalPoints };
      });
      setStudents(allStudents.sort((a, b) => b.totalPoints - a.totalPoints));
    } catch {
      setMessage({ text: "Failed to load students", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchStudents();
    else if (!adminLoading) setLoading(false);
  }, [isAdmin, adminLoading]);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "students", deleteModal.studentId));
      setStudents((prev) => prev.filter((s) => s.id !== deleteModal.studentId));
      setMessage({ text: "Student deleted successfully", type: "success" });
    } catch {
      setMessage({ text: "Failed to delete student", type: "error" });
    } finally {
      setDeleteModal({ isOpen: false, studentId: null, name: "" });
    }
  };

  const handleUpdateName = async () => {
    try {
      await updateDoc(doc(db, "students", editModal.studentId), {
        Name: newName,
      });
      setStudents(
        students.map((s) =>
          s.id === editModal.studentId ? { ...s, Name: newName } : s,
        ),
      );
      setMessage({ text: "Name updated successfully", type: "success" });
    } catch {
      setMessage({ text: "Failed to update name", type: "error" });
    } finally {
      setEditModal({ isOpen: false, studentId: null, name: "" });
    }
  };

  const handleAddPoints = async (id) => {
    const addedPoints = Number(inputValues[id]);
    if (!addedPoints) return;
    const student = students.find((s) => s.id === id);
    const newPoints = {
      ...student.points,
      bonus: (student.points?.bonus || 0) + addedPoints,
    };
    try {
      await updateDoc(doc(db, "students", id), { points: newPoints });
      setStudents((prev) =>
        prev
          .map((s) =>
            s.id === id
              ? {
                  ...s,
                  points: newPoints,
                  totalPoints: s.totalPoints + addedPoints,
                }
              : s,
          )
          .sort((a, b) => b.totalPoints - a.totalPoints),
      );
      setInputValues((prev) => ({ ...prev, [id]: "" }));
      setMessage({ text: "Points updated successfully", type: "success" });
    } catch {
      setMessage({ text: "Server error occurred", type: "error" });
    }
  };

  if (loading || adminLoading) return <SkeletonLoader />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 mb-8 backdrop-blur flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Management Panel
            </h1>
            <p className="text-slate-400 mt-1">
              Control student points, accounts, and details
            </p>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
            <FaGraduationCap size={30} />
          </div>
        </header>

        <div className="relative mb-8">
          <FaSearch className="absolute left-4 top-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full p-4 pl-12 rounded-2xl bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none transition-all"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students
            .filter(
              (s) =>
                s.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.Email?.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((s, i) => (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-2xl ${i < 3 ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800"}`}
                  >
                    {i === 0 ? (
                      <FaCrown size={20} />
                    ) : i < 3 ? (
                      <FaMedal size={20} />
                    ) : (
                      <span className="font-bold">#{i + 1}</span>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-indigo-400 font-mono">
                    {s.totalPoints} pts
                  </span>
                </div>
                <div className="mb-6">
                  <h3 className="font-bold text-xl mb-1">{s.Name}</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <FaEnvelope size={10} /> {s.Email || "No Email"}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-auto border-t border-slate-800 pt-4">
                  <input
                    type="number"
                    placeholder="Bonus"
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-center outline-none focus:border-indigo-500"
                    value={inputValues[s.id] || ""}
                    onChange={(e) =>
                      setInputValues({ ...inputValues, [s.id]: e.target.value })
                    }
                  />
                  <button
                    onClick={() => handleAddPoints(s.id)}
                    className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors"
                  >
                    <FaCheck />
                  </button>
                  <button
                    onClick={() => {
                      setEditModal({
                        isOpen: true,
                        studentId: s.id,
                        name: s.Name,
                      });
                      setNewName(s.Name);
                    }}
                    className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteModal({
                        isOpen: true,
                        studentId: s.id,
                        name: s.Name,
                      })
                    }
                    className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Edit Name</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 mb-4 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-indigo-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditModal({ isOpen: false })}
                className="flex-1 p-3 rounded-xl bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateName}
                className="flex-1 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2">Delete Student</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to remove{" "}
              <span className="text-white font-semibold">
                {deleteModal.name}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, studentId: null, name: "" })
                }
                className="flex-1 p-3 rounded-xl bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 p-3 rounded-xl bg-red-600 hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
