"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  tone: "indigo" | "emerald" | "amber" | "rose";
};

function MetricCard({ label, value, delta, tone }: MetricCardProps) {
  const toneClasses = {
    indigo: "from-brand-50 to-indigo-50 text-brand-700",
    emerald: "from-emerald-50 to-teal-50 text-emerald-700",
    amber: "from-amber-50 to-orange-50 text-amber-700",
    rose: "from-rose-50 to-pink-50 text-rose-700",
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className={`inline-flex rounded-2xl bg-gradient-to-br ${toneClasses[tone]} px-3 py-1 text-sm font-medium`}>
        {label}
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
          <p className="mt-1 text-sm text-slate-500">{delta}</p>
        </div>
        <div className="h-14 w-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100" />
      </div>
    </div>
  );
}

const riskData = {
  labels: ["Low", "Medium", "High"],
  datasets: [
    {
      data: [68, 21, 11],
      backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
};

const trendData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "At-Risk Students",
      data: [18, 21, 19, 24, 22, 26],
      borderColor: "#4f46e5",
      backgroundColor: "rgba(79, 70, 229, 0.14)",
      borderRadius: 14,
    },
  ],
};

const tableRows = [
  { id: "STU-1001", name: "Ahmed Hassan", program: "Computer Science", attendance: "91%", gpa: "3.6", risk: "Low" },
  { id: "STU-1002", name: "Fatima Ali", program: "Business Admin", attendance: "74%", gpa: "2.8", risk: "Medium" },
  { id: "STU-1003", name: "Yusuf Abdullahi", program: "Engineering", attendance: "62%", gpa: "2.3", risk: "High" },
  { id: "STU-1004", name: "Amina Yusuf", program: "Health Sciences", attendance: "85%", gpa: "3.2", risk: "Low" },
];

export function Dashboard() {
  return (
    <main className="min-h-screen bg-transparent text-slate-900">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-slate-200/70 bg-slate-950 px-5 py-6 text-white shadow-2xl shadow-slate-900/10 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-xl font-bold">SD</div>
            <div>
              <div className="text-lg font-semibold tracking-tight">SIMAD</div>
              <div className="text-sm text-white/65">Student Risk Analytics</div>
            </div>
          </div>
          <nav className="mt-6 space-y-2 text-sm">
            {[
              "Dashboard",
              "Student Records",
              "Risk Scores",
              "Predictions",
              "Reports",
              "Settings",
            ].map((item, index) => (
              <a
                key={item}
                href="#"
                className={`flex items-center rounded-2xl px-4 py-3 transition ${index === 0 ? "bg-white text-slate-950" : "text-white/75 hover:bg-white/8 hover:text-white"}`}
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <div className="font-medium text-white">Administrator</div>
            <div className="mt-1 text-white/60">Academic Affairs Unit</div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="rounded-[2rem] border border-white/60 bg-white/75 px-5 py-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Predicting Student Dropout</h1>
                <p className="mt-1 text-sm text-slate-500">Higher education early-warning dashboard for administrators and advisors.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[700px]">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <div className="text-slate-500">Cohort</div>
                  <div className="font-medium text-slate-900">2024 / 2025</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <div className="text-slate-500">Model</div>
                  <div className="font-medium text-slate-900">Baseline v1</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <div className="text-slate-500">Last refresh</div>
                  <div className="font-medium text-slate-900">Today, 09:30</div>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            <MetricCard label="Total Students" value="2,500" delta="All faculties included" tone="indigo" />
            <MetricCard label="At-Risk Students" value="180" delta="Students requiring intervention" tone="amber" />
            <MetricCard label="Dropout Students" value="25" delta="Confirmed dropout cases" tone="rose" />
            <MetricCard label="Active Faculties" value="5" delta="Currently monitored departments" tone="emerald" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Risk Distribution</h2>
                  <p className="text-sm text-slate-500">Overview of students by risk category.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">University-wide</span>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
                <div className="mx-auto h-[240px] w-[240px] max-w-full">
                  <Doughnut
                    data={riskData}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      cutout: "74%",
                    }}
                  />
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-500"><span>Low risk</span><span>68%</span></div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-2 w-[68%] rounded-full bg-emerald-500" /></div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-500"><span>Medium risk</span><span>21%</span></div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-2 w-[21%] rounded-full bg-amber-500" /></div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-500"><span>High risk</span><span>11%</span></div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-2 w-[11%] rounded-full bg-rose-500" /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Risk Trend</h2>
                  <p className="text-sm text-slate-500">Monthly movement of at-risk students.</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-brand-700">6 months</span>
              </div>
              <div className="mt-6 h-[320px]">
                <Bar
                  data={trendData}
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
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">At-Risk Students</h2>
                  <p className="text-sm text-slate-500">Operational list for intervention and follow-up.</p>
                </div>
                <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition hover:border-brand-200 hover:bg-brand-50">
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Program</th>
                      <th className="px-6 py-4">Attendance</th>
                      <th className="px-6 py-4">GPA</th>
                      <th className="px-6 py-4">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-4 font-medium text-brand-700">{row.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-950">{row.name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{row.program}</td>
                        <td className="px-6 py-4 text-slate-600">{row.attendance}</td>
                        <td className="px-6 py-4 text-slate-600">{row.gpa}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${row.risk === "Low" ? "bg-emerald-50 text-emerald-700" : row.risk === "Medium" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}
                          >
                            {row.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur">
                <h2 className="text-lg font-semibold text-slate-950">Intervention Focus</h2>
                <div className="mt-4 space-y-4 text-sm">
                  {[
                    ["Low attendance", "Primary predictor across multiple departments"],
                    ["Financial strain", "Strong signal in first-year cohorts"],
                    ["Low GPA", "Often follows early absenteeism"],
                  ].map(([title, description]) => (
                    <div key={title} className="rounded-2xl bg-slate-50 p-4">
                      <div className="font-medium text-slate-900">{title}</div>
                      <p className="mt-1 text-slate-500">{description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/60 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/10">
                <h2 className="text-lg font-semibold">Model Notes</h2>
                <p className="mt-2 text-sm text-white/70">
                  The initial backend ships with a transparent heuristic baseline so the project is functional before the final ML dataset is trained and serialized.
                </p>
                <div className="mt-5 grid gap-3 text-sm text-white/80">
                  <div className="rounded-2xl bg-white/8 px-4 py-3">FastAPI prediction endpoint</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">MySQL persistence layer</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">Scikit-Learn training pipeline</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
