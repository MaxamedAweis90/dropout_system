"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  BookOpen,
  User,
  GraduationCap,
  Clock,
  Coins,
  Activity,
  Wifi,
  Briefcase,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Calendar,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

interface Student {
  student_id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  family_income: number;
  internet_access: boolean;
  study_hours_per_day: number;
  attendance_rate: number;
  assignment_delay_days: number;
  travel_time_minutes: number;
  part_time_job: boolean;
  has_scholarship: boolean;
  gpa: number;
  semester_gpa: number;
  cgpa: number;
  financial_problem: boolean;
  semester_year: number;
  stress_index?: number;
  parent_education?: string;
  department_name?: string;
  dropout_probability?: number;
  risk_level?: string;
}

interface PredictionResult {
  dropout_probability: number;
  tier: string;  // "Safe" | "At-Risk" | "High-Risk"
  recommendation?: string;
}

interface Enrollment {
  class_name: string;
  teacher_name: string;
}

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;
  
  const { isMock } = useAuth();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPredict, setLoadingPredict] = useState(false);

  // Mock student fallback data with realistic demographics and predictions
  const mockStudents: Record<string, Student> = {
    STU1001: { student_id: "STU1001", name: "Ahmed Hassan", age: 21, gender: "Male", family_income: 4500.0, internet_access: true, study_hours_per_day: 3.5, attendance_rate: 82.5, assignment_delay_days: 2, travel_time_minutes: 25, part_time_job: false, has_scholarship: true, gpa: 3.1, semester_gpa: 3.2, cgpa: 3.1, financial_problem: false, semester_year: 3, department_name: "Computer Science", stress_index: 3.0, parent_education: "Bachelor", dropout_probability: 0.12, risk_level: "Safe" },
    STU1002: { student_id: "STU1002", name: "Fatima Ali", age: 20, gender: "Female", family_income: 1200.0, internet_access: false, study_hours_per_day: 1.0, attendance_rate: 58.0, assignment_delay_days: 8, travel_time_minutes: 45, part_time_job: true, has_scholarship: false, gpa: 1.9, semester_gpa: 1.8, cgpa: 1.9, financial_problem: true, semester_year: 2, department_name: "Computer Science", stress_index: 8.0, parent_education: "High School", dropout_probability: 0.85, risk_level: "High-Risk" },
    STU1003: { student_id: "STU1003", name: "Amina Yusuf", age: 22, gender: "Female", family_income: 2800.0, internet_access: true, study_hours_per_day: 2.0, attendance_rate: 74.0, assignment_delay_days: 4, travel_time_minutes: 15, part_time_job: false, has_scholarship: false, gpa: 2.6, semester_gpa: 2.5, cgpa: 2.6, financial_problem: false, semester_year: 4, department_name: "Business Studies", stress_index: 5.0, parent_education: "High School", dropout_probability: 0.42, risk_level: "Safe" },
    STU1004: { student_id: "STU1004", name: "Mohamed Ibrahim", age: 22, gender: "Male", family_income: 6000.0, internet_access: true, study_hours_per_day: 4.5, attendance_rate: 95.0, assignment_delay_days: 0, travel_time_minutes: 10, part_time_job: false, has_scholarship: true, gpa: 3.8, semester_gpa: 3.9, cgpa: 3.8, financial_problem: false, semester_year: 3, department_name: "Engineering", stress_index: 2.0, parent_education: "PhD", dropout_probability: 0.04, risk_level: "Safe" },
    STU1005: { student_id: "STU1005", name: "Hassan Omar", age: 20, gender: "Male", family_income: 3200.0, internet_access: true, study_hours_per_day: 2.5, attendance_rate: 80.0, assignment_delay_days: 1, travel_time_minutes: 20, part_time_job: true, has_scholarship: false, gpa: 2.9, semester_gpa: 2.8, cgpa: 2.9, financial_problem: false, semester_year: 2, department_name: "Engineering", stress_index: 4.0, parent_education: "Bachelor", dropout_probability: 0.28, risk_level: "Safe" },
    STU1006: { student_id: "STU1006", name: "Halima Ali", age: 23, gender: "Female", family_income: 1800.0, internet_access: true, study_hours_per_day: 1.5, attendance_rate: 65.0, assignment_delay_days: 5, travel_time_minutes: 35, part_time_job: false, has_scholarship: true, gpa: 2.2, semester_gpa: 2.1, cgpa: 2.2, financial_problem: true, semester_year: 4, department_name: "Business Studies", stress_index: 6.0, parent_education: "High School", dropout_probability: 0.55, risk_level: "At-Risk" },
    STU1007: { student_id: "STU1007", name: "Ali Salad", age: 24, gender: "Male", family_income: 900.0, internet_access: false, study_hours_per_day: 0.5, attendance_rate: 45.0, assignment_delay_days: 10, travel_time_minutes: 50, part_time_job: true, has_scholarship: false, gpa: 1.5, semester_gpa: 1.4, cgpa: 1.5, financial_problem: true, semester_year: 1, department_name: "Computer Science", stress_index: 9.0, parent_education: "High School", dropout_probability: 0.92, risk_level: "High-Risk" }
  };

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      if (isMock) {
        const mockStd = mockStudents[studentId] || {
          student_id: studentId,
          name: "Arday Loo Tanaasulay (Demo)",
          age: 21,
          gender: "Male",
          family_income: 3000.0,
          internet_access: true,
          study_hours_per_day: 3.0,
          attendance_rate: 85.0,
          assignment_delay_days: 2,
          travel_time_minutes: 20,
          part_time_job: false,
          has_scholarship: false,
          gpa: 3.0,
          semester_gpa: 2.9,
          cgpa: 3.0,
          financial_problem: false,
          semester_year: 2,
          department_name: "Computer Science",
          stress_index: 3.0,
          parent_education: "High School",
          dropout_probability: 0.15,
          risk_level: "Safe"
        };
        setStudent(mockStd);
        setEnrollments([
          { class_name: "CS-301 Software Engineering", teacher_name: "Dr. Abdi Noor" },
          { class_name: "CS-302 Web Development", teacher_name: "Prof. Halima Salad" }
        ]);
        if (mockStd.dropout_probability !== undefined && mockStd.risk_level) {
          setPrediction({
            dropout_probability: mockStd.dropout_probability,
            tier: mockStd.risk_level,
            recommendation: mockStd.risk_level === "High-Risk"
              ? "High-Risk: High dropout risk detected. Urgently schedule direct administrative and counselor meetings."
              : mockStd.risk_level === "At-Risk"
              ? "At-Risk: Check-in with student. Recommend academic tutoring or peer study groups."
              : "Safe: Student performance is stable. Continue standard academic pathway."
          });
        } else {
          await predictRisk(mockStd);
        }
      } else {
        // Query database
        const { data: stdData, error: stdError } = await supabase
          .from("students")
          .select("*")
          .eq("student_id", studentId)
          .single();

        if (stdError) throw stdError;

        if (stdData) {
          // Get class and teacher enrollment
          const { data: classStudentsData } = await supabase
            .from("class_students")
            .select(`
              classes (
                class_name,
                teachers (
                  name
                ),
                departments (
                  department_name
                )
              )
            `)
            .eq("student_id", studentId);

          const enrolls: Enrollment[] = [];
          let detectedDeptName = "";

          if (classStudentsData) {
            classStudentsData.forEach((cs: any) => {
              if (cs.classes) {
                enrolls.push({
                  class_name: cs.classes.class_name,
                  teacher_name: cs.classes.teachers?.name || "Lama u dhiibin"
                });
                if (cs.classes.departments?.department_name) {
                  detectedDeptName = cs.classes.departments.department_name;
                }
              }
            });
          }

          const enrichedStudent: Student = {
            ...stdData,
            department_name: detectedDeptName || "Computer Science"
          };

          setStudent(enrichedStudent);
          setEnrollments(enrolls);

          // Use saved database prediction immediately if available to prevent empty probability flashes
          if (
            enrichedStudent.dropout_probability !== null &&
            enrichedStudent.dropout_probability !== undefined &&
            enrichedStudent.risk_level
          ) {
            setPrediction({
              dropout_probability: enrichedStudent.dropout_probability,
              tier: enrichedStudent.risk_level,
              recommendation: enrichedStudent.risk_level === "High-Risk"
                ? "High-Risk: High dropout risk detected. Urgently schedule direct administrative and counselor meetings."
                : enrichedStudent.risk_level === "At-Risk"
                ? "At-Risk: Check-in with student. Recommend academic tutoring or peer study groups."
                : "Safe: Student performance is stable. Continue standard academic pathway."
            });
          } else {
            await predictRisk(enrichedStudent);
          }
        } else {
          toast.error("Ardayga laguma helin xogta!");
          router.push("/administrator");
        }
      }
    } catch (err: any) {
      console.error("Error fetching student details:", err);
      toast.error(err.message || "Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  const predictRisk = async (record: Student) => {
    setLoadingPredict(true);
    try {
      const normalizeDept = (deptName: string): string => {
        const lower = deptName.toLowerCase();
        if (lower.includes("computer") || lower.includes("cs")) return "CS";
        if (lower.includes("business") || lower.includes("admin")) return "Business";
        if (lower.includes("engineering")) return "Engineering";
        if (lower.includes("science")) return "Science";
        if (lower.includes("art")) return "Arts";
        return "CS";
      };

      const normalizedDept = normalizeDept(record.department_name || "CS");

      const res = await fetch("/api/predict/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: record.age,
          gender: record.gender,
          family_income: record.family_income,
          internet_access: record.internet_access,
          study_hours_per_day: record.study_hours_per_day,
          attendance_rate: record.attendance_rate,
          assignment_delay_days: record.assignment_delay_days,
          travel_time_minutes: record.travel_time_minutes,
          part_time_job: record.part_time_job,
          has_scholarship: record.has_scholarship,
          gpa: record.gpa,
          semester_gpa: record.semester_gpa,
          cgpa: record.cgpa,
          financial_problem: record.financial_problem,
          semester_year: record.semester_year,
          stress_index: record.stress_index ?? 3.0,
          parent_education: record.parent_education || "High School",
          department: normalizedDept
        })
      });

      if (!res.ok) {
        throw new Error(`Proxy returned status ${res.status}`);
      }

      const result = await res.json();
      setPrediction({
        dropout_probability: result.dropout_probability,
        tier: result.tier || "Safe",
        recommendation: result.recommendation
      });

      // Update predictions directly in Supabase to keep all views synchronized
      if (!isMock) {
        await supabase
          .from("students")
          .update({
            dropout_probability: result.dropout_probability,
            risk_level: result.tier || "Safe"
          })
          .eq("student_id", record.student_id);
      }
    } catch (err: any) {
      console.warn("Prediction API failed, using client fallback:", err);
      // Client-side math fallback matching API route logic
      const attFactor = (100 - record.attendance_rate) / 100;
      const gpaFactor = (4.0 - record.cgpa) / 4.0;
      const studyFactor = Math.max(0, (4.0 - record.study_hours_per_day) / 4.0);
      const delayFactor = Math.min(1.0, record.assignment_delay_days / 14.0);

      let prob = (attFactor * 0.35) + (gpaFactor * 0.25) + (studyFactor * 0.15) + (delayFactor * 0.15);
      if (record.financial_problem) prob += 0.15;
      if (record.part_time_job) prob += 0.05;
      if (record.has_scholarship) prob -= 0.10;
      if (!record.internet_access) prob += 0.05;
      if (record.family_income < 2000) prob += 0.05;
      if (record.travel_time_minutes > 45) prob += 0.05;

      prob = Math.max(0.02, Math.min(0.98, prob));

      let tier = "Safe";
      let rec = "Safe: Student performance is stable. Continue standard academic pathway.";

      if (prob >= 0.70) {
        rec = "High-Risk: High dropout risk detected. Urgently schedule direct administrative and counselor meetings.";
        tier = "High-Risk";
      } else if (prob >= 0.50) {
        rec = "At-Risk: Check-in with student. Recommend academic tutoring or peer study groups.";
        tier = "At-Risk";
      }

      setPrediction({
        dropout_probability: prob,
        tier: tier,
        recommendation: rec
      });

      // Update predictions directly in Supabase to keep all views synchronized
      if (!isMock) {
        await supabase
          .from("students")
          .update({
            dropout_probability: prob,
            risk_level: tier
          })
          .eq("student_id", record.student_id);
      }
    } finally {
      setLoadingPredict(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="space-y-6 max-w-4xl w-full animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-40 bg-slate-200 rounded-3xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 rounded-3xl"></div>
            <div className="h-64 bg-slate-200 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Cillad Baa Dhacday</h3>
        <p className="text-xs text-slate-500 mt-1">Natiijooyin ardayga ah lama helin.</p>
        <button
          onClick={() => router.push("/administrator")}
          className="mt-6 flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Ku laabo Dashboard-ka</span>
        </button>
      </div>
    );
  }

  // Define prediction badge colors
  let badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let badgeText = "Safe / Halis Yar";
  
  if (prediction) {
    if (prediction.tier === "High-Risk") {
      badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
      badgeText = "High-Risk / Halis Sare";
    } else if (prediction.tier === "At-Risk") {
      badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
      badgeText = "At-Risk / Halis Dhexe";
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-8"
      >
        <Toaster position="top-right" />
        
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Action Row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/administrator")}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Guddiga Maamulka</span>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">
                Xogta Ardayga
              </span>
            </div>
          </div>

          {/* Student Profile Card Banner */}
          <div className="bg-[#0a2569] text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Ambient glows inside card */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0">
                <User size={32} className="text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight">{student.name}</h1>
                  <span className="bg-white/15 border border-white/15 px-3 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold">
                    {student.student_id}
                  </span>
                </div>
                <p className="text-xs text-white/70 font-semibold flex items-center gap-1.5">
                  <GraduationCap size={14} />
                  <span>Waaxda: {student.department_name} • Sannadka {student.semester_year}-aad</span>
                </p>
              </div>
            </div>

            {/* Live ML status quick view */}
            {prediction && (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 flex flex-col justify-between items-start min-w-[200px] gap-2">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-none">Halis Ahaan</span>
                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase border ${badgeBg}`}>
                  {badgeText}
                </span>
                <div className="flex items-baseline gap-1 mt-1 text-white">
                  <span className="text-2xl font-black">{Math.round(prediction.dropout_probability * 100)}%</span>
                  <span className="text-[10px] text-white/60 font-semibold">Dropout Probability</span>
                </div>
              </div>
            )}
          </div>

          {/* Grid Layout: ML Prediction on top / details below */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Early Warning Machine Learning Card (Left: span 7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Machine Learning Prediction</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Saadaalinta halista ka-haridda ee model-ka ML</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => predictRisk(student)}
                    disabled={loadingPredict}
                    className="p-2 border border-slate-200 hover:border-indigo-500 rounded-xl text-slate-500 hover:text-indigo-600 transition shadow-2xs hover:bg-slate-50/50 cursor-pointer disabled:cursor-not-allowed"
                    title="Cusboonaysii Saadaalinta"
                  >
                    <RefreshCw size={14} className={loadingPredict ? "animate-spin" : ""} />
                  </button>
                </div>

                {loadingPredict ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent"></div>
                    <span className="text-xs font-bold text-slate-500">Waa la falanqaynayaa ardayga...</span>
                  </div>
                ) : prediction ? (
                  <div className="space-y-6">
                    {/* Big risk indicator layout */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
                      
                      {/* Doughnut metric */}
                      <div className="relative shrink-0 flex items-center justify-center">
                        <svg className="w-24 h-24" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke={prediction.tier === "High-Risk" ? "#f43f5e" : prediction.tier === "At-Risk" ? "#f59e0b" : "#10b981"}
                            strokeWidth="8"
                            strokeDasharray={`${prediction.dropout_probability * 238.76} 238.76`}
                            transform="rotate(-90 50 50)"
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-xl font-black text-slate-900 leading-none">{Math.round(prediction.dropout_probability * 100)}%</span>
                          <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold mt-1">Halis</span>
                        </div>
                      </div>

                      {/* Text warning summary */}
                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase border ${badgeBg}`}>
                          {badgeText}
                        </span>
                        <h4 className="text-xs font-black text-slate-800 leading-tight">
                          {prediction.dropout_probability >= 0.70
                            ? "Ardaygaan wuxuu ku jiraa xaalad Digniin ah!"
                            : prediction.dropout_probability >= 0.50
                            ? "Ardaygaan wuxuu u baahan yahay daryeel"
                            : "Xaaladda Waxbarasho ee ardaygaan waa mid Deggan"}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                          Falanqayntu waxay ku salaysan tahay xogta guud ee GPA-da, heerka xaadirista, dib u dhaca assignments-ka, iyo heerka dhaqaale.
                        </p>
                      </div>
                    </div>

                    {/* Progress representation */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Safe (0%)</span>
                        <span>At-Risk (50%)</span>
                        <span>High Risk (70%+)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex relative">
                        <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-slate-300 z-10"></div>
                        <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-slate-300 z-10"></div>
                        <div 
                          style={{ width: `${prediction.dropout_probability * 100}%` }}
                          className={`h-full transition-all duration-500 ${
                            prediction.tier === "High-Risk"
                              ? "bg-gradient-to-r from-amber-500 to-rose-600" 
                              : prediction.tier === "At-Risk"
                              ? "bg-gradient-to-r from-emerald-500 to-amber-500" 
                              : "bg-emerald-500"
                          }`}
                        ></div>
                      </div>
                    </div>

                    {/* Recommendation details */}
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        prediction.tier === "High-Risk"
                          ? "bg-rose-50 text-rose-600" 
                          : prediction.tier === "At-Risk"
                          ? "bg-amber-50 text-amber-600" 
                          : "bg-emerald-50 text-emerald-600"
                      }`}>
                        <ShieldAlert size={16} />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900">Talooyinka Model-ka ee ku aadan Ardayga:</h5>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {prediction.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Ma jiro saadaalin la heli karo.
                  </div>
                )}
              </div>

              {/* Course & Teacher Enrollments Card */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <BookOpen size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Koorsooyinka uu Iska Diiwaangaliyey</h3>
                </div>
                
                {enrollments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                    Ma jiraan fasallo uu ku qoran yahay ardaygaan.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {enrollments.map((enroll, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <BookOpen size={14} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{enroll.class_name}</div>
                            <div className="text-[10px] text-slate-400 font-bold">Macallinka Baraya</div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                          {enroll.teacher_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Student Stats & Background details (Right: span 5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Academic Performance Card */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <GraduationCap size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Academic Performance</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cumulative GPA (CGPA)</span>
                    <div className="text-2xl font-black text-slate-950 mt-1.5">{student.cgpa.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400 font-bold mt-1">out of 4.00</div>
                  </div>
                  
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                    <div className="text-2xl font-black text-slate-950 mt-1.5">{student.attendance_rate.toFixed(1)}%</div>
                    <div className="text-[9px] text-slate-400 font-bold mt-1">Minimum target 80%</div>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Sem GPA</span>
                    <div className="text-lg font-black text-slate-800 mt-1">{student.gpa.toFixed(2)}</div>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Previous Sem GPA</span>
                    <div className="text-lg font-black text-slate-800 mt-1">{student.semester_gpa.toFixed(2)}</div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-450 text-slate-400" />
                      Xilliga Barashada
                    </span>
                    <span className="font-bold text-slate-900">{student.study_hours_per_day} saac / maalintii</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <FileSpreadsheet size={14} className="text-slate-450 text-slate-400" />
                      Dib u dhaca Assignments-ka
                    </span>
                    <span className={`font-bold ${student.assignment_delay_days > 4 ? "text-rose-600" : "text-slate-900"}`}>
                      {student.assignment_delay_days} maalmood
                    </span>
                  </div>
                </div>
              </div>

              {/* Demographics & Socio-Economic Card */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Socio-Economic Background</h3>
                </div>
                
                <div className="space-y-3.5 divide-y divide-slate-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Da'da & Jinsiga</span>
                    <span className="font-bold text-slate-900">{student.age} jir • {student.gender}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Coins size={14} className="text-slate-400" />
                      Dhaqaalaha Qoyska (Income)
                    </span>
                    <span className="font-bold text-slate-900">${student.family_income.toLocaleString()} / sem</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Wifi size={14} className="text-slate-400" />
                      Helitaanka Internet-ka
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                      student.internet_access 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : "bg-rose-50 border-rose-200 text-rose-700"
                    }`}>
                      {student.internet_access ? "Haa" : "Maya"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Briefcase size={14} className="text-slate-400" />
                      Shaqo Dheeraad ah (Part-time Job)
                    </span>
                    <span className={`font-bold text-slate-800`}>
                      {student.part_time_job ? "Haa" : "Maya"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Coins size={14} className="text-slate-400" />
                      Deeq Waxbarasho (Scholarship)
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                      student.has_scholarship 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                      {student.has_scholarship ? "Wuxuu Haystaa" : "Lama siin"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-slate-400" />
                      Dhibaatooyin Dhaqaale
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                      student.financial_problem 
                        ? "bg-rose-50 border-rose-200 text-rose-700" 
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    }`}>
                      {student.financial_problem ? "Haa" : "Maya"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      Socodka Jaamacadda (Travel Time)
                    </span>
                    <span className="font-bold text-slate-900">{student.travel_time_minutes} daqiiqo</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-slate-400" />
                      Heerka Waxbarasho Ee Waalidka
                    </span>
                    <span className="font-bold text-slate-900">{student.parent_education || "High School"}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-slate-400" />
                      Stress Index (0-10)
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                      (student.stress_index ?? 3.0) >= 7
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : (student.stress_index ?? 3.0) >= 5
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    }`}>
                      {student.stress_index ?? 3.0} / 10
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
