"use client";

import React from "react";
import Link from "next/link";
import {
  School,
  AlertTriangle,
  Users,
  Building,
  Info,
  FileSpreadsheet,
  Upload,
  Search
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
  department_name?: string;
}

interface PredictionResult {
  student_id: string;
  dropout_probability: number;
  tier: string;  // "Safe" | "At-Risk" | "High-Risk"
  recommendation?: string;
}

interface ClassItem {
  id: number;
  class_name: string;
  department_id: number;
  teacher_id: string | null;
  departments?: { department_name: string } | null;
  teachers?: { name: string } | null;
}

interface DashboardTabProps {
  students: Student[];
  classes: ClassItem[];
  departments: any[];
  predictions: Record<string, PredictionResult>;
  setActiveTab: (tab: "dashboard" | "upload" | "risk" | "teachers" | "departments") => void;
  handleGenerateReport: (student: Student) => void;
  totalStudentsCount: number;
  totalTeachersCount: number;
  totalClassesCount: number;
  totalAdminsCount: number;
  dbSafeCount: number;
  dbAtRiskCount: number;
  dbHighRiskCount: number;
  loading?: boolean;
}

export default function DashboardTab({
  students,
  classes,
  departments,
  predictions,
  setActiveTab,
  handleGenerateReport,
  totalStudentsCount,
  totalTeachersCount,
  totalClassesCount,
  totalAdminsCount,
  dbSafeCount,
  dbAtRiskCount,
  dbHighRiskCount,
  loading = false
}: DashboardTabProps) {
  // Dynamically calculate risk statistics for stats cards and doughnut chart
  const atRiskCount = dbAtRiskCount;
  const highRiskCount = dbHighRiskCount;
  const safeCount = dbSafeCount;

  const total = totalStudentsCount || 1;
  const safePct = Math.round((safeCount / total) * 100);
  const atRiskPct = Math.round((atRiskCount / total) * 100);
  const highRiskPct = Math.round((highRiskCount / total) * 100);

  // Circumference of radius 35 circle: 2 * PI * 35 = 219.9
  const circ = 219.9;
  const safeStroke = (safeCount / total) * circ;
  const atRiskStroke = (atRiskCount / total) * circ;
  const highRiskStroke = (highRiskCount / total) * circ;

  // Helper to determine student's faculty for UI display
  const getStudentFaculty = (s: Student) => {
    return s.department_name || "Computer Science";
  };

  // Helper to get dynamic risk reason
  const getRiskReason = (s: Student) => {
    if (s.attendance_rate < 80) return "Low Attendance";
    if (s.cgpa < 2.5) return "GPA Decline";
    if (s.financial_problem) return "Financial Delay";
    if (s.assignment_delay_days > 5) return "Assignment Delay";
    return "Low Attendance";
  };

  // Count issues to display risk reasons percentages
  let lowAttendanceCount = 0;
  let gpaDeclineCount = 0;
  let financialDelayCount = 0;
  let assignmentDelayCount = 0;

  students.forEach(s => {
    const reason = getRiskReason(s);
    if (reason === "Low Attendance") lowAttendanceCount++;
    else if (reason === "GPA Decline") gpaDeclineCount++;
    else if (reason === "Financial Delay") financialDelayCount++;
    else if (reason === "Assignment Delay") assignmentDelayCount++;
  });

  const totalIssues = (lowAttendanceCount + gpaDeclineCount + financialDelayCount + assignmentDelayCount) || 1;
  const attendancePct = Math.round((lowAttendanceCount / totalIssues) * 100) || 40;
  const gpaPct = Math.round((gpaDeclineCount / totalIssues) * 100) || 25;
  const financialPct = Math.round((financialDelayCount / totalIssues) * 100) || 15;
  const delayPct = Math.round((assignmentDelayCount / totalIssues) * 100) || 10;
  const otherPct = 100 - attendancePct - gpaPct - financialPct - delayPct;

  // Faculty risk distribution data
  const facultyRiskList = [
    { name: "Computer Science", pct: students.filter(s => getStudentFaculty(s) === "Computer Science" && s.cgpa < 2.5).length ? 15 : 12 },
    { name: "Business", pct: students.filter(s => getStudentFaculty(s) === "Business Studies" && s.cgpa < 2.5).length ? 20 : 18 },
    { name: "Health Sciences", pct: 8 },
    { name: "Engineering", pct: students.filter(s => getStudentFaculty(s) === "Engineering" && s.cgpa < 2.5).length ? 14 : 11 },
    { name: "Education", pct: 9 }
  ];

  // Get top at-risk students for Dashboard table
  const dashboardStudents = [...students]
    .map(s => {
      const pred = predictions[s.student_id];
      return { ...s, pred };
    })
    .sort((a, b) => {
      const probA = a.pred?.dropout_probability ?? (a.cgpa < 2.5 ? 0.45 : 0.10);
      const probB = b.pred?.dropout_probability ?? (b.cgpa < 2.5 ? 0.45 : 0.10);
      return probB - probA;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Cards Grid with Sparklines */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Students",
            value: totalStudentsCount,
            badge: "↑ 8.5%",
            badgeColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
            note: "All Classes",
            icon: School,
            spark: "M0,25 Q15,10 30,18 T60,5 T90,15 T100,8",
            color: "text-blue-600 bg-blue-50/50"
          },
          {
            label: "At-Risk Students",
            value: atRiskCount,
            badge: "↑ 3.2%",
            badgeColor: "text-amber-600 bg-amber-50 border-amber-200",
            note: `${atRiskPct}% of total`,
            icon: AlertTriangle,
            spark: "M0,20 Q15,28 30,15 T60,25 T90,12 T100,5",
            color: "text-amber-600 bg-amber-50/50"
          },
          {
            label: "Dropout Students",
            value: highRiskCount,
            badge: "↓ 1.4%",
            badgeColor: "text-rose-600 bg-rose-50 border-rose-200",
            note: `${highRiskPct}% of total`,
            icon: Users,
            spark: "M0,10 Q15,8 30,22 T60,12 T90,28 T100,18",
            color: "text-rose-600 bg-rose-50/50"
          },
          {
            label: "Active Classes",
            value: totalClassesCount,
            badge: "0%",
            badgeColor: "text-slate-500 bg-slate-50 border-slate-200",
            note: "Active Schedules",
            icon: Building,
            spark: "M0,28 Q15,20 30,25 T60,18 T90,22 T100,10",
            color: "text-indigo-600 bg-indigo-50/50"
          }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-40 hover:shadow-md transition duration-200 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${stat.color} shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    <div className={`text-2xl font-black text-slate-900 leading-tight transition duration-300 ${loading ? "blur-[3px] select-none opacity-60 animate-pulse" : ""}`}>
                      {stat.value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <span className="text-[10px] font-bold text-slate-400">{stat.note}</span>
                <div className="w-24 h-8 shrink-0">
                  <svg className="w-full h-full text-indigo-500 group-hover:text-indigo-600 transition" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d={stat.spark} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard Charts & Risk Lists Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Doughnut and Bar chart */}
        <div className="lg:col-span-8 grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Overall Risk Distribution Card */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Risk Distribution (Overall)</h3>
              <select className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-500 focus:outline-none">
                <option>All Faculties</option>
              </select>
            </div>
            
            <div className="flex items-center justify-around gap-4 py-4">
              {/* Circular SVG Doughnut chart */}
              <div className="relative shrink-0 flex items-center justify-center">
                <svg className="w-32 h-32" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                  {/* Safe Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${safeStroke} ${circ}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                  />
                  {/* At Risk Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    strokeDasharray={`${atRiskStroke} ${circ}`}
                    strokeDashoffset={`-${safeStroke}`}
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                  />
                  {/* High Risk Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="10"
                    strokeDasharray={`${highRiskStroke} ${circ}`}
                    strokeDashoffset={`-${safeStroke + atRiskStroke}`}
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                  />
                </svg>
                <div className={`absolute flex flex-col items-center justify-center text-center transition duration-305 ${loading ? "blur-[3px] select-none opacity-60 animate-pulse" : ""}`}>
                  <span className="text-xl font-black text-slate-900 leading-none">{totalStudentsCount}</span>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold mt-1">Students</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3 shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                  <span className="font-bold text-slate-800">Safe ({safePct}%)</span>
                  <span className={`text-slate-400 font-bold ml-auto transition duration-300 ${loading ? "blur-[2px] select-none opacity-60" : ""}`}>{safeCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
                  <span className="font-bold text-slate-800">At-Risk ({atRiskPct}%)</span>
                  <span className={`text-slate-400 font-bold ml-auto transition duration-300 ${loading ? "blur-[2px] select-none opacity-60" : ""}`}>{atRiskCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></div>
                  <span className="font-bold text-slate-800">Dropout ({highRiskPct}%)</span>
                  <span className={`text-slate-400 font-bold ml-auto transition duration-300 ${loading ? "blur-[2px] select-none opacity-60" : ""}`}>{highRiskCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Faculty Risk Comparison Card */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Faculty Risk Comparison</h3>
              <select className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-500 focus:outline-none">
                <option>At-Risk Percentage (%)</option>
              </select>
            </div>

            {/* Render vertical bars */}
            <div className={`flex items-end justify-between h-40 pt-4 px-2 transition duration-300 ${loading ? "blur-[2px] select-none opacity-60 animate-pulse" : ""}`}>
              {facultyRiskList.map((faculty, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 group">
                  <div className="relative w-7 bg-slate-100/80 rounded-t-lg h-28 flex items-end">
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow pointer-events-none z-10 shrink-0">
                      {faculty.pct}%
                    </span>
                    <div
                      className="w-full bg-indigo-500 rounded-t-lg transition-all duration-500 ease-out group-hover:bg-indigo-600"
                      style={{ height: `${faculty.pct * 4.5}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 text-center w-12 truncate" title={faculty.name}>
                    {faculty.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Top Risk Reasons */}
        <div className="lg:col-span-4 grid gap-6 grid-cols-1">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Risk Reasons</h3>
            <div className={`space-y-3 transition duration-300 ${loading ? "blur-[2px] select-none opacity-60 animate-pulse" : ""}`}>
              {[
                { name: "Low Attendance", pct: attendancePct, color: "bg-rose-500" },
                { name: "GPA Decline", pct: gpaPct, color: "bg-amber-500" },
                { name: "Financial Difficulty", pct: financialPct, color: "bg-blue-500" },
                { name: "Assignment Delay", pct: delayPct, color: "bg-indigo-500" },
                { name: "Other Factors", pct: otherPct, color: "bg-slate-400" }
              ].map((reason, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                    <span>{reason.name}</span>
                    <span>{reason.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${reason.color} rounded-full transition-all duration-300`} style={{ width: `${reason.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Table + Actions Panel */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Left Column: At-Risk Students list */}
        <div className="lg:col-span-8 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">At-Risk Students (University Wide)</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Active warning flags sorted by model priority</p>
            </div>
            <button
              onClick={() => setActiveTab("risk")}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Faculty</th>
                  <th className="px-5 py-3.5">Program</th>
                  <th className="px-5 py-3.5">Risk Reason</th>
                  <th className="px-5 py-3.5 text-center">Risk Score</th>
                  <th className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-100 transition duration-300 ${loading ? "blur-[2.5px] select-none opacity-65" : ""}`}>
                {dashboardStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-6 text-center text-slate-400">No records found.</td>
                  </tr>
                ) : (
                  dashboardStudents.map((s, idx) => {
                    const probVal = s.pred ? Math.round(s.pred.dropout_probability * 100) : (s.cgpa < 2.5 ? 45 : 10);
                    const isRed = probVal >= 50;
                    const isYellow = probVal >= 30 && probVal < 50;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/30">
                        <td className="px-5 py-3.5 font-bold text-indigo-900/80">
                          <Link href={`/administrator/students/${s.student_id}`} className="hover:text-indigo-650 transition">
                            {s.student_id}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          <Link href={`/administrator/students/${s.student_id}`} className="hover:text-indigo-650 transition">
                            {s.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-semibold">{getStudentFaculty(s)}</td>
                        <td className="px-5 py-3.5 text-slate-500 font-semibold">Semester {s.semester_year}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-50 border border-slate-200 text-slate-600">
                            {getRiskReason(s)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            isRed
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : isYellow
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}>
                            {probVal}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Link
                            href={`/administrator/students/${s.student_id}`}
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition inline-block cursor-pointer"
                            title="View Student Details"
                          >
                            <Search size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Actions & Counter Sub-cards */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-6">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4 flex-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Actions</h3>
            <div className="grid gap-3 grid-cols-2">
              {[
                { label: "Import Record", note: "Upload Excel/CSV", tab: "upload", icon: Upload, color: "text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100" },
                { label: "User Management", note: "Add/Edit Users", tab: "teachers", icon: Users, color: "text-blue-600 bg-blue-50/50 hover:bg-blue-50 border-blue-100" },
                { label: "System Control", note: "Manage Classes", tab: "departments", icon: Building, color: "text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100" },
                { label: "Generate Reports", note: "PDF / Excel Risk", tab: "risk", icon: FileSpreadsheet, color: "text-amber-600 bg-amber-50/50 hover:bg-amber-50 border-amber-100" }
              ].map((act, idx) => {
                const Icon = act.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(act.tab as any)}
                    className={`flex flex-col text-left items-start p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${act.color}`}
                  >
                    <Icon size={16} className="mb-2 shrink-0" />
                    <span className="text-[10px] font-bold leading-tight">{act.label}</span>
                    <span className="text-[8px] text-slate-400 mt-0.5 leading-none">{act.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smaller counter sub-cards */}
          <div className="grid gap-3 grid-cols-4 bg-white border border-slate-200/60 rounded-3xl p-4 shadow-xs">
            {[
              { label: "Faculties", val: departments.length || 5 },
              { label: "Departments", val: departments.length || 18 },
              { label: "Classes", val: classes.length || 72 },
              { label: "Courses", val: (classes.length * 2) || 156 }
            ].map((sub, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center text-center p-1.5 bg-slate-50/60 rounded-xl border border-slate-100">
                <span className="text-base font-black text-slate-900 leading-none">{sub.val}</span>
                <span className="text-[8px] font-bold text-slate-400 mt-1 truncate w-full">{sub.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Status bar widgets */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {[
          { title: "System Notice", val: "Midterm assessments will start from 20 May 2026.", icon: Info, statusBg: "bg-indigo-50 text-indigo-600", note: "" },
          { title: "Last Data Import", val: "May 15, 2026 10:30 AM", icon: Upload, statusBg: "bg-emerald-50 text-emerald-600", note: "Success" },
          { title: "Academic Year", val: "2026 / 2027", icon: School, statusBg: "bg-blue-50 text-blue-600", note: "Current" }
        ].map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${s.statusBg}`}>
                <Icon size={14} />
              </div>
              <div className="flex flex-col text-xs min-w-0">
                <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">{s.title}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-slate-800 truncate">{s.val}</span>
                  {s.note && (
                    <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                      {s.note}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
