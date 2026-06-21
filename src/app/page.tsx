"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import {
  ArrowRight,
  GraduationCap,
  Shield,
  Activity,
  Cpu,
  Layers,
  Database,
  CheckCircle,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Check,
  TrendingUp,
  Server,
  Sparkles,
  BarChart,
  Target
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("home");

  // State for real danger student and platform metrics
  const [liveStudent, setLiveStudent] = useState<any>({
    name: "Mustafa Ahmed Warsame",
    risk_level: "High-Risk",
    attendance_rate: 68.4,
    cgpa: 2.12,
    dropout_probability: 0.835
  });
  const [stats, setStats] = useState({
    activeCohorts: "1,248",
    alertsDispatched: "84",
    savedStudents: "94.2%"
  });

  // Fetch highest risk student and actual counts from Supabase on load
  useEffect(() => {
    async function fetchLivePredictionData() {
      try {
        // 1. Fetch highest risk student with valid probability
        const { data: studentsData } = await supabase
          .from("students")
          .select("student_id, name, attendance_rate, cgpa, dropout_probability, risk_level")
          .not("dropout_probability", "is", null)
          .order("dropout_probability", { ascending: false })
          .limit(1);

        if (studentsData && studentsData.length > 0) {
          const topStudent = studentsData[0];
          setLiveStudent({
            name: topStudent.name,
            risk_level: topStudent.risk_level || "High-Risk",
            attendance_rate: Number(topStudent.attendance_rate) || 0,
            cgpa: Number(topStudent.cgpa) || 0,
            dropout_probability: Number(topStudent.dropout_probability) || 0
          });
        }

        // 2. Fetch counts for stats
        const { count: totalCount } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true });

        const { count: activeAlertsCount } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .in("risk_level", ["High-Risk", "At-Risk"]);

        const { count: safeCount } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("risk_level", "Safe");

        if (totalCount !== null && totalCount > 0) {
          const alertsVal = activeAlertsCount !== null ? activeAlertsCount : 0;
          const safeVal = safeCount !== null ? safeCount : 0;
          const savedPercentage = Math.round((safeVal / totalCount) * 1000) / 10;

          setStats({
            activeCohorts: totalCount.toLocaleString(),
            alertsDispatched: alertsVal.toLocaleString(),
            savedStudents: `${savedPercentage}%`
          });
        }
      } catch (err) {
        console.warn("Failed to fetch live prediction data from Supabase:", err);
      }
    }

    fetchLivePredictionData();
  }, []);

  // Section references for intersection observer
  const homeRef = useRef<HTMLElement>(null);
  const metricsRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);

  // Handle intersection observer to highlight active sidebar nav item on scroll
  useEffect(() => {
    const sections = [
      { id: "home", ref: homeRef },
      { id: "metrics", ref: metricsRef },
      { id: "how-it-works", ref: howItWorksRef }
    ];

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((sec) => {
      if (sec.ref.current) {
        observer.observe(sec.ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  // Framer motion animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* HTML Metadata for SEO */}
      <title>DropoutSyS | Proactive Student Success Predictive System</title>
      <meta
        name="description"
        content="Detect early signs of student dropout before it's too late. DropoutSyS leverages calibrated Machine Learning models for active student intervention."
      />

      {/* Background visual graphics */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      {/* Top Navbar & Slide-over Drawer component */}
      <Sidebar
        activeSection={activeSection}
        onLinkClick={scrollToSection}
      />

      {/* Main Content Area (pt-20 is for sticky top bar offset, full width by default) */}
      <div className="relative z-10 w-full pt-20">
        
        {/* Banner Alert for Authenticated users */}
        {user && !authLoading && (
          <div className="bg-indigo-950/80 border-b border-indigo-900/60 backdrop-blur-md px-6 py-3 text-center text-xs font-semibold text-indigo-300 flex flex-col sm:flex-row items-center justify-center gap-2 sticky top-20 z-30">
            <span>You are currently authenticated as <strong className="text-white font-bold">{user.name} ({user.role})</strong></span>
            <Link
              href={user.role === "admin" ? "/administrator" : "/teacher"}
              className="inline-flex items-center gap-1 text-white hover:underline bg-indigo-600 px-3 py-1 rounded-lg transition"
            >
              <span>Go to Dashboard</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        )}

        {/* ════════════════════════ HERO SECTION ════════════════════════ */}
        <section
          id="home"
          ref={homeRef}
          className="relative min-h-[85vh] flex flex-col justify-center px-6 md:px-12 lg:px-20 py-16"
        >
          <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side text content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-7 flex flex-col justify-center text-left"
            >
              {/* Early Warning Alert Pill */}
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold w-fit mb-6 shadow-sm"
              >
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                <span>Next-Gen Academic Risk Stratification</span>
              </motion.div>

              {/* Bold Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6"
              >
                Proactive Student Success. <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Powered by AI.
                </span>
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                variants={fadeInUp}
                className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-[580px] mb-8 font-medium"
              >
                 Detect dropout risks early. Our calibrated Random Forest classifier evaluates student profiles across 30 socio-demographic and academic features to flag at-risk learners before they disengage.
              </motion.p>

              {/* Portal CTA Actions */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center gap-4"
              >
                {user ? (
                  <Link href={user.role === "admin" ? "/administrator" : "/teacher"}>
                    <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-7 rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer text-sm">
                      <span>Access Dashboard Portal</span>
                      <ArrowRight size={16} />
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/15 transition cursor-pointer text-sm">
                        <GraduationCap size={18} />
                        <span>Teacher Portal</span>
                      </button>
                    </Link>
                    <Link href="/admin-login">
                      <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold py-3.5 px-6 rounded-xl shadow-sm transition cursor-pointer text-sm">
                        <Shield size={18} className="text-indigo-400" />
                        <span>Administrator Portal</span>
                      </button>
                    </Link>
                  </>
                )}
                <button
                  onClick={() => scrollToSection("metrics")}
                  className="text-xs font-bold text-slate-400 hover:text-white transition px-4 py-2 hover:underline cursor-pointer"
                >
                  View Performance Metrics
                </button>
              </motion.div>
            </motion.div>

            {/* Right side Dashboard Visual Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="lg:col-span-5 relative"
            >
              {/* Glowing ring backdrop */}
              <div className="absolute inset-0 bg-indigo-500/10 rounded-[2.5rem] blur-2xl z-0" />

              {/* Glassmorphic Mockup Frame */}
              <div className="relative z-10 bg-slate-900/60 border border-slate-800/80 backdrop-blur-lg rounded-[2rem] p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500/80" />
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Live Prediction Demo</span>
                </div>

                {/* Simulated Student Risk Card */}
                {(() => {
                  const isHighRisk = liveStudent.risk_level === "High-Risk";
                  const isAtRisk = liveStudent.risk_level === "At-Risk";
                  const badgeStyle = isHighRisk 
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                    : isAtRisk 
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                  
                  const probabilityColor = isHighRisk 
                    ? "text-rose-400" 
                    : isAtRisk 
                    ? "text-amber-400" 
                    : "text-emerald-400";
                  
                  const attendanceColor = liveStudent.attendance_rate < 80 
                    ? "text-rose-400" 
                    : liveStudent.attendance_rate < 90 
                    ? "text-amber-400" 
                    : "text-emerald-400";

                  const gpaColor = liveStudent.cgpa < 2.5 
                    ? "text-rose-400" 
                    : liveStudent.cgpa < 3.0 
                    ? "text-amber-400" 
                    : "text-emerald-400";

                  const probPercentage = Math.round(liveStudent.dropout_probability * 100);

                  return (
                    <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400">Student Profile</h4>
                          <span className="text-sm font-extrabold text-white leading-tight">{liveStudent.name}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${badgeStyle}`}>
                          {liveStudent.risk_level}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/40">
                          <div className="text-slate-500 text-[10px]">Attendance Rate</div>
                          <div className={`font-bold ${attendanceColor}`}>{liveStudent.attendance_rate.toFixed(1)}%</div>
                        </div>
                        <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/40">
                          <div className="text-slate-500 text-[10px]">Cumulative GPA</div>
                          <div className={`font-bold ${gpaColor}`}>{liveStudent.cgpa.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Dropout Probability Meter */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>Calculated Probability</span>
                          <span className={`${probabilityColor} font-extrabold`}>{probPercentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                          <motion.div
                            key={liveStudent.name}
                            initial={{ width: 0 }}
                            animate={{ width: `${probPercentage}%` }}
                            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Active Cohorts", val: stats.activeCohorts, icon: Target, col: "text-blue-400" },
                    { label: "Alerts Dispatched", val: stats.alertsDispatched, icon: AlertTriangle, col: "text-amber-400" },
                    { label: "Saved Students", val: stats.savedStudents, icon: CheckCircle, col: "text-emerald-400" }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-center">
                      <stat.icon className={`h-4 w-4 mx-auto mb-1.5 ${stat.col}`} />
                      <div className="text-sm font-black text-white">{stat.val}</div>
                      <div className="text-[9px] font-bold text-slate-500 mt-0.5 leading-none">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════ MODEL ACCURACY & PROOF ════════════════════════ */}
        <section
          id="metrics"
          ref={metricsRef}
          className="relative py-24 px-6 md:px-12 lg:px-20 bg-slate-950/40 border-t border-b border-slate-900/60"
        >
          <div className="max-w-[1200px] mx-auto space-y-16">
            {/* Header Title */}
            <div className="text-center max-w-[650px] mx-auto space-y-3">
              <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">Scientific Rigor</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Model Metrics & Stratification</h2>
              <p className="text-sm text-slate-400">
                Evaluating the mathematical validity and accuracy boundaries of our predictive model. We use calibrated classifiers built for balanced optimization.
              </p>
            </div>

            {/* Performance Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Overall Accuracy", value: "78.5%", desc: "Correct prediction rate across active student data test folds", col: "from-blue-600/25 to-indigo-600/5 border-blue-500/20 text-blue-400" },
                { label: "ROC Area Under Curve", value: "81.0%", desc: "High discriminative power between future dropouts and graduates", col: "from-indigo-600/25 to-purple-600/5 border-indigo-500/20 text-indigo-400" },
                { label: "Classification Model", value: "Random Forest", desc: "Ensemble bagging classifier calibrated using SMOTE balancing techniques", col: "from-emerald-600/25 to-teal-600/5 border-emerald-500/20 text-emerald-400" }
              ].map((m, idx) => (
                <div
                  key={idx}
                  className={`bg-gradient-to-br border rounded-3xl p-8 flex flex-col justify-between h-56 shadow-lg hover:shadow-xl hover:-translate-y-1 transition duration-300 group`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{m.label}</span>
                    <Activity size={16} className={m.col.split(" ")[2]} />
                  </div>
                  <div className="text-4xl font-black text-white py-4 leading-tight group-hover:scale-102 transition origin-left">{m.value}</div>
                  <p className="text-xs text-slate-400 leading-normal">{m.desc}</p>
                </div>
              ))}
            </div>

            {/* The 3-Tier Risk System Visualization */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active Triaging</span>
                <h3 className="text-2xl font-extrabold text-white">Three-Tier Risk Stratification</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Instead of ambiguous decimal ranges, our system partitions risk outcomes into actionable tiers. This allows academic advisors to prioritize students by urgent intervention need.
                </p>
                <div className="pt-2 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span>Calculated periodically at each academic checkpoint</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span>Instantly synced to advisory dashboards</span>
                  </div>
                </div>
              </div>

              {/* Tiers List */}
              <div className="lg:col-span-7 space-y-4">
                {[
                  { label: "High-Risk (Digniin Sare)", pct: "> 70% risk", col: "border-rose-500/20 bg-rose-500/5 text-rose-400", fill: "bg-rose-500", desc: "Urgent intervention required. Academic, demographic, and socioeconomic indicators suggest imminent withdrawal." },
                  { label: "At-Risk (Halis-ku-jira)", pct: "50% - 70% risk", col: "border-amber-500/20 bg-amber-500/5 text-amber-400", fill: "bg-amber-500", desc: "Advisory observation recommended. Attendance or grade drops are starting to negatively impact progress." },
                  { label: "Safe (Habad-la'aan)", pct: "< 50% risk", col: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400", fill: "bg-emerald-500", desc: "Normal educational trajectory. Student maintains healthy GPA records and meets standard attendance rates." }
                ].map((tier, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start shadow-sm transition hover:bg-slate-800/20 ${tier.col}`}
                  >
                    <div className="flex items-center gap-2.5 shrink-0 mt-0.5">
                      <span className={`w-3.5 h-3.5 rounded-full ${tier.fill} shrink-0 shadow-xs`} />
                      <span className="font-extrabold text-sm text-white">{tier.label}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tier.pct}</div>
                      <p className="text-xs text-slate-400 leading-normal font-medium">{tier.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════ HOW IT WORKS / CAPABILITIES ════════════════════════ */}
        <section
          id="how-it-works"
          ref={howItWorksRef}
          className="relative py-24 px-6 md:px-12 lg:px-20"
        >
          <div className="max-w-[1200px] mx-auto space-y-20">
            {/* Header Title */}
            <div className="text-center max-w-[650px] mx-auto space-y-3">
              <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">Capabilities</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Platform Features & Architecture</h2>
              <p className="text-sm text-slate-400">
                Explore the engineering details behind our Student Success system, designed for secure, distributed performance.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {[
                { title: "30-Point Holistic Analysis", desc: "Evaluates comprehensive student profiles including family income, scholarship status, travel distance, attendance, daily study hours, and academic scores.", icon: Layers },
                { title: "Real-Time Teacher Sync", desc: "Enables class instructors to update student attendance grids and input exam scores to instantly trigger risk recalculation.", icon: GraduationCap },
                { title: "Bulk Administrator Imports", desc: "Provides system administrators with instant csv parser loaders to upload entire student catalogs and evaluate cohorts in seconds.", icon: Database },
                { title: "Leak-Proof Architecture", desc: "Separates the Next.js database pipeline from a stateless Python FastAPI ML engine, protecting predictive weights and models.", icon: Server }
              ].map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-3xl p-6 lg:p-8 flex gap-5 hover:bg-slate-900/50 hover:shadow-lg transition duration-200"
                  >
                    <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0 h-fit border border-indigo-500/10 shadow-inner">
                      <Icon size={20} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-white leading-tight">{feat.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Pipeline Flow Visual */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-[2rem] p-8 lg:p-12 space-y-10">
              <h4 className="text-center font-extrabold text-lg text-white uppercase tracking-wider">The System Inference Pipeline</h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                {[
                  { step: "01", title: "Ingest Data", desc: "Educators import student academic histories and demographics via portal spreadsheet uploads." },
                  { step: "02", title: "FastAPI Compute", desc: "Data parameters are securely serialized and parsed to the decoupled ML microservice." },
                  { step: "03", title: "ML Inference", desc: "Random Forest ensemble classifier runs probabilistic evaluations across features." },
                  { step: "04", title: "Active Alerting", desc: "Early warning dashboards trigger alerts to advisors for targeted student intervention." }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-3 relative group">
                    {/* Connecting line on desktop */}
                    {idx < 3 && (
                      <div className="hidden md:block absolute top-7 left-[80%] right-[-20%] h-[1px] bg-slate-800/80 group-hover:bg-indigo-500/40 transition duration-300 z-0" />
                    )}

                    <div className="relative z-10 w-12 h-12 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center font-black text-sm text-indigo-400 group-hover:border-indigo-500/50 shadow-inner transition duration-300">
                      {item.step}
                    </div>
                    <h5 className="text-sm font-extrabold text-white pt-1">{item.title}</h5>
                    <p className="text-xs text-slate-400 leading-normal">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════ FOOTER ════════════════════════ */}
        <footer className="bg-slate-950 border-t border-slate-900/60 py-12 px-6 md:px-12 lg:px-20 text-xs text-slate-500 font-semibold">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-extrabold text-[10px]">
                DS
              </div>
              <span className="text-slate-400 font-black">DropoutSyS &copy; {new Date().getFullYear()}</span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-1">
                <span>Documentation</span>
                <ArrowUpRight size={10} />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
