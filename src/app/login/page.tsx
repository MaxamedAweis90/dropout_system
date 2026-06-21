"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, Shield, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage({ defaultMode = "teacher" }: { defaultMode?: "teacher" | "admin" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"teacher" | "admin">(defaultMode);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin") {
        router.push("/administrator");
      } else {
        router.push("/teacher");
      }
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Fadlan buuxi dhammaan meelaha banaan!");
      return;
    }

    setLoading(true);
    const res = await login(email, password, loginMode);
    if (res.success) {
      const finalRole = res.role || (loginMode === "admin" ? "admin" : "teacher");
      if (finalRole === "admin") {
        router.push("/administrator");
      } else {
        router.push("/teacher");
      }
    } else {
      setErrorMsg(res.error || "Cilad ayaa dhacday inta lagu guda jiray soo gelitaanka!");
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errorMsg) setErrorMsg(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMsg) setErrorMsg(null);
  };

  if (authLoading || user) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center font-sans antialiased transition-colors duration-500 ${
        loginMode === "admin" ? "bg-[#051f15]" : "bg-[#0c1329]"
      }`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-white opacity-70" />
          <p className="text-sm font-semibold text-slate-300">Fadlan sug...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ backfaceVisibility: "hidden", transform: "translate3d(0,0,0)" }}
        className={`min-h-screen w-full overflow-hidden relative font-sans antialiased transition-colors duration-500 ${
          loginMode === "admin" ? "bg-[#051f15]" : "bg-[#0c1329]"
        }`}
      >
      {/* Background blobs for premium glassmorphism aesthetic */}
      {/* Teacher Blobs */}
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl transition-opacity duration-500 ${loginMode === "teacher" ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <motion.div
        animate={{
          y: [0, -25, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl transition-opacity duration-500 ${loginMode === "teacher" ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Admin Blobs */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 15, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-600/15 blur-3xl transition-opacity duration-500 ${loginMode === "admin" ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <motion.div
        animate={{
          y: [0, 25, 0],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-3xl transition-opacity duration-500 ${loginMode === "admin" ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Master Container */}
      <div className="max-w-[1400px] mx-auto w-full h-screen relative px-8 lg:px-20 xl:px-28">
        {/* The Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full w-full items-center gap-12 lg:gap-20 xl:gap-28">

          {/* ════════════════════════════════════════════════ */}
          {/* LEFT SIDE — Hero Text & Branding               */}
          {/* ════════════════════════════════════════════════ */}
          <div className="flex flex-col justify-center h-full py-12 lg:py-0">
            {/* Logo + App Name */}
            <div className="flex items-center gap-4 mb-14">
              <motion.div 
                animate={{ rotate: loginMode === "admin" ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
                className={`relative w-14 h-14 rounded-2xl overflow-hidden shadow-xl transition-shadow duration-300 ${
                  loginMode === "admin" ? "shadow-emerald-500/20" : "shadow-indigo-500/20"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-tr from-[#3b82f6] to-[#6366f1] transition-opacity duration-300 ${loginMode === "teacher" ? "opacity-100" : "opacity-0"}`} />
                <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-600 transition-opacity duration-300 ${loginMode === "admin" ? "opacity-100" : "opacity-0"}`} />
                <motion.div 
                  animate={{ rotate: loginMode === "admin" ? -180 : 0 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {loginMode === "admin" ? (
                    <Shield size={26} className="text-white" />
                  ) : (
                    <User size={26} className="text-white" />
                  )}
                </motion.div>
              </motion.div>
              <span className="text-2xl font-extrabold tracking-wider text-white">
                Dropout<span className={`transition-colors duration-300 ${loginMode === "admin" ? "text-emerald-400" : "text-indigo-400"}`}>SyS</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl xl:text-7xl font-black text-white tracking-tight mb-7 leading-tight">
              Hey, Hello!
            </h1>

            {/* Sub-headline */}
            <motion.h2 
              key={loginMode}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-2xl text-slate-300 font-bold mb-7"
            >
              {loginMode === "admin"
                ? "Nidaamka Maamulaha ee DropoutSyS"
                : "Nidaamka Macallinka ee DropoutSyS"}
            </motion.h2>

            {/* Description */}
            <p className="text-lg text-slate-400 max-w-[460px] leading-relaxed">
              Waxaan bixinaa nidaam ku shaqeeya sirdoonka macmalka ah oo kaa caawinaya
              saadaalinta ka-haridda ardayda, si loo badbaadiyo mustaqbalkooda waxbarasho.
            </p>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* RIGHT SIDE — Floating "Phone Shape" White Card  */}
          {/* ════════════════════════════════════════════════ */}
          <div className="relative flex flex-col items-end h-full" style={{ perspective: 1000 }}>
            {/* The card: pushed down with top offset, bleeds past bottom */}
            <motion.div
              animate={{
                rotateY: loginMode === "admin" ? 6 : -6,
                x: loginMode === "admin" ? -5 : 5,
              }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              className="w-full max-w-[520px] ml-auto bg-white rounded-[3rem] md:rounded-[4rem] px-10 pt-20 pb-28 md:px-14 md:pt-24 md:pb-36 shadow-2xl shadow-black/30 absolute top-[12%] bottom-[-12%] flex flex-col overflow-hidden"
            >
              {/* iPhone Notch / Dynamic Island */}
              <div className={`absolute top-5 left-1/2 -translate-x-1/2 w-32 h-6 rounded-full flex items-center justify-center gap-2 pointer-events-none transition-colors duration-500 z-35 ${
                loginMode === "admin" ? "bg-[#051f15]" : "bg-[#0c1329]"
              }`}>
                <span className="w-12 h-1 bg-slate-800 rounded-full" />
                <span className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
              </div>

              {/* Custom In-Card Floating Notification */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ y: -15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 20 }}
                    className="absolute top-16 left-6 right-6 bg-red-500/10 border border-red-500/20 backdrop-blur-md py-4 px-6 rounded-2xl z-30 flex items-center justify-between shadow-lg shadow-red-500/5"
                  >
                    <span className="text-red-700 text-sm font-medium pr-4 leading-normal">
                      {errorMsg}
                    </span>
                    <button
                      type="button"
                      onClick={() => setErrorMsg(null)}
                      className="text-red-700/60 hover:text-red-700 font-bold text-xs p-1 cursor-pointer transition shrink-0"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Header ── */}
              <motion.h3 
                key={`header-${loginMode}`}
                initial={{ opacity: 0, x: loginMode === "admin" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-4xl font-extrabold text-gray-900 text-center mb-4"
              >
                Welcome Back
              </motion.h3>
              <motion.p
                key={`subheader-${loginMode}`}
                initial={{ opacity: 0, x: loginMode === "admin" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                className="text-base text-gray-500 text-center mb-14"
              >
                {loginMode === "admin"
                  ? "Fadlan geli macluumaadkaaga si aad u gasho qeybta Maamulka."
                  : "Fadlan geli macluumaadkaaga si aad u gasho qeybta Macallinka."}
              </motion.p>

              {/* ── Form ── */}
              <motion.form 
                key={`form-${loginMode}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                onSubmit={handleLogin} 
                className="flex flex-col"
              >
                {/* Email */}
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={handleEmailChange}
                  className={`rounded-full border border-gray-200 py-5 px-8 w-full mb-7 bg-white text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    loginMode === "admin"
                      ? "focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "focus:border-indigo-500 focus:ring-indigo-500/20"
                  }`}
                />

                {/* Password */}
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`rounded-full border border-gray-200 py-5 px-8 w-full mb-3 bg-white text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    loginMode === "admin"
                      ? "focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "focus:border-indigo-500 focus:ring-indigo-500/20"
                  }`}
                />

                {/* Forgot Password */}
                <span className={`text-right text-sm font-semibold mb-10 inline-block w-full cursor-pointer transition-colors duration-300 ${
                  loginMode === "admin"
                    ? "text-emerald-600 hover:text-emerald-500"
                    : "text-indigo-600 hover:text-indigo-500"
                }`}>
                  Forgot Password?
                </span>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative overflow-hidden rounded-full w-full py-5 md:py-6 text-white font-bold text-xl shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    loginMode === "admin" ? "shadow-emerald-600/30" : "shadow-indigo-600/30"
                  }`}
                >
                  {/* Teacher gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#4f8ff7] hover:to-[#7577f5] transition-opacity duration-300 ${loginMode === "teacher" ? "opacity-100" : "opacity-0"}`} />
                  {/* Admin forest gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-opacity duration-300 ${loginMode === "admin" ? "opacity-100" : "opacity-0"}`} />
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      "Login"
                    )}
                  </span>
                </button>
              </motion.form>

              {/* ── Teacher/Admin Toggle ── */}
              <motion.div 
                key={`toggle-${loginMode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="mt-16 text-center"
              >
                {loginMode === "teacher" ? (
                  <p className="text-gray-500 text-base">
                    Are you a system admin?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode("admin");
                        setEmail("");
                        setPassword("");
                        setErrorMsg(null);
                      }}
                      className="text-indigo-600 font-bold hover:text-indigo-500 transition cursor-pointer"
                    >
                      Login as Admin
                    </button>
                  </p>
                ) : (
                  <p className="text-gray-500 text-base">
                    Are you a faculty member?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode("teacher");
                        setEmail("");
                        setPassword("");
                        setErrorMsg(null);
                      }}
                      className="text-emerald-600 font-bold hover:text-emerald-500 transition cursor-pointer"
                    >
                      Login as Teacher
                    </button>
                  </p>
                )}
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
      </motion.main>
    </AnimatePresence>
  );
}
