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
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-slate-950 px-4">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full -top-40 -left-40 blur-[120px]"></div>
        <div className="absolute w-[500px] h-[500px] bg-indigo-600/20 rounded-full -bottom-40 -right-40 blur-[120px]"></div>
      </div>

      {/* Card */}
      <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-sm z-10">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
          Welcome Back
        </h2>

        {/* Email */}
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-4 bg-slate-950/50 text-white border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-500"
            placeholder="Email Address"
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="relative mb-8">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-4 pr-16 bg-slate-950/50 text-white border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-500"
            placeholder="Password"
            autoComplete="current-password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>

        {/* Login Button */}
        <button
          className="w-full bg-blue-600 text-white p-4 rounded-2xl mb-6 hover:bg-blue-500 active:scale-[0.98] transition-all duration-300 font-semibold shadow-lg shadow-blue-900/20 disabled:opacity-50"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "AUTHENTICATING..." : "LOGIN"}
        </button>

        {/* Forgot Password */}
        {/* <p className="text-center mb-3 text-gray-400 text-sm">
          نسيت كلمة المرور؟{" "}
          <span
            className={`text-yellow-400 hover:underline cursor-pointer ${
              resetLoading ? "opacity-60 pointer-events-none" : ""
            }`}
            onClick={handleResetPassword}
          >
            {resetLoading ? "جاري الإرسال..." : "اضغط هنا لإعادة التعيين"}
          </span>
        </p> */}

        {/* Register Link */}
        {/* <p className="text-center mb-3 text-gray-400 text-sm">
          لو معندكش حساب؟{" "}
          <span
            className="text-blue-400 hover:underline cursor-pointer"
            onClick={() => navigate("/register")}
          >
            قم بالتسجيل
          </span>
        </p> */}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl text-center text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {info && (
          <div className="mt-4 p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-center text-sm">
            {info}
          </div>
        )}
      </div>
    </div>
  );
}
