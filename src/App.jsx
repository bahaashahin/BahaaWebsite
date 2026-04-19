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
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

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

  if (loading)
    return <p className="text-white text-center mt-20">Loading...</p>;

  // 🔥 IMPORTANT: force start on home
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", "/");
  }

  return (
    <Router>
      <Navbar user={user} role={role} />

      <div className="md:ml-64 md:mt-0 min-h-screen bg-gray-100">
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
          <Route path="/session-report/:id" element={<SessionReport />} />;
          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
