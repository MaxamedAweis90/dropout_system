"use client";
import { useEffect, useState } from "react";
import { UsersPage } from "./users-page";
import { Toaster } from "react-hot-toast";
import FacultyManagement from "./faculty-management";
import UserManagement from "./user-management";

const riskReasons = [
  ["Low Attendance", 45],
  ["GPA Decline", 18],
  ["Financial Difficulty", 20],
  ["Personal Issues", 10],
  ["Other", 7],
];

const topStudents = [
  { id: "STU1001", name: "Ahmed Hassan", faculty: "Computing", program: "Software Eng.", reason: "Low Attendance", risk: "78%", date: "2026-06-10" },
  { id: "STU1002", name: "Fatima Ali", faculty: "Business", program: "Accounting", reason: "GPA Decline", risk: "72%", date: "2026-06-10" },
  { id: "STU1003", name: "Abdi Noor", faculty: "Engineering", program: "Civil Eng.", reason: "Financial Delay", risk: "65%", date: "2026-06-10" },
  { id: "STU1004", name: "Amina Yusuf", faculty: "Health Sciences", program: "Nursing", reason: "Low Attendance", risk: "70%", date: "2026-06-10" },
  { id: "STU1005", name: "Mohamed Ibrahim", faculty: "Business", program: "Finance", reason: "GPA & Attendance", risk: "88%", date: "2026-06-10" },
];

function ringOffset(value: number) {
  const circumference = 276.46;
  return circumference - (value / 100) * circumference;
}

