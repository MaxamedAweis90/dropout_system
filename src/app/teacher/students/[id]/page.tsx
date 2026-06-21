"use client";

import React, { useEffect, useState } from "react";
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
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Award
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

interface GradeRecord {
  assignment_1: number;
  midterm: number;
  final_exam: number;
  final_gpa: number;
}

interface AttendanceLog {
  date: string;
  status: "Present" | "Absent";
}

export default function TeacherStudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;
  
  const { user, isMock } = useAuth();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [sharedClass, setSharedClass] = useState<{ id: number; class_name: string } | null>(null);
  const [grades, setGrades] = useState<GradeRecord | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

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

  const verifyAndFetch = async () => {
    setLoading(true);
    try {
      if (isMock) {
        // Mock authorization: allow STU1001-STU1007
        const mockStd = mockStudents[studentId];
        if (mockStd) {
          setAuthorized(true);
          setStudent(mockStd);
          setSharedClass({ id: 301, class_name: "CS-301 Software Engineering" });
          setGrades({ assignment_1: 15, midterm: 24, final_exam: 42, final_gpa: mockStd.cgpa });
          setAttendanceLogs([
            { date: "2026-06-18", status: "Present" },
            { date: "2026-06-19", status: "Present" },
            { date: "2026-06-20", status: "Absent" }
          ]);
        } else {
          setAuthorized(false);
        }
      } else {
        // Database validation: check teacher classes
        const teacherId = user?.teacherId;
        if (!teacherId) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // 1. Get classes assigned to this teacher
        const { data: teacherClasses, error: classError } = await supabase
          .from("classes")
          .select("id, class_name")
          .eq("teacher_id", teacherId);

        if (classError) throw classError;

        const classIds = (teacherClasses || []).map(c => c.id);

        if (classIds.length === 0) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // 2. Check if student is in any of these classes
        const { data: enrollment, error: enrollError } = await supabase
          .from("class_students")
          .select("class_id")
          .eq("student_id", studentId)
          .in("class_id", classIds);

        if (enrollError) throw enrollError;

        if (!enrollment || enrollment.length === 0) {
          // Access Denied: student not in teacher's classes
          setAuthorized(false);
        } else {
          setAuthorized(true);
          
          // Fetch student record
          const { data: stdData, error: stdError } = await supabase
            .from("students")
            .select("*")
            .eq("student_id", studentId)
            .single();

          if (stdError) throw stdError;

          // Find class name that teacher teaches to this student
          const matchedClass = teacherClasses.find(c => c.id === enrollment[0].class_id);
          setSharedClass({
            id: enrollment[0].class_id,
            class_name: matchedClass?.class_name || "Assigned Class"
          });

          // Fetch student grades for this class
          const { data: gradesData } = await supabase
            .from("grades")
            .select("assignment_1, midterm, final_exam, final_gpa")
            .eq("student_id", studentId)
            .eq("class_id", enrollment[0].class_id)
            .single();

          // Fetch student attendance logs for this class
          const { data: attData } = await supabase
            .from("attendance_logs")
            .select("date, status")
            .eq("student_id", studentId)
            .eq("class_id", enrollment[0].class_id)
            .order("date", { ascending: false })
            .limit(10);

          setStudent({
            ...stdData,
            department_name: matchedClass?.class_name.split(" ")[0] || "Waaxda"
          });
          setGrades(gradesData || null);
          setAttendanceLogs((attData as any) || []);
        }
      }
    } catch (err: any) {
      console.error("Error verifying and fetching student details:", err);
      toast.error(err.message || "Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAndFetch();
  }, [studentId, user?.teacherId]);

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

  if (!authorized || !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900">Marin Loo Diiday (Access Denied)</h3>
        <p className="text-xs text-slate-500 mt-1 text-center max-w-md">
          Lama ogola inaad eegto faahfaahinta ardaygan maadaama uusan ku qornayn mid ka mid ah fasallada aad dhigto.
        </p>
        <button
          onClick={() => router.push("/teacher")}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Ku laabo Dashboard-ka</span>
        </button>
      </div>
    );
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
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/teacher")}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Guddiga Macallinka</span>
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">
              Teacher Boundary Protection Active
            </span>
          </div>

          {/* Student Profile Card Banner */}
          <div className="bg-[#0a2569] text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            
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
                  <span>Sannadka {student.semester_year}-aad • Fasalkaaga: {sharedClass?.class_name}</span>
                </p>
              </div>
            </div>

            {/* Live ML status quick view */}
            {student.dropout_probability !== undefined && student.dropout_probability !== null && (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 flex flex-col justify-between items-start min-w-[200px] gap-2">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-none font-mono">Halis Ahaan</span>
                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
                  student.risk_level === "High-Risk" ? "bg-rose-50 text-rose-700 border-rose-200" :
                  student.risk_level === "At-Risk" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {student.risk_level === "High-Risk" ? "High-Risk / Halis Sare" :
                   student.risk_level === "At-Risk" ? "At-Risk / Halis Dhexe" :
                   "Safe / Halis Yar"}
                </span>
                <div className="flex items-baseline gap-1 mt-1 text-white">
                  <span className="text-2xl font-black">{Math.round(student.dropout_probability * 100)}%</span>
                  <span className="text-[10px] text-white/60 font-semibold font-mono">Dropout Probability</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Classroom Performance, Grades & Attendance (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Classroom Gradebook Sheet */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Award size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Buugga Imtixaanaadka (Gradebook Record)</h3>
                </div>

                {grades ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assignment 1</span>
                      <div className="text-xl font-black text-slate-900 mt-1">{grades.assignment_1} <span className="text-[10px] text-slate-400 font-bold">/ 20</span></div>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Midterm Exam</span>
                      <div className="text-xl font-black text-slate-900 mt-1">{grades.midterm} <span className="text-[10px] text-slate-400 font-bold">/ 30</span></div>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Final Exam</span>
                      <div className="text-xl font-black text-slate-900 mt-1">{grades.final_exam} <span className="text-[10px] text-slate-400 font-bold">/ 50</span></div>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Class GPA</span>
                      <div className="text-xl font-black text-indigo-700 mt-1">{grades.final_gpa.toFixed(2)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    Wax dhibco ah looma diiwaangelin ardaygan fasalkaan.
                  </div>
                )}
              </div>

              {/* Attendance Log History */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Calendar size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Kormeerka Xaadirinta (Recent Attendance logs)</h3>
                </div>

                {attendanceLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    Ma jiro xaadirin hore oo loo kaydiyey ardaygan fasalkaan.
                  </div>
                ) : (
                  <div className="overflow-hidden border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 font-semibold text-slate-500">
                        <tr>
                          <th className="px-5 py-3">Taariikhda (Date)</th>
                          <th className="px-5 py-3 text-right">Muuqaalka (Status)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceLogs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3 font-semibold text-slate-650 text-slate-600">{log.date}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                                log.status === "Present"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {log.status === "Present" ? (
                                  <>
                                    <CheckCircle size={10} />
                                    <span>Present</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={10} />
                                    <span>Absent</span>
                                  </>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Academic Summary & Background (Span 5) */}
            <div className="lg:col-span-5 space-y-6">

              {/* ML Early Warning Alert for Teachers */}
              {student.dropout_probability !== undefined && student.dropout_probability !== null && student.dropout_probability >= 0.50 && (
                <div className={`border rounded-3xl p-5 shadow-xs flex items-start gap-3 ${
                  student.risk_level === "High-Risk"
                    ? "bg-rose-50/50 border-rose-100 text-rose-800"
                    : "bg-amber-50/50 border-amber-100 text-amber-800"
                }`}>
                  <div className={`p-2 rounded-xl ${
                    student.risk_level === "High-Risk" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    <ShieldAlert size={16} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      {student.risk_level === "High-Risk" ? "Digniin: Halis Sare (High-Risk)" : "Digniin: Halis Dhexe (At-Risk)"}
                    </h4>
                    <p className="text-xs font-semibold leading-relaxed">
                      {student.risk_level === "High-Risk"
                        ? "Ardaygaan wuxuu ku jiraa xaalad halis sare ah. Fadlan kala shaqee maamulka sidii loo caawin lahaa ardayga."
                        : "Ardaygaan wuxuu u baahan yahay daryeel iyo la socod dheeri ah oo ku aadan waxbarashadiisa."}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Academic Metrics Summary */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <GraduationCap size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Guud ahaan Waxbarashada</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CGPA-da Guud</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{student.cgpa.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Heerka Xaadirista</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{student.attendance_rate.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      Study Hours per Day
                    </span>
                    <span className="font-bold text-slate-900">{student.study_hours_per_day} hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <FileSpreadsheet size={14} className="text-slate-400" />
                      Assignment delay days
                    </span>
                    <span className={`font-bold ${student.assignment_delay_days > 4 ? "text-rose-600" : "text-slate-900"}`}>
                      {student.assignment_delay_days} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Basic Background information */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Background Information</h3>
                </div>

                <div className="space-y-3.5 divide-y divide-slate-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Da'da & Jinsiga</span>
                    <span className="font-bold text-slate-900">{student.age} yrs • {student.gender}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Wifi size={14} className="text-slate-400" />
                      Internet Access
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                      student.internet_access 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : "bg-rose-50 border-rose-200 text-rose-700"
                    }`}>
                      {student.internet_access ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Briefcase size={14} className="text-slate-400" />
                      Part-time Job
                    </span>
                    <span className="font-bold text-slate-800">{student.part_time_job ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Coins size={14} className="text-slate-400" />
                      Scholarship
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                      student.has_scholarship 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                      {student.has_scholarship ? "Active" : "None"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-slate-400" />
                      Parent Education
                    </span>
                    <span className="font-bold text-slate-900">{student.parent_education || "High School"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3">
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
