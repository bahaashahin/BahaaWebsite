import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import AdminTasks from "./pages/AdminTasks";
import StudentTasks from "./pages/StudentTasks";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import AdminPoints from "./pages/AdminPoints";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Courses from "./pages/Courses";
import AdminSessions from "./pages/AdminSessions";
import StudentSessions from "./pages/StudentSessions";
import SessionDetails from "./pages/SessionDetails";
import SessionReport from "./pages/SessionReport";
import Exam from "./pages/Exam";
import CreateExam from "./pages/CreateExam";
import QuizList from "./pages/QuizList";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link,
} from "react-router-dom";

// ==========================================
// Professional Loading Screen Component
// ==========================================
const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 text-white">
    <div className="relative flex items-center justify-center mb-6">
      <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="absolute w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
    </div>
    <h2 className="text-xl font-bold tracking-wider text-gray-100 mb-2">
      Loading Platform...
    </h2>
    <p className="text-sm text-gray-400 font-medium tracking-wide">
      Please wait while we prepare your experience
    </p>
  </div>
);

// ==========================================
// Professional 404 Not Found Component
// ==========================================
const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
    <div className="bg-blue-50 text-blue-600 font-black text-7xl md:text-9xl p-6 rounded-3xl mb-4 shadow-inner">
      404
    </div>
    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
      Page Not Found
    </h1>
    <p className="text-gray-500 max-w-md mb-6">
      The page you are looking for doesn't exist or has been moved.
    </p>
    <Link
      to="/"
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
    >
      Back to Home
    </Link>
  </div>
);

function App() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));
        if (adminSnap.exists()) {
          setRole("admin");
        } else {
          const studentSnap = await getDoc(
            doc(db, "students", currentUser.uid),
          );
          if (studentSnap.exists()) {
            setRole(studentSnap.data().role || "student");
          } else {
            setRole("student");
          }
        }
      } catch (error) {
        console.error(error);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  // 🔥 IMPORTANT: force start on home
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", "/");
  }

  return (
    <Router>
      <Navbar user={user} role={role} />

      <div className="md:ml-64 md:mt-0 min-h-screen bg-gray-100 font-sans selection:bg-blue-500 selection:text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/tasks"
            element={
              user ? (
                role === "admin" ? (
                  <AdminTasks />
                ) : (
                  <StudentTasks />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/courses"
            element={
              user ? (
                role === "admin" ? (
                  <AdminSessions />
                ) : (
                  <StudentSessions />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/session/:id" element={<SessionDetails />} />
          <Route
            path="/admin-points"
            element={
              <ProtectedAdminRoute>
                <AdminPoints />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/quiz"
            element={user ? <Quiz /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/dashboard" />}
          />
          <Route path="/courses" element={<Courses />} />
          <Route path="/session-report/:id" element={<SessionReport />} />
          {/* ================= EXAM ================= */}
          <Route
            path="/exam/:id"
            element={user ? <Exam /> : <Navigate to="/login" />}
          />
          <Route
            path="/quizzes"
            element={user ? <QuizList /> : <Navigate to="/login" />}
          />
          <Route
            path="/create-exam"
            element={
              <ProtectedAdminRoute>
                <CreateExam />
              </ProtectedAdminRoute>
            }
          />
          {/* fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