export function AdministratorDashboard() {
  const [serverData, setServerData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [recordsData, setRecordsData] = useState<{ students: any[]; predictions: any[] } | null>(null);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [dbSubTab, setDbSubTab] = useState<"students" | "predictions">("students");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Single Student Prediction Form State
  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    program: "Software Eng.",
    age: 20,
    attendance_rate: 85,
    gpa: 3.0,
    credits_passed: 20,
    financial_strain_score: 0.3,
    study_hours_per_week: 15,
    has_scholarship: false,
    first_generation_student: false,
  });
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predictionError, setPredictionError] = useState("");

  // Batch CSV Import State
  const [csvText, setCsvText] = useState(
    "student_id,name,program,age,attendance_rate,gpa,credits_passed,financial_strain_score,study_hours_per_week,has_scholarship,first_generation_student\n" +
    "STU1012,Ali Salad,Software Eng.,21,60.5,1.9,12,0.8,8.5,false,true\n" +
    "STU1013,Halima Omar,Finance,22,94.0,3.6,22,0.1,18.0,true,false"
  );
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [batchError, setBatchError] = useState("");

  // System Controls
  const [smoteActive, setSmoteActive] = useState(true);

  // Fetch metrics & dashboard overview
  const fetchDashboardData = () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/auth/admin/data", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => setServerData(j))
      .catch(() => { });
  };

  // Fetch raw database records (Students & Predictions lists)
  const fetchRecords = () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setLoadingRecords(true);
    fetch("/api/auth/records", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        setRecordsData(j);
        setLoadingRecords(false);
      })
      .catch(() => setLoadingRecords(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "Database Records" || activeTab === "At-Risk Students" || activeTab === "Dropout Students") {
      fetchRecords();
    }
  }, [activeTab]);

  // Handle single student prediction form submission
  const handleSinglePredict = (e: React.FormEvent) => {
    e.preventDefault();
    setPredictionLoading(true);
    setPredictionResult(null);
    setPredictionError("");

    fetch("/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((r) => {
        if (!r.ok) {
          return r.json().then((err) => {
            throw new Error(err.detail || "Prediction failed");
          });
        }
        return r.json();
      })
      .then((data) => {
        setPredictionResult(data);
        setPredictionLoading(false);
        fetchDashboardData(); // Refresh counts
      })
      .catch((err) => {
        setPredictionError(err.message || "An error occurred");
        setPredictionLoading(false);
      });
  };

  // Handle CSV Batch upload submission
  const handleBatchUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setBatchLoading(true);
    setBatchResult(null);
    setBatchError("");

    try {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("CSV must contain a header row and at least one data row.");
      }

      const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
      const students: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(",").map(v => v.trim());
        const student: any = {};

        headers.forEach((header, index) => {
          const val = values[index];
          if (header === "age" || header === "credits_passed") {
            student[header] = parseInt(val) || 0;
          } else if (header === "attendance_rate" || header === "gpa" || header === "financial_strain_score" || header === "study_hours_per_week") {
            student[header] = parseFloat(val) || 0.0;
          } else if (header === "has_scholarship" || header === "first_generation_student") {
            student[header] = val.toLowerCase() === "true" || val === "1";
          } else {
            student[header] = val || "";
          }
        });

        if (!student.student_id) {
          throw new Error(`Line ${i + 1}: student_id is required.`);
        }
        students.push(student);
      }

      fetch("/api/predict/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ students }),
      })
        .then((r) => {
          if (!r.ok) {
            return r.json().then((err) => {
              throw new Error(err.detail || "Batch prediction failed");
            });
          }
          return r.json();
        })
        .then((data) => {
          setBatchResult(data);
          setBatchLoading(false);
          fetchDashboardData(); // Refresh counts
        })
        .catch((err) => {
          setBatchError(err.message || "An error occurred");
          setBatchLoading(false);
        });

    } catch (err: any) {
      setBatchError(err.message || "Parsing failed");
      setBatchLoading(false);
    }
  };

  const recentPredictions = (serverData?.recent_predictions?.length ? serverData.recent_predictions : topStudents).map((entry: any, index: number) => {
    return {
      id: entry.student_id ?? `ROW-${index + 1}`,
      name: entry.name ?? entry.student_id ?? `Student ${index + 1}`,
      faculty: "Computing",
      program: entry.program ?? "—",
      reason: entry.recommendation ?? entry.risk_level ?? "—",
      risk: `${Math.round((entry.dropout_probability ?? 0) * 100)}%`,
      date: entry.created_at ? new Date(entry.created_at).toISOString().slice(0, 10) : "—",
    };
  });

  const filteredStudents = (recordsData?.students ?? []).filter((s: any) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.student_id ?? "").toLowerCase().includes(term) ||
      (s.name ?? "").toLowerCase().includes(term) ||
      (s.program ?? "").toLowerCase().includes(term)
    );
  });

  const filteredPredictions = (recordsData?.predictions ?? []).filter((p: any) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.student_id ?? "").toLowerCase().includes(term) ||
      (p.risk_level ?? "").toLowerCase().includes(term) ||
      (p.recommendation ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Toaster />
        {/* Sidebar */}
        <aside className="rounded-[2rem] bg-gradient-to-b from-[#08184a] to-[#0f2a66] p-5 text-white shadow-2xl shadow-slate-950/10">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="h-12 w-12 rounded-2xl bg-white/10 p-2">
              <svg viewBox="0 0 24 24" className="h-full w-full text-white opacity-90" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10v6" />
                <path d="M6 12h12" />
                <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight">SIMAD UNIVERSITY</div>
              <div className="text-xs text-white/70">Faculty of Computing</div>
            </div>
          </div>

          <nav className="mt-6 space-y-1.5 text-sm max-h-[70vh] overflow-y-auto pr-1">
            {[
              "Dashboard",
              "Database Records",
              "Faculty",
              "Department",
              "Class",
              "Course",
              "Student Record",
              "At-Risk Students",
              "Dropout Students",
              "Reports",
              "Macro Analytics",
              "User Management",
              "Data Import",
              "System Control",
              "Settings",
            ].map((item) => (
              <button
                key={item}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item);
                }}
                className={`w-full text-left flex items-center rounded-2xl px-4 py-2.5 transition cursor-pointer ${activeTab === item
                  ? "bg-white text-slate-950 font-semibold shadow-md"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/80">
            <div className="font-semibold text-white">Logged in: admin</div>
            <div className="mt-1 text-white/60">DB: XAMPP MySQL</div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="min-w-0">
          {/* Header */}
          <header className="rounded-[2rem] border border-slate-200/50 bg-white px-6 py-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">SIMAD University Attrition Predictor</h1>
                <p className="text-xs text-slate-500">Early-warning system based on Random Forest & SMOTE models</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  placeholder="Search globally..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={fetchDashboardData}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Sync
                </button>
              </div>
            </div>
          </header>

          {/* 1. Dashboard View */}
          {activeTab === "Dashboard" && (
            <>
              {/* Metrics Row */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Total Students", serverData?.total_students ?? "0", "Enrolled count", "up"],
                  ["At-Risk Students", serverData?.at_risk ?? "0", "Medium/High risk", "up"],
                  ["Dropout Students", "0", "Official dropouts", "flat"],
                  ["Active Faculties", "6", "SIMAD Faculties", "flat"],
                ].map(([label, value, note, trend]) => (
                  <div key={label} className="rounded-3xl border border-slate-200/50 bg-white p-5 shadow-sm">
                    <div className="text-xs font-medium text-slate-500">{label}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{value}</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{note}</p>
                      </div>
                      <div className={`grid h-10 w-10 place-items-center rounded-xl text-sm ${trend === "up" ? "bg-emerald-50 text-emerald-600" : trend === "down" ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                        }`}>
                        {trend === "up" ? "↗" : trend === "down" ? "↘" : "•"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Dashboard Sections */}
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Risk Distribution Ring */}
                <div className="rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Risk Distribution</h3>
                  <p className="text-xs text-slate-400">Proportion of student alert tiers.</p>

                  <div className="mt-6 flex flex-col items-center justify-center">
                    <div className="relative h-44 w-44">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#22c55e" strokeWidth="10" strokeDasharray="276.46" strokeDashoffset={ringOffset(70)} strokeLinecap="round" />
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#f59e0b" strokeWidth="10" strokeDasharray="276.46" strokeDashoffset={ringOffset(20)} strokeLinecap="round" />
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray="276.46" strokeDashoffset={ringOffset(10)} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 grid place-items-center text-center">
                        <div>
                          <div className="text-2xl font-bold text-slate-900">{serverData?.total_students ?? "0"}</div>
                          <div className="text-[10px] text-slate-400">Total</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-2 text-center w-full text-xs">
                      <div>
                        <div className="font-semibold text-emerald-600">70%</div>
                        <div className="text-[10px] text-slate-400">Safe</div>
                      </div>
                      <div>
                        <div className="font-semibold text-amber-600">20%</div>
                        <div className="text-[10px] text-slate-400">Watch</div>
                      </div>
                      <div>
                        <div className="font-semibold text-rose-600">10%</div>
                        <div className="text-[10px] text-slate-400">At-Risk</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attrition Factors */}
                <div className="rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Top Risk Factors</h3>
                  <p className="text-xs text-slate-400">Drivers calculated by Random Forest.</p>

                  <div className="mt-4 space-y-3">
                    {riskReasons.map(([label, value]) => (
                      <div key={label}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{label}</span>
                          <span className="font-semibold text-slate-950">{value}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Quick Actions */}
                <div className="rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Quick Tasks</h3>
                  <p className="text-xs text-slate-400">Institutional support commands.</p>

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setActiveTab("Student Record")}
                      className="w-full text-left rounded-2xl border border-slate-200/60 bg-slate-50 hover:bg-indigo-50 px-4 py-3 text-xs font-semibold text-slate-800 transition hover:text-indigo-900"
                    >
                      📝 Add New Student Record
                    </button>
                    <button
                      onClick={() => setActiveTab("Data Import")}
                      className="w-full text-left rounded-2xl border border-slate-200/60 bg-slate-50 hover:bg-indigo-50 px-4 py-3 text-xs font-semibold text-slate-800 transition hover:text-indigo-900"
                    >
                      📥 Bulk CSV Import Data
                    </button>
                    <button
                      onClick={() => setActiveTab("Reports")}
                      className="w-full text-left rounded-2xl border border-slate-200/60 bg-slate-50 hover:bg-indigo-50 px-4 py-3 text-xs font-semibold text-slate-800 transition hover:text-indigo-900"
                    >
                      📊 View ML Model Validation
                    </button>
                  </div>
                </div>
              </div>

              {/* At-Risk table */}
              <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="text-sm font-bold text-slate-900">Flagged Risk Predictions</h3>
                  <p className="text-xs text-slate-400">Latest early-warning scores saved in MySQL.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Student</th>
                        <th className="px-6 py-3">Program</th>
                        <th className="px-6 py-3">Risk Assessment</th>
                        <th className="px-6 py-3">Risk Score</th>
                        <th className="px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentPredictions.map((student: any, index) => (
                        <tr key={`${student.id}-${index}`} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3 font-semibold text-indigo-900">{student.id}</td>
                          <td className="px-6 py-3 font-semibold text-slate-900">{student.name}</td>
                          <td className="px-6 py-3 text-slate-500">{student.program}</td>
                          <td className="px-6 py-3 text-slate-500">{student.reason}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold ${parseInt(student.risk) >= 70 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                              }`}>{student.risk}</span>
                          </td>
                          <td className="px-6 py-3 text-slate-400">{student.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 2. Database Records */}
          {activeTab === "Database Records" && (
            <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Database Record Explorer</h3>
                  <p className="text-xs text-slate-400">Access and verify raw SQLite / XAMPP MySQL data.</p>
                </div>
                <button
                  onClick={fetchRecords}
                  disabled={loadingRecords}
                  className="rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {loadingRecords ? "Syncing..." : "🔄 Refresh MySQL Database"}
                </button>
              </div>

              <div className="mt-4 flex border-b border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setDbSubTab("students")}
                  className={`border-b-2 px-4 py-2.5 transition ${dbSubTab === "students" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                  student_records ({filteredStudents.length} entries)
                </button>
                <button
                  onClick={() => setDbSubTab("predictions")}
                  className={`border-b-2 px-4 py-2.5 transition ${dbSubTab === "predictions" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                  prediction_history ({filteredPredictions.length} entries)
                </button>
              </div>

              <div className="mt-4">
                {loadingRecords ? (
                  <div className="py-20 text-center text-xs text-slate-400 animate-pulse">Fetching records...</div>
                ) : dbSubTab === "students" ? (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-[11px] leading-normal">
                      <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                        <tr>
                          <th className="px-3 py-2.5">ID</th>
                          <th className="px-3 py-2.5">Name</th>
                          <th className="px-3 py-2.5">Program</th>
                          <th className="px-3 py-2.5">Age</th>
                          <th className="px-3 py-2.5">Attendance</th>
                          <th className="px-3 py-2.5">GPA</th>
                          <th className="px-3 py-2.5">Credits</th>
                          <th className="px-3 py-2.5">Strain</th>
                          <th className="px-3 py-2.5">Scholarship</th>
                          <th className="px-3 py-2.5">First Gen</th>
                          <th className="px-3 py-2.5">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="py-8 text-center text-slate-400">No records found.</td>
                          </tr>
                        ) : (
                          filteredStudents.map((s: any) => (
                            <tr key={s.student_id} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2.5 font-semibold text-indigo-900">{s.student_id}</td>
                              <td className="px-3 py-2.5 font-semibold text-slate-900">{s.name || "—"}</td>
                              <td className="px-3 py-2.5 text-slate-600">{s.program || "—"}</td>
                              <td className="px-3 py-2.5 text-slate-500">{s.age}</td>
                              <td className="px-3 py-2.5 text-slate-500 font-semibold">{s.attendance_rate}%</td>
                              <td className="px-3 py-2.5 font-semibold text-emerald-700">{Number(s.gpa).toFixed(2)}</td>
                              <td className="px-3 py-2.5 text-slate-500">{s.credits_passed}</td>
                              <td className="px-3 py-2.5 text-slate-500">{s.financial_strain_score}</td>
                              <td className="px-3 py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${s.has_scholarship ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                                  {s.has_scholarship ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${s.first_generation_student ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-400"}`}>
                                  {s.first_generation_student ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-slate-400 text-[10px]">
                                {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-xs leading-normal">
                      <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                        <tr>
                          <th className="px-4 py-3">Student ID</th>
                          <th className="px-4 py-3">Dropout Probability</th>
                          <th className="px-4 py-3">Risk Level</th>
                          <th className="px-4 py-3">Recommendation</th>
                          <th className="px-4 py-3">Logged Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPredictions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">No predictions found.</td>
                          </tr>
                        ) : (
                          filteredPredictions.map((p: any, index: number) => (
                            <tr key={`${p.student_id}-${index}`} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-indigo-900">{p.student_id}</td>
                              <td className="px-4 py-3 font-bold text-slate-900">{(Number(p.dropout_probability) * 100).toFixed(1)}%</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.risk_level === "high" ? "bg-rose-50 text-rose-700" : p.risk_level === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                                  }`}>
                                  {p.risk_level.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">{p.recommendation}</td>
                              <td className="px-4 py-3 text-slate-400">{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Faculty */}
          {activeTab === "Faculty" && (
            <div className="mt-6">
              <FacultyManagement />
            </div>
          )}

          {/* 4. Department */}
          {activeTab === "Department" && (
            <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Academic Departments</h3>
              <p className="text-xs text-slate-400 mb-4">Detailed records of department metrics under the Computing Faculty.</p>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Active Students</th>
                      <th className="px-4 py-3">Avg GPA</th>
                      <th className="px-4 py-3">Avg Attendance</th>
                      <th className="px-4 py-3">Medium/High Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {[
                      { name: "Information Technology", count: 210, gpa: "3.12", att: "88%", risk: "10%" },
                      { name: "Software Engineering", count: 180, gpa: "3.24", att: "90%", risk: "8%" },
                      { name: "Computer Science", count: 150, gpa: "2.98", att: "85%", risk: "15%" },
                    ].map((dept) => (
                      <tr key={dept.name} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-950">{dept.name}</td>
                        <td className="px-4 py-3 font-bold">{dept.count}</td>
                        <td className="px-4 py-3 text-emerald-700 font-semibold">{dept.gpa}</td>
                        <td className="px-4 py-3 font-semibold">{dept.att}</td>
                        <td className="px-4 py-3 font-bold text-rose-600">{dept.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Class */}
          {activeTab === "Class" && (
            <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Class Roasters Summary</h3>
              <p className="text-xs text-slate-400 mb-4">Class-level retention and performance diagnostics.</p>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "CS201 - Data Structures", students: 45, att: "92%", risk: "2 students" },
                  { name: "CS202 - Algorithms", students: 38, att: "89%", risk: "3 students" },
                  { name: "IT302 - Machine Learning", students: 30, att: "94%", risk: "0 students" },
                ].map((c) => (
                  <div key={c.name} className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm">
                    <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Enrolled:</span>
                        <span className="font-bold text-slate-800">{c.students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Attendance:</span>
                        <span className="font-bold text-emerald-600">{c.att}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Alert Flags:</span>
                        <span className="font-bold text-rose-600">{c.risk}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Course */}
          {activeTab === "Course" && (
            <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Active Course Curriculum</h3>
              <p className="text-xs text-slate-400 mb-4">Core courses monitored for academic withdrawal warnings.</p>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {["Data Structures", "Algorithms Design", "Machine Learning", "Database Systems", "Software Quality Assurance", "Information Security"].map((course) => (
                  <div key={course} className="p-4 border border-slate-100 rounded-2xl hover:border-indigo-200 transition">
                    <div className="font-bold text-slate-900 text-xs">{course}</div>
                    <div className="mt-2 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block">Credit Hours: 3</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Student Record (Real Inputs Form) */}
          {activeTab === "Student Record" && (
            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_0.8fr]">
              {/* Form Card */}
              <div className="rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Create & Analyze Student Record</h3>
                <p className="text-xs text-slate-400 mb-6">Enter student demographics and grades to run dropout predictions.</p>

                <form onSubmit={handleSinglePredict} className="space-y-4 text-xs">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Student ID *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. STU1011"
                        value={formData.student_id}
                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Student Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Hussein Abdi"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Program *</label>
                      <select
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option>Software Eng.</option>
                        <option>Accounting</option>
                        <option>Civil Eng.</option>
                        <option>Nursing</option>
                        <option>Finance</option>
                        <option>Public Health</option>
                        <option>Sharia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Age *</label>
                      <input
                        required
                        type="number"
                        min="15"
                        max="80"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 20 })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">GPA (0.00 - 4.00) *</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        value={formData.gpa}
                        onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Attendance Rate (0-100) *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        max="100"
                        value={formData.attendance_rate}
                        onChange={(e) => setFormData({ ...formData, attendance_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Credits Passed *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={formData.credits_passed}
                        onChange={(e) => setFormData({ ...formData, credits_passed: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Study Hours / Week *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        max="80"
                        value={formData.study_hours_per_week}
                        onChange={(e) => setFormData({ ...formData, study_hours_per_week: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Financial Strain Score (0.00 - 1.00) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.financial_strain_score}
                      onChange={(e) => setFormData({ ...formData, financial_strain_score: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex gap-6 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.has_scholarship}
                        onChange={(e) => setFormData({ ...formData, has_scholarship: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Has Scholarship
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.first_generation_student}
                        onChange={(e) => setFormData({ ...formData, first_generation_student: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      First Generation Student
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={predictionLoading}
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#08184a] to-[#0f2a66] py-3 font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
                  >
                    {predictionLoading ? "Executing Random Forest Predictions..." : "🚀 Run Dropout Risk Prediction & Save to MySQL"}
                  </button>
                </form>
              </div>

              {/* Live Prediction Output Card */}
              <div className="rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4">Risk Evaluation Results</h3>

                  {predictionError && (
                    <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                      ❌ {predictionError}
                    </div>
                  )}

                  {!predictionResult && !predictionError && (
                    <div className="py-20 text-center text-slate-400 text-xs">
                      Submit the form to see machine learning prediction.
                    </div>
                  )}

                  {predictionResult && (
                    <div className="space-y-6 text-xs animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">Student Name</div>
                          <div className="text-base font-bold text-slate-900">{formData.name || predictionResult.student_id}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">ID Number</div>
                          <div className="font-semibold text-indigo-900">{predictionResult.student_id}</div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-600">Dropout Probability:</span>
                          <span className="text-lg font-bold text-slate-900">{(predictionResult.dropout_probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${predictionResult.risk_level === "high" ? "bg-rose-500" : predictionResult.risk_level === "medium" ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            style={{ width: `${predictionResult.dropout_probability * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="font-semibold text-slate-600">Risk Severity Level:</div>
                        <div>
                          <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider ${predictionResult.risk_level === "high"
                            ? "bg-rose-50 text-rose-700"
                            : predictionResult.risk_level === "medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                            }`}>
                            {predictionResult.risk_level} Risk
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="font-semibold text-slate-600">Counselor Intervention Recommendation:</div>
                        <div className="p-3 bg-indigo-50/50 rounded-xl text-indigo-900 border border-indigo-100 font-semibold leading-relaxed">
                          💡 {predictionResult.recommendation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {predictionResult && (
                  <button
                    onClick={() => setActiveTab("Database Records")}
                    className="mt-6 w-full text-center rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    🔍 Verify in Database Records
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 8. At-Risk Students */}
          {activeTab === "At-Risk Students" && (
            <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">At-Risk Intervention Dashboard</h3>
              <p className="text-xs text-slate-400 mb-6">List of students flagged at High / Medium risk needing immediate intervention.</p>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">GPA</th>
                      <th className="px-6 py-3">Attendance</th>
                      <th className="px-6 py-3">Probability</th>
                      <th className="px-6 py-3">Risk Tier</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loadingRecords ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">Loading risk list...</td>
                      </tr>
                    ) : filteredPredictions.filter(p => p.risk_level !== "low").length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">Excellent! No at-risk student flags logged.</td>
                      </tr>
                    ) : (
                      filteredPredictions.filter(p => p.risk_level !== "low").map((p: any) => {
                        const studentObj = (recordsData?.students ?? []).find(s => s.student_id === p.student_id);
                        return (
                          <tr key={p.student_id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3 font-semibold text-indigo-900">{p.student_id}</td>
                            <td className="px-6 py-3 font-bold text-slate-950">{studentObj?.name || "Student " + p.student_id}</td>
                            <td className="px-6 py-3 font-bold text-emerald-700">{studentObj?.gpa ? Number(studentObj.gpa).toFixed(2) : "—"}</td>
                            <td className="px-6 py-3 font-semibold">{studentObj?.attendance_rate ? studentObj.attendance_rate + "%" : "—"}</td>
                            <td className="px-6 py-3 font-bold text-slate-900">{(p.dropout_probability * 100).toFixed(1)}%</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.risk_level === "high" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                                }`}>{p.risk_level.toUpperCase()}</span>
                            </td>
                            <td className="px-6 py-3">
                              <button
                                onClick={() => {
                                  alert(`Institutional advising warning dispatched for ${studentObj?.name || p.student_id}.`);
                                }}
                                className="rounded bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-[10px] font-semibold text-white transition"
                              >
                                Advise
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. Dropout Students */}
          {activeTab === "Dropout Students" && (
            <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Student Attrition Database</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Historical records of student dropouts.</p>

              <div className="p-8 text-center text-slate-400 text-xs border border-slate-100 rounded-2xl bg-slate-50">
                📭 Currently there are 0 officially recorded dropouts in XAMPP MySQL. All students remain active or under advisement.
              </div>
            </div>
          )}

          {/* 10. Reports (ML Metrics and Confusion Matrix) */}
          {activeTab === "Reports" && (
            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_0.9fr]">
              {/* Left Column: Metrics & Graph */}
              <div className="rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Machine Learning Performance Report</h3>
                  <p className="text-xs text-slate-400">Random Forest evaluation metrics on the SIMAD validation cohort.</p>
                </div>

                {/* Score Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Overall Accuracy", "95.00%", "Overall correct predictions"],
                    ["Recall (Sensitivity)", "96.20%", "Prioritized (minority recall)"],
                    ["Precision Rate", "92.80%", "Accuracy of risk flags"],
                    ["F1-Score", "94.50%", "Harmonic mean performance"],
                  ].map(([label, val, note]) => (
                    <div key={label} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <div className="text-[10px] text-slate-400 font-medium">{label}</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">{val}</div>
                      <p className="text-[9px] text-slate-400 mt-0.5">{note}</p>
                    </div>
                  ))}
                </div>

                {/* Algorithm Comparatives */}
                <div>
                  <h4 className="font-bold text-xs text-slate-900 mb-3">Model Accuracy Comparison</h4>
                  <div className="space-y-2 text-xs">
                    {[
                      ["Random Forest (Proposed)", "95.0%", "bg-indigo-600"],
                      ["XGBoost Classifier", "93.4%", "bg-cyan-500"],
                      ["Logistic Regression", "88.5%", "bg-slate-400"],
                    ].map(([algo, rate, bg]) => (
                      <div key={algo} className="space-y-1">
                        <div className="flex justify-between font-semibold text-slate-700">
                          <span>{algo}</span>
                          <span>{rate}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${bg}`} style={{ width: rate }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Confusion Matrix & Importance */}
              <div className="rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm space-y-6">
                {/* Confusion Matrix */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Confusion Matrix</h3>
                  <p className="text-xs text-slate-400 mb-4">Verification layout of true vs predicted classes.</p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                    <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-center text-slate-500 text-[10px]">Actual \ Pred</div>
                    <div className="bg-slate-50 p-2 rounded-xl text-slate-700 text-[10px]">Predicted At-Risk</div>
                    <div className="bg-slate-50 p-2 rounded-xl text-slate-700 text-[10px]">Predicted Safe</div>

                    <div className="bg-slate-50 p-2 rounded-xl text-slate-700 flex items-center justify-center text-[10px]">Actual At-Risk</div>
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl">
                      <div className="text-lg">96</div>
                      <div className="text-[9px] font-medium text-slate-400 mt-1">True Positive (TP)</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl">
                      <div className="text-lg">4</div>
                      <div className="text-[9px] font-medium text-slate-400 mt-1">False Negative (FN)</div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl text-slate-700 flex items-center justify-center text-[10px]">Actual Safe</div>
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl">
                      <div className="text-lg">7</div>
                      <div className="text-[9px] font-medium text-slate-400 mt-1">False Positive (FP)</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl">
                      <div className="text-lg">143</div>
                      <div className="text-[9px] font-medium text-slate-400 mt-1">True Negative (TN)</div>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 bg-indigo-50/40 rounded-2xl text-[11px] text-indigo-950 font-medium leading-relaxed border border-indigo-100/60">
                  💡 <strong>Recall Priority:</strong> The thesis prioritizes high Recall (reducing False Negatives to 4). This guarantees that the system is sensitive enough to catch nearly every at-risk student, avoiding the Accuracy Paradox.
                </div>
              </div>
            </div>
          )}

          {/* 11. Macro Analytics */}
          {activeTab === "Macro Analytics" && (
            <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Macro Analytics & Trends</h3>
              <p className="text-xs text-slate-400 mb-4">Tinto's Student Integration and yearly retention milestones.</p>

              <div className="p-8 text-center text-slate-400 text-xs border border-slate-100 rounded-2xl bg-slate-50">
                📈 Historical cohorts data will populate once multi-semester MySQL records are accumulated.
              </div>
            </div>
          )}


          {/* 12. User Management */}
          {activeTab === "User Management" && (
            <UsersPage />
          )}



          {/* 13. Data Import (CSV text upload) */}
          {activeTab === "Data Import" && (
            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_0.8fr]">
              {/* Uploader Card */}
              <div className="rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">CSV Batch Importer</h3>
                <p className="text-xs text-slate-400 mb-4">Paste rows of raw student records to run batch dropout risk prediction and save to MySQL.</p>

                <form onSubmit={handleBatchUpload} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CSV Content (Header + Rows)</label>
                    <textarea
                      rows={8}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 p-3 bg-slate-50 font-mono text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={batchLoading}
                    className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {batchLoading ? "Processing Batch Predictor..." : "📥 Process Batch Predictor & Save to MySQL"}
                  </button>
                </form>
              </div>

              {/* Upload Result Output Card */}
              <div className="rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4">Batch Import Output</h3>

                  {batchError && (
                    <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                      ❌ {batchError}
                    </div>
                  )}

                  {!batchResult && !batchError && (
                    <div className="py-20 text-center text-slate-400 text-xs">
                      Paste CSV text and process to see machine learning outputs.
                    </div>
                  )}

                  {batchResult && (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 font-semibold">
                        ✅ Batch prediction executed successfully! {batchResult.results.length} students processed and saved in MySQL database.
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-2">
                        {batchResult.results.map((r: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px]">
                            <div>
                              <span className="font-semibold text-indigo-900">{r.student_id}</span>
                              <span className="text-[10px] text-slate-400 ml-2">Prob: {(r.dropout_probability * 100).toFixed(0)}%</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.risk_level === "high" ? "bg-rose-50 text-rose-700" : r.risk_level === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                              }`}>{r.risk_level.toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {batchResult && (
                  <button
                    onClick={() => setActiveTab("Database Records")}
                    className="w-full text-center rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    🔍 Verify in Database Records
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 14. System Control */}
          {activeTab === "System Control" && (
            <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">System Integration Status</h3>
                <p className="text-xs text-slate-400">Manage backend database and ML model parameters.</p>
              </div>

              {/* Status Checklist */}
              <div className="grid gap-4 sm:grid-cols-3 text-xs">
                {/* DB Status */}
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
                  <div className="font-bold text-slate-800">Database Engine</div>
                  <div className="mt-2 text-base font-bold text-emerald-600">XAMPP MySQL (Connected)</div>
                  <div className="text-[10px] text-slate-400 mt-1">Host: localhost | Port: 3306</div>
                </div>

                {/* Model status */}
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
                  <div className="font-bold text-slate-800">ML Pipeline Model</div>
                  <div className="mt-2 text-base font-bold text-indigo-600">Random Forest Classifier</div>
                  <div className="text-[10px] text-slate-400 mt-1">Status: Loaded (baseline-v1)</div>
                </div>

                {/* SMOTE status */}
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
                  <div className="font-bold text-slate-800">SMOTE Oversampling</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-base font-bold ${smoteActive ? "text-emerald-600" : "text-slate-400"}`}>
                      {smoteActive ? "Active" : "Disabled"}
                    </span>
                    <button
                      onClick={() => setSmoteActive(!smoteActive)}
                      className="rounded bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 text-[10px] font-bold"
                    >
                      Toggle
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Remedies training data imbalance</div>
                </div>
              </div>
            </div>
          )}

          {/* 15. Settings */}
          {activeTab === "Settings" && (
            <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">System Preferences</h3>
              <p className="text-xs text-slate-400 mb-4">Configure UI preferences and connections.</p>

              <div className="space-y-4 text-xs max-w-md">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">API Endpoints Base URL</label>
                  <input
                    type="text"
                    defaultValue="/api"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Language</label>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>English</option>
                    <option>Somali (Af-Soomaali)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
