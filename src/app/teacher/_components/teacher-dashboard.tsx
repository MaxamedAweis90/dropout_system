"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  LogOut,
  ListCollapse,
  RefreshCw,
  Search
} from "lucide-react";

import ClassesTab from "./tabs/ClassesTab";
import AttendanceTab from "./tabs/AttendanceTab";
import GradebookTab from "./tabs/GradebookTab";
import TeacherInlineSyncPortal from "./TeacherInlineSyncPortal";

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
  age?: number;
}

interface AttendanceLog {
  student_id: string;
  class_id: number;
  date: string;
  status: "Present" | "Absent";
}

interface GradeRecord {
  student_id: string;
  class_id: number;
  assignment_1: number;
  midterm: number;
  final_exam: number;
  final_gpa: number;
}

const SEMESTER_START = "2026-05-04"; // Monday

const getSemesterDates = () => {
  const dates: string[] = [];
  const start = new Date(SEMESTER_START);
  for (let w = 0; w < 12; w++) {
    // Day 1 (Monday)
    const d1 = new Date(start);
    d1.setDate(start.getDate() + w * 7);
    dates.push(d1.toISOString().slice(0, 10));

    // Day 2 (Wednesday)
    const d2 = new Date(start);
    d2.setDate(start.getDate() + w * 7 + 2);
    dates.push(d2.toISOString().slice(0, 10));
  }
  return dates;
};

