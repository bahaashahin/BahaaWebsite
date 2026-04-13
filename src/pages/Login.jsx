import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setInfo("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("من فضلك أدخل البريد الإلكتروني وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, cleanEmail, password);

      // مهم جدًا: عندك في App.jsx الصفحة الرئيسية "/"
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      switch (err.code) {
        case "auth/invalid-email":
          setError("صيغة البريد الإلكتروني غير صحيحة");
          break;

        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
          break;

        case "auth/too-many-requests":
          setError("تمت محاولات كثيرة. حاول مرة أخرى بعد قليل");
          break;

        case "auth/network-request-failed":
          setError("تحقق من اتصال الإنترنت وحاول مرة أخرى");
          break;

        default:
          setError("حدث خطأ أثناء تسجيل الدخول");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setInfo("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("من فضلك أدخل البريد الإلكتروني أولًا");
      return;
    }

    try {
      setResetLoading(true);

      await sendPasswordResetEmail(auth, cleanEmail);

      setInfo("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
    } catch (err) {
      console.error("Reset password error:", err);

      switch (err.code) {
        case "auth/invalid-email":
          setError("صيغة البريد الإلكتروني غير صحيحة");
          break;

        case "auth/user-not-found":
          setError("هذا البريد الإلكتروني غير مسجل");
          break;

        case "auth/too-many-requests":
          setError("تمت محاولات كثيرة. حاول مرة أخرى بعد قليل");
          break;

        case "auth/network-request-failed":
          setError("تحقق من اتصال الإنترنت وحاول مرة أخرى");
          break;

        default:
          setError("حدث خطأ أثناء إرسال رابط إعادة التعيين");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <span className="absolute w-72 h-72 bg-blue-500/10 rounded-full -top-20 -left-20 blur-3xl animate-pulse"></span>
        <span className="absolute w-96 h-96 bg-indigo-500/10 rounded-full -bottom-32 -right-32 blur-3xl animate-pulse"></span>
      </div>

      {/* Card */}
      <div className="relative bg-black/40 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-sm z-10 transition-all duration-500 hover:scale-[1.01]">
        <h2 className="text-3xl font-bold mb-8 text-center text-white">
          Student Login
        </h2>

        {/* Email */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-3 bg-white/10 text-white border border-white/10 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
          placeholder="Email"
          autoComplete="email"
        />

        {/* Password */}
        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 pr-12 bg-white/10 text-white border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
            placeholder="Password"
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 hover:text-white"
          >
            {showPassword ? "إخفاء" : "إظهار"}
          </button>
        </div>

        {/* Login Button */}
        <button
          className="w-full bg-gradient-to-r from-indigo-700 to-blue-700 text-white p-3 rounded-xl mb-4 hover:from-indigo-800 hover:to-blue-800 transition-all duration-300 disabled:opacity-60"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "جاري تسجيل الدخول..." : "Login"}
        </button>

        {/* Forgot Password */}
        <p className="text-center mb-3 text-gray-400 text-sm">
          نسيت كلمة المرور؟{" "}
          <span
            className={`text-yellow-400 hover:underline cursor-pointer ${
              resetLoading ? "opacity-60 pointer-events-none" : ""
            }`}
            onClick={handleResetPassword}
          >
            {resetLoading ? "جاري الإرسال..." : "اضغط هنا لإعادة التعيين"}
          </span>
        </p>

        {/* Register Link */}
        <p className="text-center mb-3 text-gray-400 text-sm">
          لو معندكش حساب؟{" "}
          <span
            className="text-blue-400 hover:underline cursor-pointer"
            onClick={() => navigate("/register")}
          >
            قم بالتسجيل
          </span>
        </p>

        <button
          className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-3 rounded-xl hover:from-blue-800 hover:to-indigo-800 transition-all duration-300"
          onClick={() => navigate("/register")}
        >
          Register
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-600/90 text-white border border-red-700 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {info && (
          <div className="mt-4 p-3 bg-green-600/90 text-white border border-green-700 rounded-xl text-center text-sm">
            {info}
          </div>
        )}
      </div>
    </div>
  );
}
