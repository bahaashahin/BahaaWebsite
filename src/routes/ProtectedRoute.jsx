// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, isAdmin, adminOnly, children }) {
  if (!user) return <Navigate to="/login" />; // لازم يسجل دخول
  if (adminOnly && !isAdmin) return <Navigate to="/student-tasks" />; // لو حاول يدخل صفحة أدمن
  if (!adminOnly && isAdmin) return <Navigate to="/admin-tasks" />; // لو أدمن حاول يدخل صفحة طالب
  return children;
}
