import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDocs, collection, updateDoc } from "firebase/firestore";
import {
  FaCrown,
  FaMedal,
  FaSearch,
  FaGraduationCap,
  FaPlus,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import Message from "../components/Message";
import useAdmin from "../hooks/useAdmin";

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-[#020617] p-8 flex flex-col items-center justify-center space-y-6 animate-pulse">
      <div className="w-full max-w-3xl h-24 bg-white/5 rounded-3xl" />
      <div className="w-full max-w-3xl h-16 bg-white/5 rounded-2xl" />
    </div>
  );
}

export default function AdminPoints() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValues, setInputValues] = useState({});
  const [editingId, setEditingId] = useState(null);
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
    } catch (error) {
      setMessage({ text: "Failed to load data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchStudents();
    else if (!adminLoading) setLoading(false);
  }, [isAdmin, adminLoading]);

  const handleRename = async (id) => {
    if (!newName.trim()) return;
    try {
      await updateDoc(doc(db, "students", id), { Name: newName });
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, Name: newName } : s)),
      );
      setEditingId(null);
      setMessage({ text: "Name updated successfully", type: "success" });
    } catch {
      setMessage({ text: "Failed to update name", type: "error" });
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
      setMessage({ text: "Points added successfully", type: "success" });
    } catch {
      setMessage({ text: "Server error", type: "error" });
    }
  };

  const getRankBadge = (index) => {
    const colors = [
      "bg-amber-500/20 text-amber-400",
      "bg-slate-300/20 text-slate-300",
      "bg-amber-700/20 text-amber-700",
    ];
    if (index < 3)
      return (
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border border-current ${colors[index]}`}
        >
          {index === 0 ? <FaCrown /> : <FaMedal />}
        </div>
      );
    return (
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-slate-400">
        #{index + 1}
      </div>
    );
  };

  if (loading || adminLoading) return <SkeletonLoader />;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-gradient-to-r from-indigo-900/50 to-slate-900/50 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">
              <FaGraduationCap />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Points Management</h1>
              <p className="text-slate-400 text-sm">Admin Control Panel</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-4 top-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search for a student..."
            className="w-full p-4 pl-12 rounded-2xl bg-slate-900 border border-white/10 focus:border-indigo-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          {students
            .filter((s) =>
              s.Name?.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((s, i) => (
              <div
                key={s.id}
                className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl hover:border-indigo-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {getRankBadge(i)}
                    {editingId === s.id ? (
                      <div className="flex gap-2">
                        <input
                          className="bg-black p-2 rounded-lg border border-indigo-500 outline-none"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                        />
                        <button
                          onClick={() => handleRename(s.id)}
                          className="text-green-500"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-red-500"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{s.Name}</h3>
                        <button
                          onClick={() => {
                            setEditingId(s.id);
                            setNewName(s.Name);
                          }}
                          className="text-slate-500 hover:text-indigo-400"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-indigo-600/20 px-4 py-2 rounded-xl border border-indigo-500/20 text-center">
                    <span className="text-indigo-400 font-black text-xl">
                      {s.totalPoints}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex gap-2 bg-black/20 p-2 rounded-2xl">
                  <input
                    type="number"
                    placeholder="Bonus points..."
                    className="flex-1 bg-transparent p-2 outline-none text-sm px-4"
                    value={inputValues[s.id] || ""}
                    onChange={(e) =>
                      setInputValues((prev) => ({
                        ...prev,
                        [s.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() => handleAddPoints(s.id)}
                    className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                  >
                    <FaPlus /> Save
                  </button>
                </div>
              </div>
            ))}
        </div>
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
