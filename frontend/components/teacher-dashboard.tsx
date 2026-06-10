"use client";

import { Line } from "react-chartjs-2";
import {
  ArcElement,
  Chart as ChartJS,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(ArcElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);

const attendanceData = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
  datasets: [
    {
      label: "Attendance",
      data: [86, 88, 84, 90, 92, 91],
      borderColor: "#4f46e5",
      backgroundColor: "rgba(79, 70, 229, 0.12)",
      tension: 0.45,
      pointRadius: 3,
    },
  ],
};

const students = [
  { name: "Ahmed Hassan", id: "STU-1001", attendance: "91%", status: "Good" },
  { name: "Fatima Ali", id: "STU-1002", attendance: "74%", status: "Watch" },
  { name: "Yusuf Abdullahi", id: "STU-1003", attendance: "62%", status: "Risk" },
  { name: "Amina Yusuf", id: "STU-1004", attendance: "85%", status: "Good" },
];

export function TeacherDashboard() {
  return (
    <main className="min-h-screen px-4 py-4 text-slate-900 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/60 bg-slate-950 px-5 py-6 text-white shadow-2xl shadow-slate-900/10">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-xl font-bold">T</div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Teacher</div>
              <div className="text-sm text-white/65">Class room dashboard</div>
            </div>
          </div>

          <nav className="mt-6 space-y-2 text-sm">
            {["Dashboard", "My Classes", "Attendance", "Grades", "Assignments", "Messages"].map((item, index) => (
              <a
                key={item}
                href="#"
                className={`flex items-center rounded-2xl px-4 py-3 transition ${index === 0 ? "bg-white text-slate-950" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
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
          <header className="rounded-[2rem] border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Teacher Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Track class attendance, grades, and weekly student performance.</p>
          </header>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Total Students", "45", "Current class roster"],
              ["Average Attendance", "82%", "This week"],
              ["Assignments Due", "12", "Pending submissions"],
            ].map(([label, value, note]) => (
              <div key={label} className="rounded-3xl border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur">
                <div className="text-sm font-medium text-brand-700">{label}</div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
                <p className="mt-1 text-sm text-slate-500">{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Weekly Attendance Trend</h2>
                  <p className="text-sm text-slate-500">Line chart for the current course group.</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-brand-700">CS201</span>
              </div>
              <div className="mt-6 h-[300px]">
                <Line
                  data={attendanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false } },
                      y: { beginAtZero: true, grid: { color: "rgba(148, 163, 184, 0.18)" } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  "Take Attendance",
                  "Add Assignment",
                  "View Grades",
                  "Send Message",
                ].map((action) => (
                  <button
                    key={action}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-800 transition hover:border-brand-200 hover:bg-brand-50"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 shadow-sm backdrop-blur">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-950">Students Overview</h2>
              <p className="text-sm text-slate-500">Class-level snapshot for teacher follow-up.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Attendance</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-medium text-slate-950">{student.name}</td>
                      <td className="px-6 py-4 text-slate-600">{student.id}</td>
                      <td className="px-6 py-4 text-slate-600">{student.attendance}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${student.status === "Good" ? "bg-emerald-50 text-emerald-700" : student.status === "Watch" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}
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