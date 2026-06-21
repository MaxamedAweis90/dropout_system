"use client";

import React from "react";
import Link from "next/link";
import { Search, RefreshCw, Plus, Edit, Trash2 } from "lucide-react";

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

interface RiskTabProps {
  searchTerm: string;
  setSearchTerm: (text: string) => void;
  tierFilter: "All" | "Safe" | "At-Risk" | "High-Risk";
  setTierFilter: (tier: "All" | "Safe" | "At-Risk" | "High-Risk") => void;
  filteredStudents: Student[];
  predictions: Record<string, PredictionResult>;
  loadingReports: Record<string, boolean>;
  handleGenerateReport: (student: Student) => void;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onRefreshPredictions?: () => void;
  isRefreshingPredictions?: boolean;
}

export default function RiskTab({
  searchTerm,
  setSearchTerm,
  tierFilter,
  setTierFilter,
  filteredStudents,
  predictions,
  loadingReports,
  handleGenerateReport,
  hasMore,
  loadingMore,
  loadMore,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onRefreshPredictions,
  isRefreshingPredictions = false
}: RiskTabProps) {
  const [localSearch, setLocalSearch] = React.useState(searchTerm);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearchTerm]);

  const sentryRef = React.useRef<HTMLTableRowElement | null>(null);

  React.useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentryRef.current) {
      observer.observe(sentryRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loadMore]);

  // Use database-filtered students directly
  const displayedStudents = filteredStudents;

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Risk Assessment Portal</h3>
          <p className="text-xs text-slate-400 font-semibold">Generate early warning predictions using machine learning</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Tier Filter Select */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All Tiers (Dhammaan Tiers-ka)</option>
            <option value="Safe">Safe (Habad-la'aan)</option>
            <option value="At-Risk">At-Risk (Halis-ku-jira)</option>
            <option value="High-Risk">High-Risk (Halis Sare)</option>
          </select>

          {/* Search by Name / ID only */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search by name or student ID..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
            />
          </div>

          {/* Refresh Predictions Button */}
          {onRefreshPredictions && (
            <button
              onClick={onRefreshPredictions}
              disabled={isRefreshingPredictions}
              className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshingPredictions ? "animate-spin" : ""}`} />
              <span>Refresh Predictions</span>
            </button>
          )}

          <button
            onClick={onAddStudent}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer shrink-0 animate-in fade-in"
          >
            <Plus size={12} />
            <span>Ku dar Arday</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-2xl relative min-h-[200px]">
        {isRefreshingPredictions && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-10 transition-all duration-200">
            <div className="bg-white/90 p-6 rounded-3xl border border-slate-100 shadow-xl flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-900">Refreshing Predictions</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5">Recalculating dropout risk for all students...</span>
              </div>
            </div>
          </div>
        )}
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Student Name & Recommendations</th>
              <th className="px-6 py-4">Gender</th>
              <th className="px-6 py-4">CGPA</th>
              <th className="px-6 py-4">Attendance</th>
              <th className="px-6 py-4">Risk Level</th>
              <th className="px-6 py-4">Probability</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  Wax arday ah laguma helin xogtaan.
                </td>
              </tr>
            ) : (
              displayedStudents.map(student => {
                const pred = predictions[student.student_id];
                const probVal = pred ? Math.round(pred.dropout_probability * 100) : null;
                const reportLoading = loadingReports[student.student_id] || false;

                let badgeBg = "bg-slate-100 text-slate-500 border-slate-200";
                let badgeLabel = "Not Generated";

                if (pred) {
                  if (pred.tier === "High-Risk") {
                    badgeBg = "bg-rose-50 text-rose-700 border border-rose-200";
                    badgeLabel = "High-Risk";
                  } else if (pred.tier === "At-Risk") {
                    badgeBg = "bg-amber-50 text-amber-700 border border-amber-200";
                    badgeLabel = "At-Risk";
                  } else {
                    badgeBg = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                    badgeLabel = "Safe";
                  }
                }

                return (
                  <tr key={student.student_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-indigo-900">
                      <Link href={`/administrator/students/${student.student_id}` as any} className="hover:text-indigo-650 transition">
                        {student.student_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        <Link href={`/administrator/students/${student.student_id}` as any} className="hover:text-indigo-650 transition">
                          {student.name}
                        </Link>
                      </div>
                      {pred && (
                        <div className="mt-1.5 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase border ${
                              pred.tier === "High-Risk"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : pred.tier === "At-Risk"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {pred.tier} ({probVal}%)
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 italic max-w-sm whitespace-normal leading-normal font-medium">
                            {pred.recommendation}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">{student.gender}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{student.cgpa.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{student.attendance_rate.toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] uppercase border ${badgeBg}`}>
                        {badgeLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      {probVal !== null ? `${probVal}%` : "—"}
                    </td>
                     <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditStudent(student)}
                          className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-205 border-slate-200 rounded-lg text-slate-400 hover:text-indigo-650 transition cursor-pointer"
                          title="Edit Student Profile"
                        >
                          <Edit size={12} />
                        </button>
                        {onDeleteStudent && (
                          <button
                            onClick={() => onDeleteStudent(student.student_id)}
                            className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-205 border-slate-200 rounded-lg text-slate-400 hover:text-rose-650 transition cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            {loadingMore && (
              <>
                {[1, 2, 3].map(i => (
                  <tr key={`loading-row-${i}`} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-10"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded-xl w-24"></div></td>
                  </tr>
                ))}
              </>
            )}
            {hasMore && !loadingMore && (
              <tr ref={sentryRef}>
                <td colSpan={8} className="py-4 text-center text-[10px] text-slate-400 font-semibold animate-pulse">
                  Loading more records...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
