"use client";
import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Search, Plus, Edit, Trash2, X, School, Users, BookOpen, Upload, FileText } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Department {
  id: number;
  department_name: string;
}

interface ClassItem {
  id: number;
  class_name: string;
  department_id: number;
  semester: string;
  academic_year: string;
  department_name?: string;
}

interface ClassStudent {
  id: number;
  class_id: number;
  student_id: string;
  student_name?: string;
}

interface ClassCourse {
  id: number;
  class_id: number;
  course_id: number;
  teacher_id: number;
  course_code?: string;
  course_name?: string;
  teacher_name?: string;
}

interface StudentOption {
  student_id: string;
  name: string;
}

interface CourseOption {
  id: number;
  course_code: string;
  course_name: string;
}

interface TeacherOption {
  id: number;
  name: string;
  role: string;
}

interface User {
  id: number;
  name: string;
  role: string;
  status: "Active" | "Inactive";
}

type ToastType = "success" | "error" | "delete";

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }
  return {};
};


function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) {
  const colors: Record<ToastType, string> = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    delete: "bg-amber-600",
  };
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-2xl ${colors[type]} animate-slide-up`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 transition">
        <X size={16} />
      </button>
    </div>
  );
}

export default function ClassManagement() {
  // ── States ──────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [studentsOptions, setStudentsOptions] = useState<StudentOption[]>([]);
  const [coursesOptions, setCoursesOptions] = useState<CourseOption[]>([]);
  const [teachersOptions, setTeachersOptions] = useState<TeacherOption[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classDetails, setClassDetails] = useState<{
    students: ClassStudent[];
    courses: ClassCourse[];
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modals
  const [showClassModal, setShowClassModal] = useState(false);
  const [classEditMode, setClassEditMode] = useState(false);
  const [currentClass, setCurrentClass] = useState<Partial<ClassItem>>({});
  const [classSaving, setClassSaving] = useState(false);
  const [classFormError, setClassFormError] = useState("");

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSaving, setStudentSaving] = useState(false);
  const [studentFormError, setStudentFormError] = useState("");

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTab, setBulkTab] = useState<"paste" | "csv">("paste");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [csvPreview, setCsvPreview] = useState<string[]>([]);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [courseSaving, setCourseSaving] = useState(false);
  const [courseFormError, setCourseFormError] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetching Data ───────────────────────────────────────────────────────────
  const fetchClasses = React.useCallback(async () => {
    try {
      const res = await fetch("/api/classes/", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0 && selectedClassId === null) {
          setSelectedClassId(data[0].id);
        }
      }
    } catch {}
  }, [selectedClassId]);

  const fetchClassDetails = React.useCallback(async (classId: number) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/classes/${classId}/details`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setClassDetails(data);
      }
    } catch {
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const fetchOptions = React.useCallback(async () => {
    try {
      // Departments
      const depRes = await fetch("/api/departments/", { headers: getAuthHeaders() });
      if (depRes.ok) setDepartments(await depRes.json());

      // Student Records
      const stdRes = await fetch("/api/auth/records", { headers: getAuthHeaders() });
      if (stdRes.ok) {
        const data = await stdRes.json();
        if (data.students) setStudentsOptions(data.students);
      }

      // Courses
      const cRes = await fetch("/api/courses/", { headers: getAuthHeaders() });
      if (cRes.ok) setCoursesOptions(await cRes.json());

      // Users for Teachers
      const uRes = await fetch("/api/users/", { headers: getAuthHeaders() });
      if (uRes.ok) {
        const data = await uRes.json();
        // filter teachers
        const teachers = data.filter((u: User) => u.role?.toLowerCase() === "teacher");
        setTeachersOptions(teachers.map((t: User) => ({ id: t.id, name: t.name, role: t.role })));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
      fetchOptions();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchClasses, fetchOptions]);

  useEffect(() => {
    if (selectedClassId !== null) {
      const timer = setTimeout(() => {
        fetchClassDetails(selectedClassId);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const resetTimer = setTimeout(() => {
        setClassDetails(null);
      }, 0);
      return () => clearTimeout(resetTimer);
    }
  }, [selectedClassId, fetchClassDetails]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSaveClass = async () => {
    if (!currentClass.class_name?.trim() || !currentClass.department_id || !currentClass.semester || !currentClass.academic_year) {
      setClassFormError("Fadlan buuxi dhammaan macluumaadka loo baahan yahay.");
      return;
    }
    setClassSaving(true);
    setClassFormError("");

    const url = classEditMode && currentClass.id ? `/api/classes/${currentClass.id}` : "/api/classes/";
    const method = classEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          class_name: currentClass.class_name,
          department_id: currentClass.department_id,
          semester: currentClass.semester,
          academic_year: currentClass.academic_year,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Khalad ayaa dhacay");
      }

      const savedClass = await res.json();
      await fetchClasses();
      setSelectedClassId(savedClass.id);
      setShowClassModal(false);
      showToast(
        classEditMode ? "✅ Fasal-ka si guul leh ayaa loo cusboonaysiiyey!" : "✅ Fasal cusub ayaa si guul leh loo abuuray!",
        "success"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Khalad ayaa dhacay";
      setClassFormError(msg);
    } finally {
      setClassSaving(false);
    }
  };

  const handleDeleteClass = async (id: number, name: string) => {
    if (!confirm(`Ma hubaal baa in aad tirtirto fasalka "${name}"? Dhammaan xiriirada ardayda iyo maadooyinka waa ay tirtirmi doonaan.`)) return;
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok || res.status === 204) {
        showToast("🗑️ Fasalka si guul leh ayaa loo tirtiray!", "delete");
        setClasses((prev) => {
          const next = prev.filter((c) => c.id !== id);
          if (selectedClassId === id) {
            setSelectedClassId(next.length > 0 ? next[0].id : null);
          }
          return next;
        });
      } else {
        const err = await res.json();
        throw new Error(err.detail ?? "Tirtirida waa ay fashilantay");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Khalad ayaa dhacay";
      showToast(msg, "error");
    }
  };

  const handleAddStudent = async () => {
    if (!selectedClassId || !selectedStudentId) {
      setStudentFormError("Fadlan dooro arday.");
      return;
    }
    setStudentSaving(true);
    setStudentFormError("");

    try {
      const res = await fetch("/api/class-students/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          class_id: selectedClassId,
          student_id: selectedStudentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Ku darista waa ay fashilantay");
      }

      await fetchClassDetails(selectedClassId);
      setShowStudentModal(false);
      setSelectedStudentId("");
      showToast("✅ Ardayga si guul leh ayaa loogu daray fasalka!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Khalad ayaa dhacay";
      setStudentFormError(msg);
    } finally {
      setStudentSaving(false);
    }
  };

  const handleRemoveStudent = async (id: number) => {
    if (!confirm("Ma hubaal baa in aad ardaygan ka saarto fasalka?")) return;
    try {
      const res = await fetch(`/api/class-students/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok || res.status === 204) {
        showToast("🗑️ Ardayga waa laga saaray fasalka!", "delete");
        if (selectedClassId) fetchClassDetails(selectedClassId);
      } else {
        const err = await res.json();
        throw new Error(err.detail ?? "Ka saarista waa ay fashilantay");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Khalad ayaa dhacay";
      showToast(msg, "error");
    }
  };

  const handleBulkImport = async () => {
    if (!selectedClassId) return;
    setBulkSaving(true);
    setBulkError("");

    let ids: string[] = [];

    if (bulkTab === "paste") {
      ids = bulkInput
        .split(/[\n,;\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else {
      if (csvPreview.length > 0) {
        ids = csvPreview;
      }
    }

    if (ids.length === 0) {
      setBulkError("Fadlan geli ID-yada ardayda ama soo geli fayl CSV ah.");
      setBulkSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/class-students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          class_id: selectedClassId,
          student_ids: ids,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Hawl-galka bulk-ga waa uu fashilmay");
      }

      const result = await res.json();
      await fetchClassDetails(selectedClassId);
      setShowBulkModal(false);
      setBulkInput("");
      setBulkCsvFile(null);
      setCsvPreview([]);
      
      const successMsg = `Si guul leh loo daray: ${result.added_count} arday. ` + 
        (result.invalid_student_ids.length > 0 ? `Laga gudbay (Invalid IDs): ${result.invalid_student_ids.length}. ` : "") +
        (result.duplicate_student_ids.length > 0 ? `Hore u jiray: ${result.duplicate_student_ids.length}.` : "");
      
      showToast(successMsg, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Khalad ayaa dhacay";
      setBulkError(msg);
    } finally {
      setBulkSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkCsvFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n");
      const parsedIds: string[] = [];
      
      lines.forEach((line, index) => {
        // Simple CSV parser
        const parts = line.split(",").map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length > 0 && parts[0]) {
          // If first row looks like header (e.g. contains 'id' or 'student'), skip it
          if (index === 0 && (parts[0].toLowerCase().includes("id") || parts[0].toLowerCase().includes("student"))) {
            return;
          }
          parsedIds.push(parts[0]);
        }
      });
      setCsvPreview(parsedIds);
    };
    reader.readAsText(file);
  };

  const handleAssignCourse = async () => {
    if (!selectedClassId || !selectedCourseId || !selectedTeacherId) {
      setCourseFormError("Fadlan buuxi dhammaan doorashooyinka.");
      return;
    }
    setCourseSaving(true);
    setCourseFormError("");

    try {
      const res = await fetch("/api/class-courses/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          class_id: selectedClassId,
          course_id: Number(selectedCourseId),
          teacher_id: Number(selectedTeacherId),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Ku darista waa ay fashilantay");
      }

      await fetchClassDetails(selectedClassId);
      setShowCourseModal(false);
      setSelectedCourseId("");
      setSelectedTeacherId("");
      showToast("✅ Maaddada iyo Macallinka waa loo xiray fasalka!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Khalad ayaa dhacay";
      setCourseFormError(msg);
    } finally {
      setCourseSaving(false);
    }
  };

  const handleRemoveCourse = async (id: number) => {
    if (!confirm("Ma hubaal baa in aad maaddadan ka saarto fasalka?")) return;
    try {
      const res = await fetch(`/api/class-courses/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok || res.status === 204) {
        showToast("🗑️ Maaddada iyo Macallinka waa laga saaray fasalka!", "delete");
        if (selectedClassId) fetchClassDetails(selectedClassId);
      } else {
        const err = await res.json();
        throw new Error(err.detail ?? "Ka saarista waa ay fashilantay");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Khalad ayaa dhacay";
      showToast(msg, "error");
    }
  };

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filteredClasses = classes.filter((c) => {
    const t = searchTerm.toLowerCase();
    return (
      c.class_name.toLowerCase().includes(t) ||
      (c.department_name ?? "").toLowerCase().includes(t) ||
      c.semester.toLowerCase().includes(t) ||
      c.academic_year.toLowerCase().includes(t)
    );
  });

  const availableStudents = studentsOptions.filter((s) => {
    // Exclude students already in the class
    const isEnrolled = classDetails?.students.some((cs) => cs.student_id === s.student_id);
    if (isEnrolled) return false;

    if (studentSearchTerm) {
      const term = studentSearchTerm.toLowerCase();
      return s.student_id.toLowerCase().includes(term) || s.name.toLowerCase().includes(term);
    }
    return true;
  });

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* 1. Header Card */}
      <div className="rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <School size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Fasallada Jaamacadda <span className="text-slate-400 font-normal">(Classes)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Halkan ka maamul fasallada, ardayda, maadooyinka iyo macallimiinta ku xiran fasal kasta.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setClassEditMode(false);
              setCurrentClass({ academic_year: "2025/2026", semester: "Semester 1" });
              setClassFormError("");
              setShowClassModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-200"
          >
            <Plus size={16} />
            Ku dar Fasal
          </button>
        </div>

        {/* Search & stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi fasal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              {classes.length} Fasal
            </span>
          </div>
        </div>

        {/* Main Classes Table */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Magaca Fasalka</th>
                <th className="px-4 py-3">Waaxda (Department)</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Sannad-Waxbarasho</th>
                <th className="px-4 py-3 text-right">Awoodaha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredClasses.length > 0 ? (
                filteredClasses.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedClassId(item.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedClassId === item.id ? "bg-indigo-50/70 hover:bg-indigo-50 font-medium" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-950">{item.class_name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.department_name ? (
                        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-medium border border-blue-100">
                          {item.department_name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-medium border border-emerald-100">
                        {item.semester}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.academic_year}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setClassEditMode(true);
                            setCurrentClass({ ...item });
                            setClassFormError("");
                            setShowClassModal(true);
                          }}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition"
                          title="Wax ka beddel"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(item.id, item.class_name)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition"
                          title="Tirtir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Fasallo ma jiraan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Double Panel for Selected Class Details */}
      {selectedClassId !== null && selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Students */}
          <div className="rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users size={16} className="text-amber-500" />
                Ardayda ku dhex jirta Fasalka ({selectedClass.class_name})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBulkTab("paste");
                    setBulkInput("");
                    setBulkCsvFile(null);
                    setCsvPreview([]);
                    setBulkError("");
                    setShowBulkModal(true);
                  }}
                  className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-semibold text-xs transition"
                >
                  <Upload size={12} />
                  Bulk Import
                </button>
                <button
                  onClick={() => {
                    setSelectedStudentId("");
                    setStudentFormError("");
                    setStudentSearchTerm("");
                    setShowStudentModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition shadow-sm"
                >
                  <Plus size={12} />
                  Ku dar Arday
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-20">
                Waa la soo rari yahay...
              </div>
            ) : classDetails && classDetails.students.length > 0 ? (
              <div className="flex-1 overflow-x-auto border border-slate-50 rounded-xl">
                <table className="w-full text-left text-xs text-slate-900">
                  <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">#</th>
                      <th className="px-3 py-2">ID-ga Ardayga</th>
                      <th className="px-3 py-2">Magaca Ardayga</th>
                      <th className="px-3 py-2 text-right">Awoodaha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {classDetails.students.map((std, idx) => (
                      <tr key={std.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono text-indigo-900">{std.student_id}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{std.student_name ?? "—"}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleRemoveStudent(std.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 transition"
                            title="Ka saar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-xs text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                <Users size={24} className="opacity-20 mb-2" />
                Wax arday ah kuma jiraan fasalkan.
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-slate-50 text-[11px] text-slate-400 font-semibold">
              Wadar Guud ee Ardayda: {classDetails?.students.length ?? 0}
            </div>
          </div>

          {/* Right Panel: Courses */}
          <div className="rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-500" />
                Maadooyinka & Macallimiinta Fasalka ({selectedClass.class_name})
              </h3>
              <button
                onClick={() => {
                  setSelectedCourseId("");
                  setSelectedTeacherId("");
                  setCourseFormError("");
                  setShowCourseModal(true);
                }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition shadow-sm"
              >
                <Plus size={12} />
                Dhiib Maaddo & Macallin
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-20">
                Waa la soo rari yahay...
              </div>
            ) : classDetails && classDetails.courses.length > 0 ? (
              <div className="flex-1 overflow-x-auto border border-slate-50 rounded-xl">
                <table className="w-full text-left text-xs text-slate-900">
                  <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">#</th>
                      <th className="px-3 py-2">Maaddada</th>
                      <th className="px-3 py-2">Koodhka</th>
                      <th className="px-3 py-2">Macallinka</th>
                      <th className="px-3 py-2 text-right">Awoodaha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {classDetails.courses.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{c.course_name ?? "—"}</td>
                        <td className="px-3 py-2 font-mono text-indigo-900">{c.course_code ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600 font-medium">{c.teacher_name ?? "—"}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleRemoveCourse(c.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 transition"
                            title="Ka saar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-xs text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                <BookOpen size={24} className="opacity-20 mb-2" />
                Wax maaddooyin ama macallimiin ah looma xirin fasalkan.
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-slate-50 text-[11px] text-slate-400 font-semibold">
              Wadar Guud ee Maadooyinka: {classDetails?.courses.length ?? 0}
            </div>
          </div>
        </div>
      )}

      {/* ── 1. ADD / EDIT CLASS DIALOG ── */}
      <Transition appear show={showClassModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowClassModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-250"
                enterFrom="opacity-0 scale-95 translate-y-2"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <School size={18} className="text-indigo-600" />
                      {classEditMode ? "Wax ka beddel Fasalka" : "Ku dar Fasal Cusub"}
                    </Dialog.Title>
                    <button onClick={() => setShowClassModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Class Name */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Magaca Fasalka *</label>
                      <input
                        type="text"
                        placeholder="Tusaale: CS201"
                        value={currentClass.class_name ?? ""}
                        onChange={(e) => setCurrentClass({ ...currentClass, class_name: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Waaxda *</label>
                      <select
                        value={currentClass.department_id ?? ""}
                        onChange={(e) => setCurrentClass({ ...currentClass, department_id: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Dooro Waaxda --</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.department_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Semester */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Semester *</label>
                      <select
                        value={currentClass.semester ?? ""}
                        onChange={(e) => setCurrentClass({ ...currentClass, semester: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option>Semester 1</option>
                        <option>Semester 2</option>
                        <option>Semester 3</option>
                        <option>Semester 4</option>
                        <option>Semester 5</option>
                        <option>Semester 6</option>
                        <option>Semester 7</option>
                        <option>Semester 8</option>
                      </select>
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sannad-Waxbarasho *</label>
                      <select
                        value={currentClass.academic_year ?? ""}
                        onChange={(e) => setCurrentClass({ ...currentClass, academic_year: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option>2025/2026</option>
                        <option>2024/2025</option>
                        <option>2023/2024</option>
                        <option>2022/2023</option>
                      </select>
                    </div>

                    {classFormError && (
                      <p className="text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 font-medium">
                        ⚠️ {classFormError}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setShowClassModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                    >
                      Jooji
                    </button>
                    <button
                      onClick={handleSaveClass}
                      disabled={classSaving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60"
                    >
                      {classSaving ? "Kaydinta..." : "Kaydi"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── 2. ADD STUDENT DIALOG ── */}
      <Transition appear show={showStudentModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowStudentModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-250"
                enterFrom="opacity-0 scale-95 translate-y-2"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users size={18} className="text-indigo-600" />
                      Ku dar Arday Fasalka
                    </Dialog.Title>
                    <button onClick={() => setShowStudentModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Raadi Arday (Magac ama ID)</label>
                      <input
                        type="text"
                        placeholder="Geli magac ama ID..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dooro Ardayga *</label>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Dooro Ardayga --</option>
                        {availableStudents.slice(0, 100).map((s) => (
                          <option key={s.student_id} value={s.student_id}>
                            {s.name} ({s.student_id})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Waxaa la tusayaa ilaa 100 arday oo aan fasalka ku jirin.
                      </p>
                    </div>

                    {studentFormError && (
                      <p className="text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 font-medium">
                        ⚠️ {studentFormError}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setShowStudentModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                    >
                      Jooji
                    </button>
                    <button
                      onClick={handleAddStudent}
                      disabled={studentSaving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60"
                    >
                      {studentSaving ? "Kaydinta..." : "Ku dar"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── 3. BULK ASSIGN STUDENTS DIALOG ── */}
      <Transition appear show={showBulkModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowBulkModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-250"
                enterFrom="opacity-0 scale-95 translate-y-2"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Upload size={18} className="text-indigo-600" />
                      Bulk Enroll Students
                    </Dialog.Title>
                    <button onClick={() => setShowBulkModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-100 text-xs font-bold mb-4">
                    <button
                      onClick={() => setBulkTab("paste")}
                      className={`flex items-center gap-1.5 border-b-2 px-4 py-2 transition ${
                        bulkTab === "paste" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <FileText size={13} />
                      Copy/Paste
                    </button>
                    <button
                      onClick={() => setBulkTab("csv")}
                      className={`flex items-center gap-1.5 border-b-2 px-4 py-2 transition ${
                        bulkTab === "csv" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Upload size={13} />
                      CSV Upload
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {bulkTab === "paste" ? (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1.5">
                          Ku shub ID-yada ardayda (kala saar adoo isticmaalaya newline, comma ama space):
                        </label>
                        <textarea
                          placeholder="CS1001&#10;CS1002&#10;CS1003"
                          rows={6}
                          value={bulkInput}
                          onChange={(e) => setBulkInput(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                          <span>Hubi in ardaydu ay ku diiwaangashan yihiin nidaamka.</span>
                          <span className="font-semibold text-indigo-600">
                            Count: {bulkInput.split(/[\n,;\s]+/).filter(Boolean).length}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block font-semibold text-slate-700">Soo shub fayl CSV ah:</label>
                        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 bg-slate-50/50 flex flex-col items-center justify-center transition cursor-pointer relative">
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <Upload size={24} className="text-slate-400 mb-2" />
                          <span className="text-slate-600 font-semibold mb-0.5">Riix si aad u dooratid ama u soo jiidid faylka</span>
                          <span className="text-[10px] text-slate-400">Kaliya .csv (Col 1: Student ID)</span>
                        </div>

                        {bulkCsvFile && (
                          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-indigo-900 font-medium">
                            <span className="truncate">{bulkCsvFile.name}</span>
                            <span className="text-[10px] bg-indigo-100 px-2 py-0.5 rounded-full text-indigo-700 shrink-0">
                              {csvPreview.length} ID-ga ardayga
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {bulkError && (
                      <p className="text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 font-medium">
                        ⚠️ {bulkError}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setShowBulkModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                    >
                      Jooji
                    </button>
                    <button
                      onClick={handleBulkImport}
                      disabled={bulkSaving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60"
                    >
                      {bulkSaving ? "Habaynaya..." : "Diiwaangeli"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── 4. ASSIGN COURSE & TEACHER DIALOG ── */}
      <Transition appear show={showCourseModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowCourseModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-250"
                enterFrom="opacity-0 scale-95 translate-y-2"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen size={18} className="text-indigo-600" />
                      Dhiib Maaddo & Macallin
                    </Dialog.Title>
                    <button onClick={() => setShowCourseModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Course select */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dooro Maaddada *</label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Dooro Maaddo --</option>
                        {coursesOptions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.course_name} ({c.course_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Teacher select */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dooro Macallinka *</label>
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Dooro Macallin --</option>
                        {teachersOptions.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (Teacher)
                          </option>
                        ))}
                      </select>
                    </div>

                    {courseFormError && (
                      <p className="text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 font-medium">
                        ⚠️ {courseFormError}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setShowCourseModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                    >
                      Jooji
                    </button>
                    <button
                      onClick={handleAssignCourse}
                      disabled={courseSaving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-60"
                    >
                      {courseSaving ? "Kaydinta..." : "Ku dar"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Animation style */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out both; }
      `}</style>
    </div>
  );
}
