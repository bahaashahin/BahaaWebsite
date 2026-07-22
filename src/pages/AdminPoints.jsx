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
  FaEdit,
  FaExclamationTriangle,
  FaLayerGroup,
} from "react-icons/fa";
import Message from "../components/Message";
import useAdmin from "../hooks/useAdmin";

function SkeletonLoader() {
  return (
    <div className="w-full bg-[#0B0F19] p-4 md:p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-32 bg-slate-800/50 rounded-2xl md:rounded-3xl border border-slate-700/30" />
        <div className="h-14 max-w-2xl bg-slate-800/50 rounded-2xl border border-slate-700/30" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-60 bg-slate-800/40 rounded-2xl md:rounded-3xl border border-slate-700/30"
            />
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
  const [levelModal, setLevelModal] = useState({
    isOpen: false,
    studentId: null,
    name: "",
    currentLevel: 1,
  });
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState(1);
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
          (data.points?.bonus || 0) +
          (data.points?.PointLevel2 || 0);
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

  const handleUpdateLevel = async () => {
    const parsedLevel = Number(newLevel);
    try {
      await updateDoc(doc(db, "students", levelModal.studentId), {
        Level: parsedLevel,
      });
      setStudents(
        students.map((s) =>
          s.id === levelModal.studentId ? { ...s, Level: parsedLevel } : s,
        ),
      );
      setMessage({ text: "Level updated successfully", type: "success" });
    } catch {
      setMessage({ text: "Failed to update level", type: "error" });
    } finally {
      setLevelModal({
        isOpen: false,
        studentId: null,
        name: "",
        currentLevel: 1,
      });
    }
  };

  const handlePointLevel2 = async (id) => {
    const addedPoints = Number(inputValues[`lvl2_${id}`]) || 0;
    if (!addedPoints) return;
    const student = students.find((s) => s.id === id);
    const newPoints = {
      ...student.points,
      PointLevel2: (student.points?.PointLevel2 || 0) + addedPoints,
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
      setInputValues((prev) => ({ ...prev, [`lvl2_${id}`]: "" }));
      setMessage({
        text: "Level 2 points updated successfully",
        type: "success",
      });
    } catch {
      setMessage({ text: "Server error occurred", type: "error" });
    }
  };

  if (loading || adminLoading) return <SkeletonLoader />;

  return (
    <div className="w-full bg-[#0B0F19] text-slate-100 p-4 md:p-6 lg:p-8 font-sans selection:bg-indigo-500/30 box-border">
      <div className="max-w-7xl mx-auto pb-6">
        {/* Header Section */}
        <header className="bg-slate-900/40 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-700/50 mb-8 md:mb-10 backdrop-blur-xl shadow-2xl shadow-indigo-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />

          <div className="z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight mb-2">
              Management Panel
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium">
              Monitor and control student points, accounts, and performance.
            </p>
          </div>
          <div className="p-4 md:p-5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-inner z-10 hidden md:block">
            <FaGraduationCap size={32} />
          </div>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8 md:mb-10 max-w-2xl group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-indigo-400 text-slate-500">
            <FaSearch size={16} />
          </div>
          <input
            type="text"
            placeholder="Search by student name or email..."
            className="w-full py-3.5 md:py-4 pl-14 pr-6 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all backdrop-blur-sm shadow-lg shadow-black/20 text-sm md:text-base"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {students
            .filter(
              (s) =>
                s.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.Email?.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((s, i) => {
              const currentLevel = s.Level || 1;
              return (
                <div
                  key={s.id}
                  className={`group bg-slate-900/40 border p-5 md:p-6 rounded-2xl md:rounded-3xl flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/20 backdrop-blur-md relative overflow-hidden ${
                    currentLevel > 1
                      ? "border-emerald-500/40 hover:border-emerald-500/70 shadow-emerald-500/5"
                      : "border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/40 hover:shadow-indigo-500/10"
                  }`}
                >
                  {currentLevel > 1 && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
                  )}

                  {/* Rank Badge & Points */}
                  <div className="flex justify-between items-center mb-5">
                    <div
                      className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-105 ${
                        i === 0
                          ? "bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 text-yellow-400 border border-yellow-400/30"
                          : i < 3
                            ? "bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 text-indigo-400 border border-indigo-400/30"
                            : "bg-slate-800/80 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {i === 0 ? (
                        <FaCrown size={20} />
                      ) : i < 3 ? (
                        <FaMedal size={20} />
                      ) : (
                        <span className="font-bold text-base md:text-lg">
                          #{i + 1}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl md:text-3xl font-black text-white tracking-tight">
                        {s.totalPoints}
                      </span>
                      <span className="block text-[10px] md:text-xs text-emerald-400 font-bold uppercase tracking-wider">
                        Lvl 2: {s.points?.PointLevel2 || 0} pts
                      </span>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className="font-bold text-lg md:text-xl text-slate-100 truncate mr-2"
                        title={s.Name}
                      >
                        {s.Name}
                      </h3>
                      <button
                        onClick={() => {
                          setLevelModal({
                            isOpen: true,
                            studentId: s.id,
                            name: s.Name,
                            currentLevel: currentLevel,
                          });
                          setNewLevel(currentLevel);
                        }}
                        className={`px-2 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 shrink-0 ${
                          currentLevel > 1
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                        title="Change Level"
                      >
                        <FaLayerGroup size={10} /> Lvl {currentLevel}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm">
                      <FaEnvelope
                        className="text-slate-500 shrink-0"
                        size={12}
                      />
                      <span className="truncate">
                        {s.Email || "No Email Provided"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto space-y-3">
                    {/* Level 2 Points Input Group */}
                    <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-emerald-500/30 focus-within:border-emerald-500 transition-colors">
                      <input
                        type="number"
                        placeholder="+ Lvl 2 Points"
                        className="w-full bg-transparent p-2 text-xs md:text-sm text-center outline-none text-emerald-200 placeholder-emerald-600/70 font-medium"
                        value={inputValues[`lvl2_${s.id}`] || ""}
                        onChange={(e) =>
                          setInputValues({
                            ...inputValues,
                            [`lvl2_${s.id}`]: e.target.value,
                          })
                        }
                      />
                      <button
                        onClick={() => handlePointLevel2(s.id)}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                        title="Add Level 2 Points"
                      >
                        <FaCheck size={14} />
                      </button>
                    </div>

                    {/* Edit & Delete Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditModal({
                            isOpen: true,
                            studentId: s.id,
                            name: s.Name,
                          });
                          setNewName(s.Name);
                        }}
                        className="flex-1 flex justify-center items-center gap-1.5 py-2.5 px-3 bg-slate-800/50 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 border border-slate-700/50 hover:border-blue-500/30 rounded-xl transition-all text-xs md:text-sm font-medium active:scale-95"
                      >
                        <FaEdit size={12} /> Edit
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            studentId: s.id,
                            name: s.Name,
                          })
                        }
                        className="flex-1 flex justify-center items-center gap-1.5 py-2.5 px-3 bg-slate-800/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-700/50 hover:border-red-500/30 rounded-xl transition-all text-xs md:text-sm font-medium active:scale-95"
                      >
                        <FaTrash size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Edit Name Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-2xl md:rounded-[2rem] max-w-md w-full shadow-2xl shadow-black">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                <FaEdit size={20} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Edit Student Name
              </h3>
            </div>

            <div className="mb-6 md:mb-8">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3.5 md:p-4 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm md:text-base"
                placeholder="Enter new name..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setEditModal({ isOpen: false })}
                className="flex-1 p-3.5 md:p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateName}
                className="flex-1 p-3.5 md:p-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm md:text-base"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Level Modal */}
      {levelModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/30 p-6 md:p-8 rounded-2xl md:rounded-[2rem] max-w-md w-full shadow-2xl shadow-black">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <FaLayerGroup size={20} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Change Student Level
              </h3>
            </div>

            <p className="text-slate-400 text-sm mb-6">
              Updating level for:{" "}
              <span className="text-white font-bold">{levelModal.name}</span>
            </p>

            <div className="mb-6 md:mb-8">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Student Level (Number)
              </label>
              <input
                type="number"
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                className="w-full p-3.5 md:p-4 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm md:text-base"
                placeholder="Enter level number..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setLevelModal({ isOpen: false })}
                className="flex-1 p-3.5 md:p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLevel}
                className="flex-1 p-3.5 md:p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-sm md:text-base"
              >
                Update Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/20 p-6 md:p-8 rounded-2xl md:rounded-[2rem] max-w-md w-full shadow-2xl shadow-black relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-pink-500" />

            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 md:p-4 bg-red-500/10 text-red-500 rounded-2xl">
                <FaExclamationTriangle size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Delete Student
              </h3>
            </div>

            <p className="text-slate-400 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
              Are you absolutely sure you want to remove <br />
              <span className="text-white font-bold text-base md:text-lg inline-block mt-2 px-3 py-1 bg-slate-800 rounded-lg">
                {deleteModal.name}
              </span>
              <br />
              <span className="text-red-400 text-xs md:text-sm mt-3 block">
                This action cannot be undone.
              </span>
            </p>

            <div className="flex gap-4">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, studentId: null, name: "" })
                }
                className="flex-1 p-3.5 md:p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 p-3.5 md:p-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-500/20 transition-all active:scale-95 text-sm md:text-base"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Messages */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <Message
            text={message.text}
            type={message.type}
            onClose={() => setMessage(null)}
          />
        </div>
      )}
    </div>
  );
}