export function TeacherDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"classes" | "attendance" | "gradebook" | "sync">("classes");
  const [loading, setLoading] = useState(false);
  const [isTabLoaded, setIsTabLoaded] = useState(false);

  // Restore and save active tab to local storage to prevent redirecting to classes on screen refresh
  useEffect(() => {
    const saved = localStorage.getItem("teacherActiveTab");
    if (saved) {
      setActiveTab(saved as any);
    }
    setIsTabLoaded(true);
  }, []);

  useEffect(() => {
    if (isTabLoaded) {
      localStorage.setItem("teacherActiveTab", activeTab);
    }
  }, [activeTab, isTabLoaded]);

  // --- Teacher-Specific Database States ---
  const [classes, setClasses] = useState<ClassCourse[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [students, setStudents] = useState<Student[]>([]);

  // Pagination & Search States
  const [studentsPage, setStudentsPage] = useState(0);
  const [hasMoreStudents, setHasMoreStudents] = useState(true);
  const [loadingMoreStudents, setLoadingMoreStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Attendance states
  const [attendanceMatrix, setAttendanceMatrix] = useState<Record<string, Record<string, boolean>>>({});

  // Gradebook states
  const [gradesState, setGradesState] = useState<Record<string, { assignment_1: number; midterm: number; final_exam: number; final_gpa: number }>>({});

  // Global Search states
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [debouncedGlobalSearchTerm, setDebouncedGlobalSearchTerm] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [loadingGlobalSearch, setLoadingGlobalSearch] = useState(false);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalSearchTerm(globalSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [globalSearchTerm]);

  useEffect(() => {
    const performGlobalSearch = async () => {
      if (!debouncedGlobalSearchTerm.trim()) {
        setGlobalSearchResults([]);
        return;
      }
      setLoadingGlobalSearch(true);
      try {
        const { data: classesData } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", user?.teacherId);

        const classIds = (classesData || []).map(c => c.id);

        if (classIds.length === 0) {
          setGlobalSearchResults([]);
          return;
        }

        const { data: junctionData } = await supabase
          .from("class_students")
          .select("student_id")
          .in("class_id", classIds);

        const studentIds = (junctionData || []).map(j => j.student_id);

        if (studentIds.length === 0) {
          setGlobalSearchResults([]);
          return;
        }

        const { data: stds } = await supabase
          .from("students")
          .select("student_id, name")
          .in("student_id", studentIds)
          .ilike("name", `%${debouncedGlobalSearchTerm}%`)
          .limit(10);

        setGlobalSearchResults(stds || []);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoadingGlobalSearch(false);
      }
    };

    performGlobalSearch();
  }, [debouncedGlobalSearchTerm, user?.teacherId]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowGlobalDropdown(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleSync = async () => {
    setLoading(true);
    setSearchTerm("");
    setGlobalSearchTerm("");
    try {
      router.refresh();
      await fetchData();
      if (selectedClassId !== "") {
        await loadStudentsForClass(Number(selectedClassId), 0, "", false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeRosterStates = useCallback(async (studentList: Student[], classId: number, append = false) => {
    if (studentList.length === 0) return;

    // 1. Initialize Attendance Matrix State
    const semesterDates = getSemesterDates();
    const newMatrix: Record<string, Record<string, boolean>> = {};
    
    studentList.forEach(s => {
      newMatrix[s.student_id] = {};
      semesterDates.forEach(dStr => {
        newMatrix[s.student_id][dStr] = true; // Default to Present (true)
      });
    });

    try {
      const studentIds = studentList.map(s => s.student_id);
      const { data: logs } = await supabase
        .from("attendance_logs")
        .select("student_id, date, status")
        .eq("class_id", classId)
        .in("student_id", studentIds);

      if (logs && logs.length > 0) {
        logs.forEach(l => {
          if (newMatrix[l.student_id]) {
            newMatrix[l.student_id][l.date] = l.status === "Present";
          }
        });
      }
    } catch (e) {
      console.warn("Failed to fetch existing attendance logs", e);
    }
    setAttendanceMatrix(prev => append ? { ...prev, ...newMatrix } : newMatrix);

    // 2. Initialize Grades State (all 0 by default)
    const newGrades: Record<string, { assignment_1: number; midterm: number; final_exam: number; final_gpa: number }> = {};
    studentList.forEach(s => {
      newGrades[s.student_id] = { assignment_1: 0, midterm: 0, final_exam: 0, final_gpa: 4.0 };
    });

    try {
      const studentIds = studentList.map(s => s.student_id);
      const { data: grds } = await supabase
        .from("grades")
        .select("student_id, assignment_1, midterm, final_exam, final_gpa")
        .eq("class_id", classId)
        .in("student_id", studentIds);

      if (grds && grds.length > 0) {
        grds.forEach(g => {
          newGrades[g.student_id] = {
            assignment_1: Number(g.assignment_1) || 0,
            midterm: Number(g.midterm) || 0,
            final_exam: Number(g.final_exam) || 0,
            final_gpa: Number(g.final_gpa) || 4.0
          };
        });
      }
    } catch (e) {
      console.warn("Failed to fetch existing grades", e);
    }
    setGradesState(prev => append ? { ...prev, ...newGrades } : newGrades);
  }, []);

  const loadStudentsForClass = useCallback(async (classId: number, page: number = 0, search: string = "", append = false) => {
    if (page === 0) {
      setLoading(true);
    } else {
      setLoadingMoreStudents(true);
    }

    try {
      // Pull students matching class via class_students junction table
      const { data: junctionData, error: juncError } = await supabase
        .from("class_students")
        .select("student_id")
        .eq("class_id", classId);

      if (juncError) throw juncError;

      const studentIds = (junctionData || []).map(j => j.student_id);
      let stdData: Student[] = [];
      let hasMore = false;

      const start = page * 20;
      const end = (page + 1) * 20 - 1;

      if (studentIds.length === 0) {
        // Fallback: If no junction table records, query all students
        let query = supabase.from("students").select("student_id, name");
        if (search) {
          query = query.ilike("name", `%${search}%`);
        }
        const { data, error } = await query.range(start, end).order("name", { ascending: true });
        if (error) throw error;
        stdData = data || [];
        hasMore = stdData.length === 20;
      } else {
        let query = supabase.from("students").select("student_id, name").in("student_id", studentIds);
        if (search) {
          query = query.ilike("name", `%${search}%`);
        }
        const { data, error } = await query.range(start, end).order("name", { ascending: true });
        if (error) throw error;
        stdData = data || [];
        hasMore = stdData.length === 20;
      }

      setStudents(prev => append ? [...prev, ...stdData] : stdData);
      setHasMoreStudents(hasMore);
      setStudentsPage(page);

      await initializeRosterStates(stdData, classId, append);
    } catch (err: any) {
      console.warn("Failed to query student roster for class:", err);
    } finally {
      setLoading(false);
      setLoadingMoreStudents(false);
    }
  }, [initializeRosterStates]);

  // --- Fetch Assigned Classes ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch classes assigned to this teacher's email/id
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select(`
          id,
          class_name,
          department_id,
          teacher_id
        `)
        .eq("teacher_id", user?.teacherId);

      if (classError) throw classError;

      // Enrich classes with department names
      const { data: deptData } = await supabase.from("departments").select("*");
      const enriched = (classData || []).map(cls => {
        const d = (deptData || []).find(x => x.id === cls.department_id);
        return {
          ...cls,
          department_name: d?.department_name || "Department"
        };
      });

      setClasses(enriched);
      if (enriched.length > 0 && !selectedClassId) {
        setSelectedClassId(enriched[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load assigned classes");
    } finally {
      setLoading(false);
    }
  }, [user?.teacherId, selectedClassId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle class/search selection changes reactively
  useEffect(() => {
    if (selectedClassId !== "") {
      loadStudentsForClass(Number(selectedClassId), 0, debouncedSearchTerm, false);
    }
  }, [selectedClassId, debouncedSearchTerm, loadStudentsForClass]);

  // Handle class selection change
  const handleClassChange = (classId: number) => {
    setSelectedClassId(classId);
  };

  // --- Attendance Save ---
  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;

    setLoading(true);
    const logs: any[] = [];
    const todayStr = "2026-06-20";

    Object.keys(attendanceMatrix).forEach(studentId => {
      const studentDates = attendanceMatrix[studentId];
      Object.keys(studentDates).forEach(dateStr => {
        // Only save past and current (editable) dates
        if (dateStr <= todayStr) {
          logs.push({
            student_id: studentId,
            class_id: Number(selectedClassId),
            date: dateStr,
            status: studentDates[dateStr] ? "Present" : "Absent"
          });
        }
      });
    });

    try {
      if (logs.length > 0) {
        const { error } = await supabase.from("attendance_logs").upsert(logs, {
          onConflict: "student_id, class_id, date"
        });
        if (error) throw error;
      }
      toast.success("Xaadirinta matrix-ka si guul leh ayaa loo diiwaangeliyey!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  // --- Grades Save ---
  const handleSaveGrades = async () => {
    if (!selectedClassId) return;

    setLoading(true);
    const records = Object.keys(gradesState).map(studentId => ({
      student_id: studentId,
      class_id: Number(selectedClassId),
      assignment_1: Number(gradesState[studentId].assignment_1),
      midterm: Number(gradesState[studentId].midterm),
      final_exam: Number(gradesState[studentId].final_exam),
      final_gpa: Number(gradesState[studentId].final_gpa)
    }));

    try {
      // Perform upsert in grades table
      const { error } = await supabase.from("grades").upsert(records, {
        onConflict: "student_id, class_id"
      });
      if (error) throw error;

      toast.success("Dhibcaha buuga imtixaanka si guul leh ayaa loo diiwaangeliyey!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save grades");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeInputChange = (studentId: string, field: "assignment_1" | "midterm" | "final_exam" | "final_gpa", val: string) => {
    const numericVal = parseFloat(val) || 0.0;
    setGradesState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numericVal
      }
    }));
  };



  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ backfaceVisibility: "hidden", transform: "translate3d(0,0,0)" }}
        className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans"
      >
        <Toaster position="top-right" />

        {/* Sticky Blue Header */}
        <header className="sticky top-0 z-40 bg-[#0a2569] text-white h-16 flex items-center justify-between px-6 shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-wider text-white">
              Dropout<span className="text-[#22c55e] font-black">SyS</span>
            </span>
          </div>
          
          {/* Global Search Bar */}
          <div className="relative w-80 hidden md:block" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-white/60" />
            <input
              type="text"
              placeholder="Search assigned students..."
              value={globalSearchTerm}
              onChange={(e) => {
                setGlobalSearchTerm(e.target.value);
                setShowGlobalDropdown(true);
              }}
              className="w-full bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-white/50 focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition shadow-xs"
            />
            
            {showGlobalDropdown && globalSearchTerm.trim() !== "" && (
              <div 
                className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {loadingGlobalSearch ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-650 border-t-transparent shrink-0 animate-spin" />
                    <span>Waa la raadinayaa...</span>
                  </div>
                ) : globalSearchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-bold">
                    Wax natiijo ah lama helin
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg text-left">
                      Ardayda Fasalladaada (My Students)
                    </div>
                    {globalSearchResults.map(std => (
                      <button
                        key={std.student_id}
                        onClick={() => {
                          router.push(`/teacher/students/${std.student_id}` as any);
                          setShowGlobalDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50/50 rounded-xl transition flex items-center justify-between text-xs cursor-pointer group"
                      >
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600">{std.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{std.student_id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full font-medium text-white/80">
              {user?.name || "Macallin"} (Macallin)
            </span>
            <button 
              onClick={handleSync}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Synchronize Database Records"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-xl transition cursor-pointer"
              title="Log Out"
            >
              <LogOut size={14} />
              <span>Ka Bax</span>
            </button>
          </div>
        </header>

        {/* Sidebar + Main Grid */}
        <div className="flex flex-1 relative min-h-0">
          {/* Sidebar */}
          <aside className="w-72 bg-white border-r border-slate-200 p-5 flex flex-col gap-2 shrink-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Guddiga Macallinka
            </div>

            <nav className="flex-1 space-y-1">
              {[
                { id: "classes", label: "My Classes", icon: BookOpen },
                { id: "attendance", label: "Attendance Tracker", icon: ClipboardList },
                { id: "gradebook", label: "Gradebook", icon: ListCollapse },
                { id: "sync", label: "Inline Sync Portal", icon: RefreshCw },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left flex items-center gap-3 rounded-xl px-4 py-2.5 transition text-sm font-semibold cursor-pointer ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0 opacity-80" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 space-y-1 px-2">
              <div>Logged in: {user?.email}</div>
              <div>Teacher ID: {user?.teacherId}</div>
              <div>Mode: Supabase Connected</div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
            <div className="max-w-[1400px] mx-auto space-y-6">

              {/* --- TAB 1: MY CLASSES --- */}
              {activeTab === "classes" && (
                <ClassesTab
                  classes={classes}
                  setSelectedClassId={setSelectedClassId}
                  loadStudentsForClass={loadStudentsForClass}
                  setActiveTab={setActiveTab}
                />
              )}

              {/* --- TAB 2: ATTENDANCE TRACKER --- */}
              {activeTab === "attendance" && (
                <AttendanceTab
                  classes={classes}
                  selectedClassId={selectedClassId}
                  handleClassChange={handleClassChange}
                  students={students}
                  attendanceMatrix={attendanceMatrix}
                  setAttendanceMatrix={setAttendanceMatrix}
                  handleSaveAttendance={handleSaveAttendance}
                  loading={loading}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  hasMore={hasMoreStudents}
                  loadingMore={loadingMoreStudents}
                  loadMore={() => loadStudentsForClass(Number(selectedClassId), studentsPage + 1, debouncedSearchTerm, true)}
                />
              )}

              {/* --- TAB 3: GRADEBOOK --- */}
              {activeTab === "gradebook" && (
                <GradebookTab
                  classes={classes}
                  selectedClassId={selectedClassId}
                  handleClassChange={handleClassChange}
                  students={students}
                  gradesState={gradesState}
                  handleGradeInputChange={handleGradeInputChange}
                  handleSaveGrades={handleSaveGrades}
                  loading={loading}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  hasMore={hasMoreStudents}
                  loadingMore={loadingMoreStudents}
                  loadMore={() => loadStudentsForClass(Number(selectedClassId), studentsPage + 1, debouncedSearchTerm, true)}
                />
              )}

              {/* --- TAB 4: INLINE SYNC PORTAL --- */}
              {activeTab === "sync" && (
                <TeacherInlineSyncPortal />
              )}

          </div>
        </main>
      </div>
      </motion.div>
    </AnimatePresence>
  );
}
