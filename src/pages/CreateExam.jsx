import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { FaTrash } from "react-icons/fa";

export default function CreateExam() {
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [timer, setTimer] = useState(10); // ⏱ minutes

  const [questions, setQuestions] = useState([
    {
      type: "mcq",
      question: "",
      options: ["", "", ""],
      correct: 0,
      points: 1,
    },
  ]);

  const [exams, setExams] = useState([]);

  // ================= FETCH EXAMS =================
  const fetchExams = async () => {
    const snap = await getDocs(collection(db, "quizzes"));
    setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // ================= ADD QUESTION =================
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "mcq",
        question: "",
        options: ["", "", ""],
        correct: 0,
        points: 1,
      },
    ]);
  };

  const updateQuestion = (i, key, value) => {
    const updated = [...questions];
    updated[i][key] = value;
    setQuestions(updated);
  };

  const updateOption = (qi, oi, value) => {
    const updated = [...questions];
    updated[qi].options[oi] = value;
    setQuestions(updated);
  };

  const deleteQuestion = (i) => {
    setQuestions(questions.filter((_, index) => index !== i));
  };

  // ================= CREATE EXAM =================
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "quizzes"), {
      title,
      isActive,
      timer, // ⏱ NEW
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      questions,
    });

    setTitle("");
    setIsActive(true);
    setTimer(10);
    setQuestions([
      {
        type: "mcq",
        question: "",
        options: ["", "", ""],
        correct: 0,
        points: 1,
      },
    ]);

    fetchExams();
  };

  // ================= TOGGLE ACTIVE =================
  const toggleActive = async (id, current) => {
    await updateDoc(doc(db, "quizzes", id), {
      isActive: !current,
    });

    fetchExams();
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "quizzes", id));
    fetchExams();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6 flex flex-col items-center gap-10">
      <h2 className="text-3xl font-bold">🧠 Create Exam</h2>

      {/* ================= CREATE ================= */}
      <div className="w-full max-w-3xl bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
        <input
          placeholder="Exam Title"
          className="p-3 rounded bg-white/10"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* TIMER */}
        <input
          type="number"
          placeholder="Timer (minutes)"
          className="p-3 rounded bg-white/10"
          value={timer}
          onChange={(e) => setTimer(Number(e.target.value))}
        />

        {/* STATUS */}
        <select
          className="text-black p-2 rounded w-fit"
          value={isActive}
          onChange={(e) => setIsActive(e.target.value === "true")}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        {/* QUESTIONS */}
        {questions.map((q, i) => (
          <div
            key={i}
            className="bg-black/30 p-4 rounded flex flex-col gap-3 relative"
          >
            <button
              onClick={() => deleteQuestion(i)}
              className="absolute top-3 right-3 text-red-400"
            >
              <FaTrash />
            </button>

            <select
              className="text-black p-2 rounded w-fit"
              value={q.type}
              onChange={(e) => updateQuestion(i, "type", e.target.value)}
            >
              <option value="mcq">MCQ</option>
              <option value="essay">Essay</option>
              <option value="code">Code</option>
            </select>

            <input
              placeholder="Question"
              className="p-2 rounded bg-white/10"
              value={q.question}
              onChange={(e) => updateQuestion(i, "question", e.target.value)}
            />

            {q.type === "mcq" &&
              q.options.map((opt, j) => (
                <input
                  key={j}
                  placeholder={`Option ${j + 1}`}
                  className="p-2 rounded bg-white/10"
                  value={opt}
                  onChange={(e) => updateOption(i, j, e.target.value)}
                />
              ))}

            {q.type === "mcq" && (
              <select
                className="text-black p-1 rounded w-fit"
                value={q.correct}
                onChange={(e) =>
                  updateQuestion(i, "correct", Number(e.target.value))
                }
              >
                <option value={0}>1</option>
                <option value={1}>2</option>
                <option value={2}>3</option>
              </select>
            )}
          </div>
        ))}

        <button onClick={addQuestion} className="bg-gray-700 p-2 rounded">
          + Add Question
        </button>

        <button
          onClick={handleSave}
          className="bg-blue-600 p-3 rounded font-bold"
        >
          🚀 Create Exam
        </button>
      </div>

      {/* ================= LIST ================= */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        {exams.map((e) => (
          <div
            key={e.id}
            className="bg-white/5 p-4 rounded border border-white/10"
          >
            <h3 className="text-lg font-bold">{e.title}</h3>

            <p className="text-gray-400">⏱ Timer: {e.timer} min</p>

            <p className="text-sm">
              Status:{" "}
              <span className={e.isActive ? "text-green-400" : "text-red-400"}>
                {e.isActive ? "Active" : "Inactive"}
              </span>
            </p>

            <button
              onClick={() => toggleActive(e.id, e.isActive)}
              className="bg-yellow-600 px-3 py-1 rounded mt-2 mr-2"
            >
              Toggle Active
            </button>

            <button
              onClick={() => handleDelete(e.id)}
              className="bg-red-600 px-3 py-1 rounded mt-2"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
