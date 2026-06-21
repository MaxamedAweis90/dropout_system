"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Calendar, Save, Search, Lock } from "lucide-react";

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

interface AttendanceTabProps {
  classes: ClassCourse[];
  selectedClassId: number | "";
  handleClassChange: (id: number) => void;
  students: Student[];
  attendanceMatrix: Record<string, Record<string, boolean>>;
  setAttendanceMatrix: React.Dispatch<React.SetStateAction<Record<string, Record<string, boolean>>>>;
  handleSaveAttendance: () => void;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (text: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
}

const SEMESTER_START = "2026-05-04"; // Monday

const getSemesterWeeks = () => {
  const weeks: {
    index: number;
    label: string;
    isCurrent: boolean;
    isPast: boolean;
    days: { date: string; label: string; isPastOrCurrent: boolean }[];
  }[] = [];
  
  const start = new Date(SEMESTER_START);
  const today = new Date("2026-06-20");

  for (let w = 0; w < 12; w++) {
    const wStart = new Date(start);
    wStart.setDate(start.getDate() + w * 7);

    const d1 = new Date(wStart);
    const d2 = new Date(wStart);
    d2.setDate(wStart.getDate() + 2); // Wednesday

    const d1Str = d1.toISOString().slice(0, 10);
    const d2Str = d2.toISOString().slice(0, 10);

    const d1PastOrCurrent = d1Str <= "2026-06-20";
    const d2PastOrCurrent = d2Str <= "2026-06-20";

    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);
    const isCurrent = today >= wStart && today <= wEnd;
    const isPast = wEnd < today;

    weeks.push({
      index: w + 1,
      label: `Week ${w + 1}${isCurrent ? " (Current)" : isPast ? " (Past)" : " (Future)"}`,
      isCurrent,
      isPast,
      days: [
        { date: d1Str, label: "Day 1", isPastOrCurrent: d1PastOrCurrent },
        { date: d2Str, label: "Day 2", isPastOrCurrent: d2PastOrCurrent }
      ]
    });
  }
  return weeks;
};

