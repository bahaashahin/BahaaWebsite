import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function QuizPage() {
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbxtv96hiWXPoNT2Ulk-m1zvyu_6CdfyKBGbNHOifFE22lovNG2DDznZl4RGkp38Zmr9/exec";

  const QUIZ_MINUTES = 10; //Time min
  const QUIZ_TIME = QUIZ_MINUTES * 60; //time sec

  const questions = [
    {
      question: "What does HTML stand for?",
      options: [
        "Hyper Text Markup Language",
        "Home Tool Markup Language",
        "Hyperlinks and Text Markup Language",
        "Hyper Tool Multi Language",
      ],
      answer: 0,
    },
    {
      question: "Which language programming runs in the browser?",
      options: ["HTML", "C", "Python", "JavaScript"],
      answer: 3,
    },
    {
      question: "Find The Correct Code:",
      options: [
        `<head charset="UTF-8">`,
        `<meta charset="UTF-8"></meta>`,
        `<meta charset="UTF-8">`,
        `<html charset="UTF-8">`,
      ],
      answer: 2,
    },
    {
      question: "What is Attribute you use with LinK Tag?",
      options: [
        `referece="your_Link"`,
        `href="your_Link"`,
        `src="your_Link"`,
        `scr="your_Link"`,
      ],
      answer: 1,
    },
    {
      question: "Which Tag from the options belongs to the Semantic Elements?",
      options: [`<Head>`, `<Div>`, `<Header>`, `<vidoe>`],
      answer: 2,
    },
    {
      question: "Which attribute is used to create a hyperlink in HTML?",
      options: [`src`, `href`, `link`, `ref`],
      answer: 1,
    },
    {
      question: "Which tag is used to define an unordered list?",
      options: [`<ol>`, `<ul>`, `<li>`, `<list>`],
      answer: 1,
    },
    {
      question: "Which tag is used to insert an image in HTML?",
      options: [`<image>`, `<picture>`, `<img>`, `<src>`],
      answer: 2,
    },
    {
      question:
        "Which tag is used to define a hyperlink that opens in a new tab?",
      options: [`<a target="_blank">`, `<link new>`, `<a new>`, `<href blank>`],
      answer: 0,
    },
    {
      question: "Which tag is used to define a table row?",
      options: [`<td>`, `<tr>`, `<table>`, `<th>`],
      answer: 1,
    },
  ];

  const [student, setStudent] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [time, setTime] = useState(QUIZ_TIME);
  const [timeOver, setTimeOver] = useState(false);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);

  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    const fetchStudent = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const studentRef = doc(db, "students", user.uid);
      const snapshot = await getDoc(studentRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setStudent(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
        if (data.quizTaken) setBlocked(true);
      }
    };
    fetchStudent();
  }, []);

  useEffect(() => {
    if (!started || finished) return;

    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeOver(true);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, finished]);

  const formatTime = () => {
    const m = Math.floor(time / 60);
    const s = time % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (qIndex, optIndex) => {
    if (answers[qIndex] !== undefined) return;
    setAnswers({ ...answers, [qIndex]: optIndex });
  };

  const finishQuiz = async () => {
    if (finished) return;

    let correct = 0;
    let answersLog = [];

    questions.forEach((q, i) => {
      if (answers[i] === undefined) answersLog.push(`Q${i + 1}: No Answer`);
      else answersLog.push(`Q${i + 1}: ${answers[i]}`);
      if (answers[i] === q.answer) correct++;
    });

    setScore(correct);
    setFinished(true);

    if (student) {
      const studentRef = doc(db, "students", auth.currentUser.uid);
      await updateDoc(studentRef, { quizTaken: true });
    }

    // ✅ تعديل إرسال البيانات للشيت
    const formData = new URLSearchParams();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("score", correct);
    formData.append("total", questions.length);
    formData.append("answers", answersLog.join(" | "));

    try {
      console.log("Sending to Google Sheet:", formData.toString());

      await fetch(scriptURL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      console.log("Data sent successfully!");
    } catch (err) {
      console.error("Error sending to Google Sheet:", err);
    }
  };

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="bg-black/40 backdrop-blur-md p-10 rounded-xl text-center">
          <h1 className="text-2xl font-bold text-red-400">
            You already took this quiz
          </h1>
          <p className="mt-2 text-gray-300">
            Contact Admin if you need to take it again
          </p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="bg-black/40 backdrop-blur-md p-8 rounded-xl w-full max-w-2xl">
          <h1 className="text-3xl text-white font-bold text-center mb-6">
            Quiz
          </h1>
          <div className="grid md:grid-cols-3 gap-4">
            <input
              placeholder="Name"
              className="p-2 rounded"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              placeholder="Email"
              className="p-2 rounded"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              placeholder="Phone"
              className="p-2 rounded"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <button
            onClick={() => setStarted(true)}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="bg-black/40 backdrop-blur-md p-10 rounded-xl text-center">
          {timeOver && <h2 className="text-red-400 mb-3">Time is Over</h2>}
          <h1 className="text-3xl font-bold mb-3">
            Your Score : {score} / {questions.length}
          </h1>
          <p className="text-green-400">
            Your answers have been submitted successfully
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 relative">
      {/* Timer Box Fixed on Left */}
      {started && !finished && (
        <div className="fixed left-4 top-1/3 bg-black/60 text-yellow-400 p-4 rounded-lg font-bold shadow-lg">
          {formatTime()}
        </div>
      )}

      <div className="max-w-3xl mx-auto bg-black/40 backdrop-blur-md p-6 rounded-xl text-white">
        <div className="flex justify-between mb-6">
          <h2 className="font-bold">Quiz</h2>
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="mb-8">
            <h2 className="mb-3 font-semibold">
              {qIndex + 1}. {q.question}
            </h2>
            {q.options.map((opt, optIndex) => {
              let color = "bg-slate-800";
              if (answers[qIndex] !== undefined) {
                if (optIndex === q.answer) color = "bg-green-600";
                else if (optIndex === answers[qIndex]) color = "bg-red-600";
              }
              return (
                <button
                  key={optIndex}
                  onClick={() => handleAnswer(qIndex, optIndex)}
                  className={`${color} w-full text-left p-3 mb-2 rounded transition transform hover:scale-[1.02]`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ))}

        <button
          onClick={finishQuiz}
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded transition"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}
