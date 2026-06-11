"use client";
import { useEffect, useState } from "react";

const students = [
  { id: "STU-1001", name: "Ahmed Hassan", attendance: "91%", grade: "A-", status: "Good" },
  { id: "STU-1002", name: "Fatima Ali", attendance: "74%", grade: "B", status: "Watch" },
  { id: "STU-1003", name: "Yusuf Abdullahi", attendance: "62%", grade: "C", status: "Risk" },
  { id: "STU-1004", name: "Amina Yusuf", attendance: "85%", grade: "B+", status: "Good" },
  { id: "STU-1005", name: "Maryam Ali", attendance: "79%", grade: "B", status: "Watch" },
];

const stats = [
  ["Total Students", "45", "Current class roster"],
  ["Average Attendance", "82%", "This week"],
  ["Assignments Due", "12", "Pending submissions"],
];

export function TeacherDashboard() {
  const [serverData, setServerData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/auth/teacher/data", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => setServerData(j))
      .catch(() => {});
  }, []);

  const recentStudents = (serverData?.recent_students?.length ? serverData.recent_students : students).map((student: any, index: number) => {
    if (student.attendance && typeof student.attendance === "string") {
      return student;
    }

    const risk = student.risk_level === "high" ? "Risk" : student.risk_level === "medium" ? "Watch" : "Good";
    return {
      id: student.student_id ?? `ROW-${index + 1}`,
      name: student.name ?? `Student ${student.student_id ?? index + 1}`,
      attendance: `${Math.round(student.attendance_rate ?? 0)}%`,
      grade: student.gpa != null ? `GPA ${Number(student.gpa).toFixed(1)}` : "—",
      status: risk,
    };
  });

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] bg-gradient-to-b from-[#08184a] to-[#0f2a66] p-5 text-white shadow-2xl shadow-slate-950/10">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/10 p-2">
                <svg viewBox="0 0 24 24" className="h-full w-full text-white opacity-90" fill="none" stroke="currentColor" strokeWidth="0">
                  <rect width="24" height="24" rx="4" className="fill-white/10" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold">SIMAD UNIVERSITY</div>
                <div className="text-sm text-white/70">Mr. Abdirahman</div>
              </div>
            </div>
          </div>

          <nav className="mt-6 space-y-2 text-sm">
            {["Dashboard", "My Classes", "Attendance", "Grades", "Assignments", "Notices", "Profile"].map((item, index) => (
              <a
                key={item}
                href="#"
                className={`flex items-center rounded-2xl px-4 py-3 transition ${index === 0 ? "bg-white text-slate-950" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <div className="font-medium text-white">Mr. Abdirahman</div>
            <div className="mt-1 text-white/60">Computer Science Dept.</div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="rounded-[2rem] border border-white/10 bg-white/90 px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back, Mr. Abdirahman 👋</h1>
                <p className="mt-1 text-sm text-slate-600">Here's what's happening at SIMAD University today.</p>
              </div>
              <div className="flex items-center gap-3">
                <select className="rounded-full border border-slate-200/70 bg-white px-4 py-2 text-sm shadow-sm">
                  <option>CS201 - Data Structures</option>
                  <option>CS202 - Algorithms</option>
                </select>
                <select className="rounded-full border border-slate-200/70 bg-white px-4 py-2 text-sm shadow-sm">
                  <option>Data Structures and Algorithms</option>
                </select>
                <div className="hidden sm:block rounded-full border border-slate-200/70 bg-white px-4 py-2 text-sm">May 01, 2024 – May 15, 2024</div>
              </div>
            </div>
          </header>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {stats.map(([label, value, note]) => {
              const display = label === "Total Students" && serverData?.students ? serverData.students : value;
              return (
                <div key={label} className="rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-500">{label}</div>
                      <div className="mt-2 text-3xl font-semibold text-slate-900">{display}</div>
                      <p className="mt-1 text-sm text-slate-500">{note}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 grid place-items-center text-indigo-700">📊</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-sm backdrop-blur">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-950">Students Overview</h2>
              <p className="text-sm text-slate-500">Teacher-specific folder for class operations.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Attendance</th>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentStudents.map((student: any) => (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-medium text-slate-950">{student.name}</td>
                      <td className="px-6 py-4 text-slate-600">{student.id}</td>
                      <td className="px-6 py-4 text-slate-600">{student.attendance}</td>
                      <td className="px-6 py-4 text-slate-600">{student.grade}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            student.status === "Good"
                              ? "bg-emerald-50 text-emerald-700"
                              : student.status === "Watch"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