export default function AttendanceTab({
  classes,
  selectedClassId,
  handleClassChange,
  students,
  attendanceMatrix,
  setAttendanceMatrix,
  handleSaveAttendance,
  loading,
  searchTerm,
  setSearchTerm,
  hasMore,
  loadingMore,
  loadMore
}: AttendanceTabProps) {
  const [localSearch, setLocalSearch] = React.useState(searchTerm);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentWeekRef = useRef<HTMLTableHeaderCellElement>(null);

  const weeks = getSemesterWeeks();

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearchTerm]);

  // Viewport scroll focus: Center on the current week columns on mount or student roster change
  useEffect(() => {
    if (containerRef.current && currentWeekRef.current) {
      const container = containerRef.current;
      const weekHeader = currentWeekRef.current;
      
      const containerWidth = container.clientWidth;
      const weekOffsetLeft = weekHeader.offsetLeft;
      const weekWidth = weekHeader.clientWidth;

      // Centered position
      container.scrollLeft = weekOffsetLeft - (containerWidth / 2) + (weekWidth / 2);
    }
  }, [students]);

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
          <h3 className="text-base font-bold text-slate-900">Attendance Spreadsheet Grid</h3>
          <p className="text-xs text-slate-400">Geli xaadirinta semester-ka oo dhan qaab grid ah.</p>
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

          {/* Class Dropdown */}
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

      {/* Roster Spreadsheet Matrix Table */}
      <div 
        ref={containerRef} 
        className="overflow-x-auto border border-slate-150 rounded-2xl relative max-h-[600px] scroll-smooth"
      >
        <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
          <thead className="bg-slate-50 font-semibold text-slate-500 uppercase sticky top-0 z-30">
            {/* First Header Row: Weeks */}
            <tr className="border-b border-slate-150">
              <th 
                rowSpan={2} 
                className="px-6 py-4 sticky left-0 bg-slate-50 z-40 border-r border-slate-200 min-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]"
              >
                Student ID
              </th>
              <th 
                rowSpan={2} 
                className="px-6 py-4 sticky left-[120px] bg-slate-50 z-40 border-r border-slate-200 min-w-[160px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]"
              >
                Student Name
              </th>
              {weeks.map(w => (
                <th 
                  key={w.index} 
                  colSpan={2} 
                  ref={w.isCurrent ? currentWeekRef : undefined}
                  className={`px-4 py-2 text-center border-r border-slate-150 text-[10px] font-black ${
                    w.isCurrent 
                      ? "bg-indigo-50 text-indigo-700 border-b-2 border-b-indigo-500" 
                      : w.isPast 
                      ? "bg-slate-50/70 text-slate-600" 
                      : "bg-slate-100/40 text-slate-400"
                  }`}
                >
                  {w.label}
                </th>
              ))}
            </tr>
            {/* Second Header Row: Days */}
            <tr className="border-b border-slate-150 text-[9px] font-bold">
              {weeks.map(w => 
                w.days.map(d => (
                  <th 
                    key={d.date} 
                    className={`px-3 py-2.5 text-center border-r border-slate-150 min-w-[90px] ${
                      w.isCurrent 
                        ? "bg-indigo-50/40 text-indigo-600 font-extrabold" 
                        : d.isPastOrCurrent 
                        ? "bg-slate-50/50 text-slate-500" 
                        : "bg-slate-100/30 text-slate-400"
                    }`}
                  >
                    <div>{d.label}</div>
                    <div className="font-mono text-[8px] font-medium text-slate-400 mt-0.5">{d.date.slice(5)}</div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {students.length === 0 ? (
              <tr>
                <td colSpan={2 + 24} className="px-6 py-12 text-center text-slate-400 font-medium">
                  Fasalkan arday laguma helin xogta.
                </td>
              </tr>
            ) : (
              students.map(s => (
                <tr key={s.student_id} className="hover:bg-slate-50/30 group">
                  {/* Sticky ID Cell */}
                  <td 
                    className="px-6 py-4 font-semibold text-indigo-900 sticky left-0 bg-white group-hover:bg-slate-50/90 z-20 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]"
                  >
                    <Link href={`/teacher/students/${s.student_id}`} className="hover:text-indigo-650 transition">
                      {s.student_id}
                    </Link>
                  </td>
                  {/* Sticky Name Cell */}
                  <td 
                    className="px-6 py-4 font-bold text-slate-900 sticky left-[120px] bg-white group-hover:bg-slate-50/90 z-20 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]"
                  >
                    <Link href={`/teacher/students/${s.student_id}`} className="hover:text-indigo-650 transition">
                      {s.name}
                    </Link>
                  </td>
                  {/* Attendance Checkboxes */}
                  {weeks.map(w => 
                    w.days.map(d => {
                      const isChecked = attendanceMatrix[s.student_id]?.[d.date] ?? true;
                      const isEditable = d.isPastOrCurrent;
                      
                      return (
                        <td 
                          key={d.date} 
                          className={`px-3 py-3 text-center border-r border-slate-100 transition-colors duration-150 ${
                            !isEditable 
                              ? "bg-slate-50/50 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#f8fafc_4px,#f8fafc_8px)] text-slate-400/80" 
                              : w.isCurrent 
                              ? "bg-indigo-50/10" 
                              : "bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            {isEditable ? (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setAttendanceMatrix(prev => {
                                    const studentRow = prev[s.student_id] || {};
                                    return {
                                      ...prev,
                                      [s.student_id]: {
                                        ...studentRow,
                                        [d.date]: !isChecked
                                      }
                                    };
                                  });
                                }}
                                className="h-4.5 w-4.5 rounded-md border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition"
                              />
                            ) : (
                              <div 
                                className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-400 border border-slate-200/50 shadow-2xs" 
                                title="LOCKED: Future date"
                              >
                                <Lock size={9} className="shrink-0" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })
                  )}
                </tr>
              ))
            )}
            {loadingMore && (
              <tr className="animate-pulse">
                <td className="px-6 py-4 sticky left-0 bg-white border-r"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                <td className="px-6 py-4 sticky left-[120px] bg-white border-r"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                {weeks.map(w => 
                  w.days.map(d => (
                    <td key={d.date} className="px-3 py-4 border-r text-center"><div className="h-4 bg-slate-250 rounded w-4 mx-auto bg-slate-200"></div></td>
                  ))
                )}
              </tr>
            )}
            {hasMore && !loadingMore && (
              <tr ref={sentryRef}>
                <td colSpan={2 + 24} className="py-4 text-center text-[10px] text-slate-400 font-semibold animate-pulse">
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
            onClick={handleSaveAttendance}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-md cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            <span>Kaydi Xaadirinta Matrix-ka</span>
          </button>
        </div>
      )}
    </div>
  );
}
