"use client";

import React from "react";
import Link from "next/link";
import { Save, Search } from "lucide-react";

interface ClassCourse {
  id: number;
  class_name: string;
  department_id: number;
  teacher_id: string;
  department_name?: string;
}

interface Student {
  student_id: string;
  name: string;
}

interface GradeRecord {
  assignment_1: number;
  midterm: number;
  final_exam: number;
  final_gpa: number;
}

interface GradebookTabProps {
  classes: ClassCourse[];
  selectedClassId: number | "";
  handleClassChange: (id: number) => void;
  students: Student[];
  gradesState: Record<string, GradeRecord>;
  handleGradeInputChange: (
    studentId: string,
    field: "assignment_1" | "midterm" | "final_exam" | "final_gpa",
    val: string
  ) => void;
  handleSaveGrades: () => void;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (text: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
}

export default function GradebookTab({
  classes,
  selectedClassId,
  handleClassChange,
  students,
  gradesState,
  handleGradeInputChange,
  handleSaveGrades,
  loading,
  searchTerm,
  setSearchTerm,
  hasMore,
  loadingMore,
  loadMore
}: GradebookTabProps) {
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

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);
  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Gradebook</h3>
          <p className="text-xs text-slate-400">Geli dhibcaha imtixaanaadka ardayda fasalka.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Student</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                placeholder="Geli magaca..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Class</span>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(Number(e.target.value))}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-52"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Digital Spreadsheet UI */}
      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 font-semibold text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-4">Student ID</th>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4 w-28">Assignment 1 (Max 20)</th>
              <th className="px-6 py-4 w-28">Midterm (Max 30)</th>
              <th className="px-6 py-4 w-28">Final Exam (Max 50)</th>
              <th className="px-6 py-4 w-28">Final GPA (Max 4.0)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Fasalkan arday laguma helin.
                </td>
              </tr>
            ) : (
              students.map(s => {
                const grades = gradesState[s.student_id] || { assignment_1: 0, midterm: 0, final_exam: 0, final_gpa: 4.0 };
                return (
                  <tr key={s.student_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-indigo-900">
                      <Link href={`/teacher/students/${s.student_id}`} className="hover:text-indigo-650 transition">
                        {s.student_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <Link href={`/teacher/students/${s.student_id}`} className="hover:text-indigo-650 transition">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={grades.assignment_1}
                        onChange={(e) => handleGradeInputChange(s.student_id, "assignment_1", e.target.value)}
                        className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={grades.midterm}
                        onChange={(e) => handleGradeInputChange(s.student_id, "midterm", e.target.value)}
                        className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={grades.final_exam}
                        onChange={(e) => handleGradeInputChange(s.student_id, "final_exam", e.target.value)}
                        className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        max={4.0}
                        step={0.1}
                        value={grades.final_gpa}
                        onChange={(e) => handleGradeInputChange(s.student_id, "final_gpa", e.target.value)}
                        className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                );
              })
            )}
            {loadingMore && (
              <>
                {[1, 2].map(i => (
                  <tr key={`loading-grades-${i}`} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded-lg w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded-lg w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded-lg w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded-lg w-24"></div></td>
                  </tr>
                ))}
              </>
            )}
            {hasMore && !loadingMore && (
              <tr ref={sentryRef}>
                <td colSpan={6} className="py-4 text-center text-[10px] text-slate-400 font-semibold animate-pulse">
                  Loading more records...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {students.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveGrades}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-md cursor-pointer transition"
          >
            <Save size={14} />
            <span>Kaydi Dhibcaha</span>
          </button>
        </div>
      )}
    </div>
  );
}
