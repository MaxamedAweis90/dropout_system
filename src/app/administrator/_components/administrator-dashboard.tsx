"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import DashboardTab from "./tabs/DashboardTab";
import UploadTab from "./tabs/UploadTab";
import RiskTab from "./tabs/RiskTab";
import UsersTab from "./tabs/UsersTab";
import DepartmentsTab from "./tabs/DepartmentsTab";
import AdminManualRegistration from "./AdminManualRegistration";
import DataImport from "./DataImport";
import {
  LayoutDashboard,
  Upload,
  AlertTriangle,
  Users,
  Building,
  School,
  Search,
  Plus,
  Edit,
  Trash2,
  LogOut,
  RefreshCw,
  Info,
  FileSpreadsheet,
  Loader2,
  X,
  Bell
} from "lucide-react";

// Fallback Mock Data for Academic Hierarchy
const MOCK_FACULTIES = [
  { id: 1, name: "Faculty of Engineering, Science & Technology", acronym: "FEST" },
  { id: 2, name: "Faculty of Business & Administration", acronym: "FBA" }
];

const MOCK_DEPARTMENTS = [
  { id: 1, department_name: "Computer Science", faculty_id: 1 },
  { id: 2, department_name: "Engineering", faculty_id: 1 },
  { id: 3, department_name: "Business Administration", faculty_id: 2 },
  { id: 4, department_name: "Accounting", faculty_id: 2 }
];

const MOCK_DEGREES = [
  { id: 1, name: "Bachelor of Computer Science", department_id: 1 },
  { id: 2, name: "Bachelor of Information Technology", department_id: 1 },
  { id: 3, name: "Bachelor of Civil Engineering", department_id: 2 },
  { id: 4, name: "Bachelor of Telecommunication Engineering", department_id: 2 },
  { id: 5, name: "Bachelor of Business Administration", department_id: 3 },
  { id: 6, name: "Bachelor of Accounting", department_id: 4 }
];

interface Faculty {
  id: number | string;
  name: string;
  acronym?: string;
}

interface Degree {
  id: number | string;
  name: string;
  department_id: number | string;
}

// Types matching Supabase tables
interface Department {
  id: number;
  department_name: string;
  faculty_id?: number;
}

interface Teacher {
  id: string; // uuid in supabase, string in mock
  name: string;
  email: string;
  created_at?: string;
}

interface Administrator {
  id: string; // uuid in supabase, string in mock
  name: string;
  email: string;
  created_at?: string;
}

interface ClassItem {
  id: number;
  class_name: string;
  department_id: number;
  teacher_id: string | null;
  // Joins
  departments?: { department_name: string } | null;
  teachers?: { name: string } | null;
}

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
  stress_index?: number;
  parent_education?: string;
}

interface PredictionResult {
  student_id: string;
  dropout_probability: number;
  tier: string;  // "Safe" | "At-Risk" | "High-Risk"
  recommendation?: string;
}

export function AdministratorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "upload" | "risk" | "teachers" | "departments" | "manual-register">("dashboard");
  const [loading, setLoading] = useState(false);
  const [isRefreshingPredictions, setIsRefreshingPredictions] = useState(false);
  const [isTabLoaded, setIsTabLoaded] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Restore and save active tab to local storage to prevent redirecting to dashboard on screen refresh
  useEffect(() => {
    const saved = localStorage.getItem("adminActiveTab");
    if (saved) {
      setActiveTab(saved as any);
    }
    setIsTabLoaded(true);

    // Restore cached counts to prevent flickering default values on reload
    const savedCounts = localStorage.getItem("dashboardCounts");
    if (savedCounts) {
      try {
        const parsed = JSON.parse(savedCounts);
        if (parsed.students !== undefined) setTotalStudentsCount(parsed.students);
        if (parsed.teachers !== undefined) setTotalTeachersCount(parsed.teachers);
        if (parsed.classes !== undefined) setTotalClassesCount(parsed.classes);
        if (parsed.admins !== undefined) setTotalAdminsCount(parsed.admins);
        if (parsed.safe !== undefined) setDbSafeCount(parsed.safe);
        if (parsed.atRisk !== undefined) setDbAtRiskCount(parsed.atRisk);
        if (parsed.highRisk !== undefined) setDbHighRiskCount(parsed.highRisk);
      } catch (e) {
        console.warn("Failed to parse cached dashboard counts", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isTabLoaded) {
      localStorage.setItem("adminActiveTab", activeTab);
    }
  }, [activeTab, isTabLoaded]);



  // --- Database States (Shared between Mock and Live) ---
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Cascading Dropdowns & Student Modal states
  const [facultiesList, setFacultiesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [degreesList, setDegreesList] = useState<any[]>([]);

  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedDegreeId, setSelectedDegreeId] = useState<string>("");

  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDegrees, setLoadingDegrees] = useState(false);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentEditMode, setStudentEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student>({
    student_id: "",
    name: "",
    age: 20,
    gender: "Male",
    family_income: 3000,
    internet_access: true,
    study_hours_per_day: 2.5,
    attendance_rate: 100,
    assignment_delay_days: 0,
    travel_time_minutes: 15,
    part_time_job: false,
    has_scholarship: false,
    gpa: 3.0,
    semester_gpa: 3.0,
    cgpa: 3.0,
    financial_problem: false,
    semester_year: 1,
    stress_index: 3.0,
    parent_education: "High School"
  });
  
  // Counts states
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [totalTeachersCount, setTotalTeachersCount] = useState(0);
  const [totalClassesCount, setTotalClassesCount] = useState(0);
  const [totalAdminsCount, setTotalAdminsCount] = useState(0);
  const [dbSafeCount, setDbSafeCount] = useState(0);
  const [dbAtRiskCount, setDbAtRiskCount] = useState(0);
  const [dbHighRiskCount, setDbHighRiskCount] = useState(0);
  const [riskTierFilter, setRiskTierFilter] = useState<"All" | "Safe" | "At-Risk" | "High-Risk">("All");

  // Pagination states
  const [studentsPage, setStudentsPage] = useState(0);
  const [hasMoreStudents, setHasMoreStudents] = useState(true);
  const [loadingMoreStudents, setLoadingMoreStudents] = useState(false);

  const [teachersPage, setTeachersPage] = useState(0);
  const [hasMoreTeachers, setHasMoreTeachers] = useState(true);
  const [loadingMoreTeachers, setLoadingMoreTeachers] = useState(false);

  const [adminsPage, setAdminsPage] = useState(0);
  const [hasMoreAdmins, setHasMoreAdmins] = useState(true);
  const [loadingMoreAdmins, setLoadingMoreAdmins] = useState(false);

  // Risk analytics states
  const [predictions, setPredictions] = useState<Record<string, PredictionResult>>({});
  const [loadingReports, setLoadingReports] = useState<Record<string, boolean>>({});

  // Search filters
  const [riskSearchTerm, setRiskSearchTerm] = useState("");
  const [debouncedRiskSearchTerm, setDebouncedRiskSearchTerm] = useState("");

  const [teachersSearchTerm, setTeachersSearchTerm] = useState("");
  const [debouncedTeachersSearchTerm, setDebouncedTeachersSearchTerm] = useState("");

  const [adminsSearchTerm, setAdminsSearchTerm] = useState("");
  const [debouncedAdminsSearchTerm, setDebouncedAdminsSearchTerm] = useState("");

  // Global search states
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [debouncedGlobalSearchTerm, setDebouncedGlobalSearchTerm] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<{ users: any[]; students: any[] }>({ users: [], students: [] });
  const [loadingGlobalSearch, setLoadingGlobalSearch] = useState(false);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);

  // Debouncing search terms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRiskSearchTerm(riskSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [riskSearchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTeachersSearchTerm(teachersSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [teachersSearchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAdminsSearchTerm(adminsSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [adminsSearchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalSearchTerm(globalSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [globalSearchTerm]);

  // Cascading Hierarchy Fetching Effects
  useEffect(() => {
    const fetchFaculties = async () => {
      setLoadingFaculties(true);
      try {
        const { data, error } = await supabase.from("faculties").select("id, name").order("name");
        if (error) throw error;
        setFacultiesList(data && data.length > 0 ? data : MOCK_FACULTIES);
      } catch (err) {
        console.warn("Failed to fetch faculties from Supabase, falling back to mock:", err);
        setFacultiesList(MOCK_FACULTIES);
      } finally {
        setLoadingFaculties(false);
      }
    };
    fetchFaculties();
  }, []);

  useEffect(() => {
    setSelectedDepartmentId("");
    setSelectedDegreeId("");
    setDegreesList([]);

    if (!selectedFacultyId) {
      setDepartmentsList([]);
      return;
    }

    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const { data, error } = await supabase
          .from("departments")
          .select("*")
          .eq("faculty_id", selectedFacultyId)
          .order("department_name");
        if (error) throw error;
        setDepartmentsList(data && data.length > 0 ? data : []);
      } catch (err) {
        console.warn("Failed to fetch departments from Supabase, falling back to mock:", err);
        const numericFacId = Number(selectedFacultyId);
        const filtered = MOCK_DEPARTMENTS.filter(d => d.faculty_id === numericFacId);
        setDepartmentsList(filtered);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [selectedFacultyId]);

  useEffect(() => {
    setSelectedDegreeId("");

    if (!selectedDepartmentId) {
      setDegreesList([]);
      return;
    }

    const fetchDegrees = async () => {
      setLoadingDegrees(true);
      try {
        const { data, error } = await supabase
          .from("degrees")
          .select("id, name, acronym, department_id")
          .eq("department_id", Number(selectedDepartmentId))
          .order("name");
        if (error) throw error;
        setDegreesList(data && data.length > 0 ? data : []);
      } catch (err) {
        console.warn("Failed to fetch degrees from Supabase, falling back to mock:", err);
        const filtered = MOCK_DEGREES.filter(d => d.department_id === Number(selectedDepartmentId));
        setDegreesList(filtered);
      } finally {
        setLoadingDegrees(false);
      }
    };
    fetchDegrees();
  }, [selectedDepartmentId]);

  const handleEditStudentClick = async (student: Student) => {
    setStudentEditMode(true);
    setCurrentStudent(student);

    const deptName = (student as any).department_name || "Computer Science";
    let matchedDept = departments.find(d => d.department_name.toLowerCase() === deptName.toLowerCase());
    if (!matchedDept) {
      matchedDept = MOCK_DEPARTMENTS.find(d => d.department_name.toLowerCase() === deptName.toLowerCase());
    }

    if (matchedDept) {
      const facId = (matchedDept as any).faculty_id || 1;
      setSelectedFacultyId(String(facId));
      setSelectedDepartmentId(String(matchedDept.id));
      setSelectedDegreeId("");
    } else {
      setSelectedFacultyId("");
      setSelectedDepartmentId("");
      setSelectedDegreeId("");
    }

    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent.student_id || !currentStudent.name) {
      toast.error("Fadlan geli ID-ga iyo magaca ardayga");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        student_id: currentStudent.student_id.trim(),
        name: currentStudent.name.trim(),
        age: Number(currentStudent.age),
        gender: currentStudent.gender,
        family_income: Number(currentStudent.family_income),
        internet_access: Boolean(currentStudent.internet_access),
        study_hours_per_day: Number(currentStudent.study_hours_per_day),
        attendance_rate: Number(currentStudent.attendance_rate),
        assignment_delay_days: Number(currentStudent.assignment_delay_days),
        travel_time_minutes: Number(currentStudent.travel_time_minutes),
        part_time_job: Boolean(currentStudent.part_time_job),
        has_scholarship: Boolean(currentStudent.has_scholarship),
        gpa: Number(currentStudent.gpa),
        semester_gpa: Number(currentStudent.semester_gpa),
        cgpa: Number(currentStudent.cgpa),
        financial_problem: Boolean(currentStudent.financial_problem),
        semester_year: Number(currentStudent.semester_year),
        stress_index: Number(currentStudent.stress_index) || 3.0,
        parent_education: currentStudent.parent_education || "High School"
      };

      // 1. Get Prediction from Stateless ML Backend dynamically
      const normalizeDept = (deptId: string): string => {
        const matched = departments.find(d => String(d.id) === deptId);
        const name = matched?.department_name || "CS";
        const lower = name.toLowerCase();
        if (lower.includes("computer") || lower.includes("cs")) return "CS";
        if (lower.includes("business") || lower.includes("admin")) return "Business";
        if (lower.includes("engineering")) return "Engineering";
        if (lower.includes("science")) return "Science";
        if (lower.includes("art")) return "Arts";
        return "CS";
      };

      const deptName = normalizeDept(selectedDepartmentId);
      
      let dbPrediction = { dropout_probability: 0.1, risk_level: "Safe" };
      try {
        const mlResponse = await fetch("/api/predict/single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            department: deptName
          })
        });

        if (mlResponse.ok) {
          const mlResult = await mlResponse.json();
          dbPrediction = {
            dropout_probability: mlResult.dropout_probability,
            risk_level: mlResult.tier || "Safe"
          };
        }
      } catch (mlErr) {
        console.warn("FastAPI prediction failed during student save:", mlErr);
      }

      // 2. Upsert to Supabase with prediction fields
      const { error } = await supabase.from("students").upsert({
        ...payload,
        ...dbPrediction
      });
      if (error) throw error;

      // Class Enrollment Link
      if (selectedDepartmentId) {
        const matchedClass = classes.find(c => c.department_id === Number(selectedDepartmentId));
        if (matchedClass) {
          await supabase.from("class_students").upsert({
            class_id: matchedClass.id,
            student_id: currentStudent.student_id.trim()
          });
        }
      }

      toast.success(studentEditMode ? "Ardayga waa la cusboonaysiiyey!" : "Arday cusub ayaa lagu daray!");
      setShowStudentModal(false);
      
      await fetchCounts();
      await fetchStudents(0, riskSearchTerm, false);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Ma hubaal baa inaad rabto inaad tirtirto ardaygaan?")) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("students").delete().eq("student_id", studentId);
      if (error) throw error;
      toast.success("Ardayga waa la tirtiray!");
      
      await fetchCounts();
      await fetchStudents(0, riskSearchTerm, false);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for showClassModal
  const handleShowClassModal = (show: boolean) => {
    if (show) {
      if (classEditMode) {
        let matchedDept = departments.find(d => d.id === currentClass.department_id);
        if (!matchedDept) {
          matchedDept = MOCK_DEPARTMENTS.find(d => d.id === currentClass.department_id);
        }
        if (matchedDept) {
          const facId = (matchedDept as any).faculty_id || 1;
          setSelectedFacultyId(String(facId));
          setSelectedDepartmentId(String(currentClass.department_id));
        }
      } else {
        setSelectedFacultyId("");
        setSelectedDepartmentId("");
      }
    }
    setShowClassModal(show);
  };

  // Global Search logic
  useEffect(() => {
    const performGlobalSearch = async () => {
      if (!debouncedGlobalSearchTerm.trim()) {
        setGlobalSearchResults({ users: [], students: [] });
        return;
      }
      setLoadingGlobalSearch(true);
      try {
        const { data: stds } = await supabase
          .from("students")
          .select("student_id, name")
          .or(`name.ilike.%${debouncedGlobalSearchTerm}%,student_id.ilike.%${debouncedGlobalSearchTerm}%`)
          .limit(10);

        const { data: teachersData } = await supabase
          .from("teachers")
          .select("id, name, email")
          .or(`name.ilike.%${debouncedGlobalSearchTerm}%,email.ilike.%${debouncedGlobalSearchTerm}%`)
          .limit(5);

        let adminsData: any[] = [];
        if (user?.isSuperAdmin) {
          const { data: admins } = await supabase
            .from("administrators")
            .select("id, name, email")
            .or(`name.ilike.%${debouncedGlobalSearchTerm}%,email.ilike.%${debouncedGlobalSearchTerm}%`)
            .limit(5);
          adminsData = admins || [];
        }

        const users = [
          ...(teachersData || []).map(t => ({ ...t, role: "Teacher" })),
          ...adminsData.map(a => ({ ...a, role: "Admin" }))
        ];

        setGlobalSearchResults({
          users,
          students: stds || []
        });
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoadingGlobalSearch(false);
      }
    };

    performGlobalSearch();
  }, [debouncedGlobalSearchTerm, user?.isSuperAdmin]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowGlobalDropdown(false);
      setShowNotificationDropdown(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // User Management Tab sub-view state
  const [userSubTab, setUserSubTab] = useState<"teachers" | "admins">("teachers");

  // Modals / Form States
  const [showUserModal, setShowUserModal] = useState(false);
  const [userEditMode, setUserEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState({ id: "", name: "", email: "", password: "", role: "teacher" as "teacher" | "admin" });

  const [showClassModal, setShowClassModal] = useState(false);
  const [classEditMode, setClassEditMode] = useState(false);
  const [currentClass, setCurrentClass] = useState({ id: 0, class_name: "", department_id: 0, teacher_id: "" });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [currentDept, setCurrentDept] = useState({ id: 0, department_name: "" });

  // Bulk Upload State with refined columns
  const [csvText, setCsvText] = useState(
    "student_id,name,age,gender,family_income,internet_access,study_hours_per_day,attendance_rate,assignment_delay_days,travel_time_minutes,part_time_job,has_scholarship,gpa,semester_gpa,cgpa,financial_problem,semester_year\n" +
    "STU1001,Ahmed Hassan,21,Male,4500.0,true,3.5,82.5,2,25,false,true,3.1,3.2,3.1,false,3\n" +
    "STU1002,Fatima Ali,20,Female,1200.0,false,1.0,58.0,8,45,true,false,1.9,1.8,1.9,true,2\n" +
    "STU1003,Amina Yusuf,22,Female,2800.0,true,2.0,74.0,4,15,false,false,2.6,2.5,2.6,false,4\n" +
    "STU1004,Mohamed Ibrahim,22,Male,6000.0,true,4.5,95.0,0,10,false,true,3.8,3.9,3.8,false,3\n" +
    "STU1005,Hassan Omar,20,Male,3200.0,true,2.5,80.0,1,20,true,false,2.9,2.8,2.9,false,2\n" +
    "STU1006,Halima Ali,23,Female,1800.0,true,1.5,65.0,5,35,false,true,2.2,2.1,2.2,true,4\n" +
    "STU1007,Ali Salad,24,Male,900.0,false,0.5,45.0,10,50,true,false,1.5,1.4,1.5,true,1"
  );

  // --- Database count fetches ---
  const fetchCounts = useCallback(async () => {
    try {
      const { count: stdCount } = await supabase.from("students").select("*", { count: "exact", head: true });
      const { count: teachCount } = await supabase.from("teachers").select("*", { count: "exact", head: true });
      const { count: classCount } = await supabase.from("classes").select("*", { count: "exact", head: true });
      const { count: adminCount } = await supabase.from("administrators").select("*", { count: "exact", head: true });

      const { count: safeCountDb } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("risk_level", "Safe");
      const { count: atRiskCountDb } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("risk_level", "At-Risk");
      const { count: highRiskCountDb } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("risk_level", "High-Risk");

      const students = stdCount || 0;
      const teachers = teachCount || 0;
      const classes = classCount || 0;
      const admins = adminCount || 0;
      const safe = safeCountDb || 0;
      const atRisk = atRiskCountDb || 0;
      const highRisk = highRiskCountDb || 0;

      setTotalStudentsCount(students);
      setTotalTeachersCount(teachers);
      setTotalClassesCount(classes);
      setTotalAdminsCount(admins);
      setDbSafeCount(safe);
      setDbAtRiskCount(atRisk);
      setDbHighRiskCount(highRisk);

      // Save to localStorage to persist values across screen refreshes
      localStorage.setItem("dashboardCounts", JSON.stringify({
        students,
        teachers,
        classes,
        admins,
        safe,
        atRisk,
        highRisk
      }));
    } catch (err) {
      console.error("Failed to load counts", err);
    }
  }, []);

  // --- Paginated Fetches ---
  const predictAllStudents = useCallback(async (studentList: Student[]) => {
    if (studentList.length === 0) return;
    
    const payload = studentList.map(s => {
      const normalizeDept = (deptName: string): string => {
        const lower = (deptName || "").toLowerCase();
        if (lower.includes("computer") || lower.includes("cs")) return "CS";
        if (lower.includes("business") || lower.includes("admin")) return "Business";
        if (lower.includes("engineering")) return "Engineering";
        if (lower.includes("science")) return "Science";
        if (lower.includes("art")) return "Arts";
        return "CS";
      };

      const normalizedDept = normalizeDept(s.department_name || "CS");

      return {
        student_id: s.student_id,
        name: s.name,
        age: s.age,
        gender: s.gender,
        family_income: s.family_income,
        internet_access: s.internet_access,
        study_hours_per_day: s.study_hours_per_day,
        attendance_rate: s.attendance_rate,
        assignment_delay_days: s.assignment_delay_days,
        travel_time_minutes: s.travel_time_minutes,
        part_time_job: s.part_time_job,
        has_scholarship: s.has_scholarship,
        gpa: s.gpa,
        semester_gpa: s.semester_gpa,
        cgpa: s.cgpa,
        financial_problem: s.financial_problem,
        semester_year: s.semester_year,
        stress_index: (s as any).stress_index ?? 3.0,
        parent_education: (s as any).parent_education || "High School",
        department: normalizedDept
      };
    });

    try {
      const res = await fetch("/api/predict/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Bulk prediction failed");
      const results = await res.json();
      
      const newPredictions: Record<string, PredictionResult> = {};
      results.forEach((item: any) => {
        newPredictions[item.student_id] = {
          student_id: item.student_id,
          dropout_probability: item.dropout_probability,
          tier: item.tier || "Safe",
          recommendation: item.recommendation
        };
      });

      setPredictions(prev => ({ ...prev, ...newPredictions }));

      // Save calculations directly to Supabase to persist them
      const dbUpdates = results.map((item: any) => ({
        student_id: item.student_id,
        dropout_probability: item.dropout_probability,
        risk_level: item.tier || "Safe"
      }));
      await supabase.from("students").upsert(dbUpdates);
    } catch (err) {
      console.warn("Failed to run bulk predictions on load:", err);
    }
  }, []);

  const fetchStudents = useCallback(async (page: number, search: string, append = false) => {
    if (page === 0) {
      setLoading(true);
    } else {
      setLoadingMoreStudents(true);
    }

    try {
      let query = supabase.from("students").select("*");
      if (search) {
        query = query.or(`name.ilike.%${search}%,student_id.ilike.%${search}%`);
      }
      if (riskTierFilter && riskTierFilter !== "All") {
        query = query.eq("risk_level", riskTierFilter);
      }
      
      const start = page * 20;
      const end = (page + 1) * 20 - 1;
      const { data, error } = await query.range(start, end).order("student_id", { ascending: true });

      if (error) throw error;

      // Fetch class_students to dynamically enrich student's department_name
      const { data: classStudentsData } = await supabase
        .from("class_students")
        .select(`
          student_id,
          classes (
            departments (
              department_name
            )
          )
        `);

      const enrichedStudents = (data || []).map(student => {
        const match = (classStudentsData || []).find(cs => cs.student_id === student.student_id);
        const rawMatch: any = match;
        const deptName = rawMatch?.classes?.departments?.department_name || "Computer Science";
        return {
          ...student,
          department_name: deptName
        };
      });

      setStudents(prev => append ? [...prev, ...enrichedStudents] : enrichedStudents);
      setHasMoreStudents(enrichedStudents.length === 20);
      setStudentsPage(page);

      // Populate predictions directly from saved database fields
      const dbPredictions: Record<string, PredictionResult> = {};
      const studentsToPredict: Student[] = [];

      enrichedStudents.forEach((s: any) => {
        if (s.dropout_probability !== null && s.dropout_probability !== undefined && s.risk_level) {
          dbPredictions[s.student_id] = {
            student_id: s.student_id,
            dropout_probability: s.dropout_probability,
            tier: s.risk_level,
            recommendation: s.risk_level === "High-Risk"
              ? "High-Risk: High dropout risk detected. Urgently schedule direct administrative and counselor meetings."
              : s.risk_level === "At-Risk"
              ? "At-Risk: Check-in with student. Recommend academic tutoring or peer study groups."
              : "Safe: Student performance is stable. Continue standard academic pathway."
          };
        } else {
          studentsToPredict.push(s);
        }
      });

      setPredictions(prev => ({ ...prev, ...dbPredictions }));

      // Only run prediction for students missing prediction fields in the DB
      if (studentsToPredict.length > 0) {
        predictAllStudents(studentsToPredict);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load students");
    } finally {
      setLoading(false);
      setLoadingMoreStudents(false);
    }
  }, [predictAllStudents, riskTierFilter]);

  const fetchTeachers = useCallback(async (page: number, search: string, append = false) => {
    if (page === 0) {
      setLoading(true);
    } else {
      setLoadingMoreTeachers(true);
    }

    try {
      let query = supabase.from("teachers").select("*");
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const start = page * 20;
      const end = (page + 1) * 20 - 1;
      const { data, error } = await query.range(start, end).order("name", { ascending: true });

      if (error) throw error;

      setTeachers(prev => append ? [...prev, ...(data || [])] : (data || []));
      setHasMoreTeachers((data || []).length === 20);
      setTeachersPage(page);
    } catch (err: any) {
      toast.error(err.message || "Failed to load teachers");
    } finally {
      setLoading(false);
      setLoadingMoreTeachers(false);
    }
  }, []);

  const fetchAdmins = useCallback(async (page: number, search: string, append = false) => {
    if (!user?.isSuperAdmin) {
      setAdministrators([]);
      setHasMoreAdmins(false);
      return;
    }

    if (page === 0) {
      setLoading(true);
    } else {
      setLoadingMoreAdmins(true);
    }

    try {
      let query = supabase.from("administrators").select("*");
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const start = page * 20;
      const end = (page + 1) * 20 - 1;
      const { data, error } = await query.range(start, end).order("name", { ascending: true });

      if (error) throw error;

      setAdministrators(prev => append ? [...prev, ...(data || [])] : (data || []));
      setHasMoreAdmins((data || []).length === 20);
      setAdminsPage(page);
    } catch (err: any) {
      toast.error(err.message || "Failed to load administrators");
    } finally {
      setLoading(false);
      setLoadingMoreAdmins(false);
    }
  }, [user?.isSuperAdmin]);

  // Initial and reactive fetches
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchCounts();
      
      // Fetch departments and classes
      const { data: dData } = await supabase.from("departments").select("*");
      setDepartments(dData || []);

      const { data: cData } = await supabase.from("classes").select("id, class_name, department_id, teacher_id");
      const enrichedClasses = (cData || []).map(cls => {
        const dept = (dData || []).find(d => d.id === cls.department_id);
        return {
          ...cls,
          departments: dept ? { department_name: dept.department_name } : null
        };
      });
      setClasses(enrichedClasses);
    } catch (err: any) {
      toast.error(err.message || "Failed to load database records");
    } finally {
      setLoading(false);
    }
  }, [fetchCounts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle debounced search changes and tab switching
  useEffect(() => {
    if (activeTab === "dashboard" || activeTab === "risk") {
      fetchStudents(0, debouncedRiskSearchTerm, false);
    }
  }, [debouncedRiskSearchTerm, riskTierFilter, activeTab, fetchStudents]);

  useEffect(() => {
    if (activeTab === "teachers") {
      fetchTeachers(0, debouncedTeachersSearchTerm, false);
    }
  }, [debouncedTeachersSearchTerm, activeTab, fetchTeachers]);

  useEffect(() => {
    if (activeTab === "teachers") {
      fetchAdmins(0, debouncedAdminsSearchTerm, false);
    }
  }, [debouncedAdminsSearchTerm, activeTab, fetchAdmins]);

  const handleSync = async () => {
    setLoading(true);
    setRiskSearchTerm("");
    setTeachersSearchTerm("");
    setAdminsSearchTerm("");
    setGlobalSearchTerm("");
    try {
      router.refresh();
      await fetchCounts();
      await Promise.all([
        fetchStudents(0, "", false),
        fetchTeachers(0, "", false),
        fetchAdmins(0, "", false)
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPredictions = async () => {
    setIsRefreshingPredictions(true);
    try {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      if (data && data.length > 0) {
        await predictAllStudents(data);
        toast.success("Prediction values refreshed for all students!");
        await fetchStudents(0, riskSearchTerm, false);
        await fetchCounts();
      } else {
        toast.error("No students found to predict");
      }
    } catch (err: any) {
      toast.error(err.message || "Refresh failed");
    } finally {
      setIsRefreshingPredictions(false);
    }
  };

  // --- Generate Prediction Report ---
  const handleGenerateReport = async (student: Student) => {
    setLoadingReports(prev => ({ ...prev, [student.student_id]: true }));
    try {
      let studentRecord = student;
      let departmentName = student.department_name || "CS";

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", student.student_id)
        .single();

      if (error) throw error;
      if (data) studentRecord = data;

      // Normalize department name to match expected ML model one-hot categories (CS, Business, Engineering, Science, Arts)
      const normalizeDept = (deptName: string): string => {
        const lower = deptName.toLowerCase();
        if (lower.includes("computer") || lower.includes("cs")) return "CS";
        if (lower.includes("business") || lower.includes("admin")) return "Business";
        if (lower.includes("engineering")) return "Engineering";
        if (lower.includes("science")) return "Science";
        if (lower.includes("art")) return "Arts";
        return "CS"; // Default fallback
      };

      const normalizedDept = normalizeDept(departmentName);

      // 2. Call our proxy prediction endpoint
      const res = await fetch("/api/predict/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: studentRecord.age,
          gender: studentRecord.gender,
          family_income: studentRecord.family_income,
          internet_access: studentRecord.internet_access,
          study_hours_per_day: studentRecord.study_hours_per_day,
          attendance_rate: studentRecord.attendance_rate,
          assignment_delay_days: studentRecord.assignment_delay_days,
          travel_time_minutes: studentRecord.travel_time_minutes,
          part_time_job: studentRecord.part_time_job,
          has_scholarship: studentRecord.has_scholarship,
          gpa: studentRecord.gpa,
          semester_gpa: studentRecord.semester_gpa,
          cgpa: studentRecord.cgpa,
          financial_problem: studentRecord.financial_problem,
          semester_year: studentRecord.semester_year,
          department: normalizedDept
        })
      });

      if (!res.ok) {
        throw new Error(`Proxy returned status ${res.status}`);
      }

      const result = await res.json();
      
      // Update predictions state
      setPredictions(prev => ({
        ...prev,
        [student.student_id]: {
          student_id: student.student_id,
          dropout_probability: result.dropout_probability,
          tier: result.tier || "Safe",
          recommendation: result.recommendation
        }
      }));

      toast.success(`Warbixinta saadaalinta ee ardayga ${student.name} waa la diyaariyey!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate risk prediction");
    } finally {
      setLoadingReports(prev => ({ ...prev, [student.student_id]: false }));
    }
  };

  // --- CRUD Functions ---

  // 1. User CRUD (Teachers & Administrators)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.name || !currentUser.email) {
      toast.error("Fadlan magaca iyo emailka geli");
      return;
    }
    if (!userEditMode && !currentUser.password) {
      toast.error("Fadlan geli password-ka");
      return;
    }

    setLoading(true);
    try {
      if (userEditMode) {
        const targetTable = currentUser.role === "admin" ? "administrators" : "teachers";
        const { error } = await supabase
          .from(targetTable)
          .update({ name: currentUser.name, email: currentUser.email })
          .eq("id", currentUser.id);
        if (error) throw error;
        toast.success(currentUser.role === "admin" ? "Maamulaha waa la cusboonaysiiyey!" : "Macalinka waa la cusboonaysiiyey!");
      } else {
        // Create new user in Supabase Auth & insert UUID into corresponding table via our server API route
        const endpoint = currentUser.role === "admin" ? "/api/users/create-admin" : "/api/users/create-teacher";
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: currentUser.name,
            email: currentUser.email,
            password: currentUser.password,
            is_super_admin: false
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `User creation status ${res.status}`);
        }

        toast.success(currentUser.role === "admin" ? "Maamule cusub ayaa lagu daray!" : "Macalin cusub ayaa lagu daray!");
      }
      setShowUserModal(false);
      fetchData();
      if (currentUser.role === "admin") {
        fetchAdmins(0, adminsSearchTerm, false);
      } else {
        fetchTeachers(0, teachersSearchTerm, false);
      }
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, role: "admin" | "teacher") => {
    if (!confirm(role === "admin" ? "Ma hubaal baa inaad rabto inaad tirtirto maamulahaan?" : "Ma hubaal baa inaad rabto inaad tirtirto macalinkaan?")) return;

    try {
      const targetTable = role === "admin" ? "administrators" : "teachers";
      const { error } = await supabase.from(targetTable).delete().eq("id", id);
      if (error) throw error;
      toast.success(role === "admin" ? "Maamulaha waa la tirtiray!" : "Macalinka waa la tirtiray!");
      fetchData();
      if (role === "admin") {
        fetchAdmins(0, adminsSearchTerm, false);
      } else {
        fetchTeachers(0, teachersSearchTerm, false);
      }
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // 2. Class CRUD
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass.class_name || !selectedDepartmentId) {
      toast.error("Fadlan geli magaca fasalka iyo qaybta");
      return;
    }

    try {
      const payload = {
        class_name: currentClass.class_name,
        department_id: Number(selectedDepartmentId),
        teacher_id: currentClass.teacher_id || null
      };

      if (classEditMode) {
        const { error } = await supabase.from("classes").update(payload).eq("id", currentClass.id);
        if (error) throw error;
        toast.success("Fasalka waa la cusboonaysiiyey!");
      } else {
        const { error } = await supabase.from("classes").insert(payload);
        if (error) throw error;
        toast.success("Fasal cusub ayaa lagu daray!");
      }
      setShowClassModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm("Ma hubaal baa inaad rabto inaad tirtirto fasalkaan?")) return;

    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Fasalka waa la tirtiray!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // 3. Department CRUD
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDept.department_name) return;

    try {
      const { error } = await supabase.from("departments").insert({ department_name: currentDept.department_name });
      if (error) throw error;
      toast.success("Waax cusub ayaa lagu daray!");
      setShowDeptModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!confirm("Ma hubaal baa in aad rabto in aad tirtirto waaxdan?")) return;

    try {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Waaxda waa la tirtiray!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  // 4. Bulk CSV Upload
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("CSV structure requires header and at least 1 record");
      }

      const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
      const parsedRows: Student[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(",").map(v => v.trim());
        const row: any = {};
        
        headers.forEach((h, idx) => {
          const val = vals[idx];
          if (h === "age" || h === "assignment_delay_days" || h === "travel_time_minutes" || h === "semester_year") {
            row[h] = parseInt(val) || 0;
          } else if (h === "family_income" || h === "study_hours_per_day" || h === "attendance_rate" || h === "gpa" || h === "semester_gpa" || h === "cgpa") {
            row[h] = parseFloat(val) || 0.0;
          } else if (h === "internet_access" || h === "part_time_job" || h === "has_scholarship" || h === "financial_problem") {
            row[h] = val.toLowerCase() === "true" || val === "1";
          } else {
            row[h] = val || "";
          }
        });

        if (!row.student_id) throw new Error(`Row ${i + 1} is missing student_id`);
        parsedRows.push(row as Student);
      }

      // Live mode upsert
      const { error } = await supabase.from("students").upsert(parsedRows);
      if (error) throw error;
      toast.success(`Guul! ${parsedRows.length} arday ayaa la geliyey database-ka!`);
      fetchData();
      setActiveTab("risk");
    } catch (err: any) {
      toast.error(err.message || "CSV parse/upload error");
    }
  };

  // Helper metrics
  const totalStudents = totalStudentsCount;
  const totalTeachers = totalTeachersCount;
  const totalClasses = totalClassesCount;

  // Filter lists (now managed on database side)
  const filteredStudents = students;

  // Dynamically calculate risk statistics for stats cards and doughnut chart
  const atRiskCount = Object.values(predictions).filter(
    p => p.tier === "At-Risk"
  ).length;
  const highRiskCount = Object.values(predictions).filter(
    p => p.tier === "High-Risk"
  ).length;
  const safeCount = Math.max(0, students.length - atRiskCount - highRiskCount);

  const total = students.length || 1;
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

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return "N/A";
    }
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
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ backfaceVisibility: "hidden", transform: "translate3d(0,0,0)" }}
        className="min-h-screen flex bg-[#f3f6fd] font-sans antialiased text-slate-800 w-full"
      >
        <Toaster position="top-right" />

      {/* Sidebar - Dark Navy Premium */}
      <aside className="w-72 bg-[#0c1329] text-[#8f9cae] flex flex-col justify-between p-6 shrink-0 relative z-30 h-screen sticky top-0 border-r border-slate-800/40">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#6366f1] flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Building size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-wider text-white">Dropout<span className="text-indigo-400">SyS</span></span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">University Portal</span>
            </div>
          </div>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3">
            Navigation Menu
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "upload", label: "Bulk Upload (CSV)", icon: Upload },
              { id: "manual-register", label: "Manual Registration", icon: Plus },
              { id: "risk", label: "Risk Analytics", icon: AlertTriangle },
              { id: "teachers", label: "User Management", icon: Users },
              { id: "departments", label: "Departments & Classes", icon: Building },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 text-xs font-bold cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Card at Sidebar Bottom */}
        <div className="space-y-4">
          <div className="bg-[#121a36] rounded-2xl p-4 flex items-center justify-between border border-white/5 shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0">
                {(user?.name || "A").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate leading-tight">{user?.name || "Admin"}</span>
                <span className="text-[10px] text-slate-400 leading-tight truncate">System Owner</span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 border-2 border-[#121a36]" title="System Online"></div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl border border-rose-500/10 hover:border-rose-500/20 transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Sticky Header inside Main Content */}
        <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-[#f3f6fd] z-20">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Welcome back, {user?.name || "Administrator"} <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold">Here's what's happening at DropoutSyS today.</p>
          </div>

          {/* Search bar & notification controls */}
          <div className="flex items-center gap-6">
            <div className="relative w-80 hidden md:block" onClick={(e) => e.stopPropagation()}>
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students, teachers, admins..."
                value={globalSearchTerm}
                onChange={(e) => {
                  setGlobalSearchTerm(e.target.value);
                  setShowGlobalDropdown(true);
                }}
                className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-12 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
              <kbd className="absolute right-3 top-3 bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-400 px-1.5 py-0.5 rounded-md">
                ⌘ K
              </kbd>
              
              {showGlobalDropdown && globalSearchTerm.trim() !== "" && (
                <div 
                  className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {loadingGlobalSearch ? (
                    <div className="p-4 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent shrink-0" />
                      <span>Waa la raadinayaa...</span>
                    </div>
                  ) : globalSearchResults.students.length === 0 && globalSearchResults.users.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-bold">
                      Wax natiijo ah lama helin
                    </div>
                  ) : (
                    <div className="p-2 space-y-3">
                      {/* Students Category */}
                      {globalSearchResults.students.length > 0 && (
                        <div className="space-y-1">
                          <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg text-left">
                            Ardayda (Students)
                          </div>
                          {globalSearchResults.students.map(std => (
                            <button
                              key={std.student_id}
                              onClick={() => {
                                router.push(`/administrator/students/${std.student_id}` as any);
                                setShowGlobalDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-indigo-50/50 rounded-xl transition flex items-center justify-between text-xs cursor-pointer group animate-pulse-none"
                            >
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600">{std.name}</span>
                              <span className="font-mono text-[10px] text-slate-400 font-bold">{std.student_id}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Users Category */}
                      {globalSearchResults.users.length > 0 && (
                        <div className="space-y-1">
                          <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg text-left">
                            Isticmaalayaasha (Users)
                          </div>
                          {globalSearchResults.users.map((u, ui) => (
                            <div
                              key={ui}
                              className="px-3 py-2 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-slate-950">{u.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium font-mono">{u.email}</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase bg-slate-100 border border-slate-200 text-slate-500 font-mono shrink-0">
                                {u.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleSync}
                className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition shadow-xs relative cursor-pointer"
                title="Synchronize Database Records"
              >
                <RefreshCw size={15} />
              </button>

              {/* Notification Bell Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className={`p-2.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition shadow-xs relative cursor-pointer ${
                    showNotificationDropdown ? "text-indigo-600 ring-2 ring-indigo-500/25" : "text-slate-600"
                  }`}
                  title="Notifications (Digniinnada)"
                >
                  <Bell size={15} />
                  {dbHighRiskCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white">
                      {dbHighRiskCount}
                    </span>
                  )}
                </button>

                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 tracking-tight">Notifications (Digniinnada)</span>
                      {dbHighRiskCount > 0 && (
                        <span className="bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono">
                          {dbHighRiskCount} Critical
                        </span>
                      )}
                    </div>
                    
                    <div className="p-3 max-h-96 overflow-y-auto space-y-2">
                      {dbHighRiskCount > 0 ? (
                        <div className="bg-rose-50/75 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5 text-left">
                          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-[11px] font-black text-rose-950">Digniin: Xaalad Halis ah! (Halis Sare)</h4>
                            <p className="text-[10px] text-rose-800 font-semibold leading-normal">
                              Waxaa jira <strong>{dbHighRiskCount} arday</strong> oo halis sare (High-Risk) ugu jira inay ka haraan jaamacadda. Fadlan dib u eeg tab-ka <strong>Risk Analytics</strong>.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400 font-semibold text-[10px]">
                          No new alerts (Ma jiraan digniino cusub)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-xs shadow-sm overflow-hidden shrink-0 border border-slate-100">
                  AD
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-tight">Admin</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">Administrator</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 pt-0 overflow-y-auto">
          <div className="max-w-[1500px] mx-auto space-y-6">

            {/* --- TAB 1: DASHBOARD (SIMAD Mockup Redesign) --- */}
            {activeTab === "dashboard" && (
              <DashboardTab
                students={students}
                classes={classes}
                departments={departments}
                predictions={predictions}
                setActiveTab={setActiveTab}
                handleGenerateReport={handleGenerateReport}
                totalStudentsCount={totalStudentsCount}
                totalTeachersCount={totalTeachersCount}
                totalClassesCount={totalClassesCount}
                totalAdminsCount={totalAdminsCount}
                dbSafeCount={dbSafeCount}
                dbAtRiskCount={dbAtRiskCount}
                dbHighRiskCount={dbHighRiskCount}
                loading={loading}
              />
            )}

            {/* --- TAB 2: BULK UPLOAD --- */}
            {activeTab === "upload" && (
              <DataImport />
            )}

            {/* --- TAB: MANUAL REGISTRATION --- */}
            {activeTab === "manual-register" && (
              <AdminManualRegistration />
            )}

            {/* --- TAB 3: RISK ANALYTICS --- */}
            {activeTab === "risk" && (
              <RiskTab
                searchTerm={riskSearchTerm}
                setSearchTerm={setRiskSearchTerm}
                tierFilter={riskTierFilter}
                setTierFilter={setRiskTierFilter}
                filteredStudents={filteredStudents}
                predictions={predictions}
                loadingReports={loadingReports}
                handleGenerateReport={handleGenerateReport}
                hasMore={hasMoreStudents}
                loadingMore={loadingMoreStudents}
                loadMore={() => fetchStudents(studentsPage + 1, debouncedRiskSearchTerm, true)}
                onAddStudent={() => {
                  setStudentEditMode(false);
                  setCurrentStudent({
                    student_id: "",
                    name: "",
                    age: 20,
                    gender: "Male",
                    family_income: 3000,
                    internet_access: true,
                    study_hours_per_day: 2.5,
                    attendance_rate: 100,
                    assignment_delay_days: 0,
                    travel_time_minutes: 15,
                    part_time_job: false,
                    has_scholarship: false,
                    gpa: 3.0,
                    semester_gpa: 3.0,
                    cgpa: 3.0,
                    financial_problem: false,
                    semester_year: 1,
                    stress_index: 3.0,
                    parent_education: "High School"
                  });
                  setSelectedFacultyId("");
                  setSelectedDepartmentId("");
                  setSelectedDegreeId("");
                  setShowStudentModal(true);
                }}
                onEditStudent={handleEditStudentClick}
                onDeleteStudent={handleDeleteStudent}
                onRefreshPredictions={handleRefreshPredictions}
                isRefreshingPredictions={isRefreshingPredictions}
              />
            )}

            {/* --- TAB 4: USER MANAGEMENT --- */}
            {activeTab === "teachers" && (
              <UsersTab
                user={user}
                userSubTab={userSubTab}
                setUserSubTab={setUserSubTab}
                teachers={teachers}
                administrators={administrators}
                setUserEditMode={setUserEditMode}
                setCurrentUser={setCurrentUser}
                setShowUserModal={setShowUserModal}
                handleDeleteUser={handleDeleteUser}
                formatDate={formatDate}
                loading={loading}
                teachersSearchTerm={teachersSearchTerm}
                setTeachersSearchTerm={setTeachersSearchTerm}
                adminsSearchTerm={adminsSearchTerm}
                setAdminsSearchTerm={setAdminsSearchTerm}
                hasMoreTeachers={hasMoreTeachers}
                loadingMoreTeachers={loadingMoreTeachers}
                loadMoreTeachers={() => fetchTeachers(teachersPage + 1, debouncedTeachersSearchTerm, true)}
                hasMoreAdmins={hasMoreAdmins}
                loadingMoreAdmins={loadingMoreAdmins}
                loadMoreAdmins={() => fetchAdmins(adminsPage + 1, debouncedAdminsSearchTerm, true)}
              />
            )}

            {/* --- TAB 5: DEPARTMENTS & CLASSES --- */}
            {activeTab === "departments" && (
              <DepartmentsTab
                departments={departments}
                classes={classes}
                teachers={teachers}
                setCurrentDept={setCurrentDept}
                setShowDeptModal={setShowDeptModal}
                handleDeleteDept={handleDeleteDept}
                setClassEditMode={setClassEditMode}
                setCurrentClass={setCurrentClass}
                setShowClassModal={handleShowClassModal}
                handleDeleteClass={handleDeleteClass}
              />
            )}

          </div>
        </main>
      </div>

      {/* --- PREMIUM STYLED GLASSY MODALS --- */}

      {/* 1. User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-[#0c1329]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-150 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {userEditMode 
                  ? (currentUser.role === "admin" ? "Wax ka badal Maamulaha" : "Wax ka badal Macalinka") 
                  : (currentUser.role === "admin" ? "Ku dar Maamule Cusub" : "Ku dar Macalin Cusub")
                }
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><Info size={16} /></button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* Role Selection (Only editable during creation) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dooro Role-ka</label>
                 <select
                  disabled={userEditMode}
                  value={currentUser.role}
                  onChange={(e) => setCurrentUser(prev => ({ ...prev, role: e.target.value as "admin" | "teacher" }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="teacher">Teacher (Macallin)</option>
                   {user?.isSuperAdmin && (
                    <option value="admin">Administrator (Maamule)</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Magaca Buuxa</label>
                <input
                  type="text"
                  required
                  placeholder={currentUser.role === "admin" ? "Ahmed Noor" : "Prof. Ahmed Noor"}
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Password entry (Required only for user creation) */}
              {!userEditMode && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password-ka Koontada</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentUser.password}
                    onChange={(e) => setCurrentUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-md cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-[#0c1329]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-150 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">{classEditMode ? "Wax ka badal Fasalka" : "Ku dar Fasal Cusub"}</h3>
              <button onClick={() => handleShowClassModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><Info size={16} /></button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Magaca Fasalka / Koorso</label>
                <input
                  type="text"
                  required
                  placeholder="CS-301 Software Engineering"
                  value={currentClass.class_name}
                  onChange={(e) => setCurrentClass(prev => ({ ...prev, class_name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kulliyadda (Faculty)</label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                >
                  <option value="">-- Dooro Kulliyadda --</option>
                  {facultiesList.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Waaxda (Department)</label>
                <select
                  disabled={!selectedFacultyId}
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {loadingDepartments ? "Waa la soo rarayaa..." : !selectedFacultyId ? "-- Marka hore dooro Kulliyad --" : "-- Dooro Waaxda --"}
                  </option>
                  {departmentsList.map(d => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">U dhiib Macallin (Teacher)</label>
                <select
                  value={currentClass.teacher_id}
                  onChange={(e) => setCurrentClass(prev => ({ ...prev, teacher_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Lama u dhiibin macalin --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => handleShowClassModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-md cursor-pointer transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-[#0c1329]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-150 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">Ku dar Waax</h3>
            <form onSubmit={handleSaveDept} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Magaca Waaxda (Department Name)</label>
                <input
                  type="text"
                  required
                  placeholder="Engineering"
                  value={currentDept.department_name}
                  onChange={(e) => setCurrentDept({ id: 0, department_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-md cursor-pointer transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-[#0c1329]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-150 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {studentEditMode ? "Wax ka badal Macluumaadka Ardayga" : "Ku dar Arday Cusub"}
              </h3>
              <button 
                onClick={() => setShowStudentModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer animate-in duration-75"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-6">
              {/* Grid 1: Basic Info */}
              <div>
                <h4 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-3">Xogta Asaasiga ah (Basic Information)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student ID (Diiwaanka)</label>
                    <input
                      type="text"
                      required
                      disabled={studentEditMode}
                      placeholder="STU1001"
                      value={currentStudent.student_id}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, student_id: e.target.value }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Magaca Buuxa (Full Name)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ahmed Ali Hassan"
                      value={currentStudent.name}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Da'da (Age)</label>
                    <input
                      type="number"
                      required
                      min={15}
                      max={60}
                      value={currentStudent.age}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, age: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jinsiga (Gender)</label>
                    <select
                      value={currentStudent.gender}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, gender: e.target.value as "Male" | "Female" }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="Male">Lab (Male)</option>
                      <option value="Female">Dhedig (Female)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid 2: Academic Metrics */}
              <div>
                <h4 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-3">Natiijooyinka Akadeemiyada (Academic Metrics)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">GPA</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min={0}
                      max={4}
                      value={currentStudent.gpa}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, gpa: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Semester GPA</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min={0}
                      max={4}
                      value={currentStudent.semester_gpa}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, semester_gpa: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">CGPA</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min={0}
                      max={4}
                      value={currentStudent.cgpa}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, cgpa: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Semester Year</label>
                    <select
                      value={currentStudent.semester_year}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, semester_year: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {[1, 2, 3, 4].map(y => (
                        <option key={y} value={y}>Sanadka {y}-aad</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance Rate (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      step="0.1"
                      value={currentStudent.attendance_rate}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, attendance_rate: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Study Hours / Day</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={24}
                      step="0.1"
                      value={currentStudent.study_hours_per_day}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, study_hours_per_day: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 3: Socioeconomic & Behavioral */}
              <div>
                <h4 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-3">Dhaqaalaha & Dabeecada (Socioeconomic & Behavioral)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Family Income ($)</label>
                    <input
                      type="number"
                      required
                      value={currentStudent.family_income}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, family_income: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Travel Time (Minutes)</label>
                    <input
                      type="number"
                      required
                      value={currentStudent.travel_time_minutes}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, travel_time_minutes: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assignment Delay Days</label>
                    <input
                      type="number"
                      required
                      value={currentStudent.assignment_delay_days}
                      onChange={(e) => setCurrentStudent(prev => ({ ...prev, assignment_delay_days: Number(e.target.value) }))}
                      className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  {/* Checkboxes Group */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentStudent.internet_access}
                        onChange={(e) => setCurrentStudent(prev => ({ ...prev, internet_access: e.target.checked }))}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span>Internet Access</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentStudent.part_time_job}
                        onChange={(e) => setCurrentStudent(prev => ({ ...prev, part_time_job: e.target.checked }))}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span>Part-time Job</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentStudent.has_scholarship}
                        onChange={(e) => setCurrentStudent(prev => ({ ...prev, has_scholarship: e.target.checked }))}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span>Scholarship</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentStudent.financial_problem}
                        onChange={(e) => setCurrentStudent(prev => ({ ...prev, financial_problem: e.target.checked }))}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span>Financial Problem</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parent Education</label>
                      <select
                        value={currentStudent.parent_education || "High School"}
                        onChange={(e) => setCurrentStudent(prev => ({ ...prev, parent_education: e.target.value }))}
                        className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="High School">Dugsiga Sare (High School)</option>
                        <option value="Bachelor">Bachelor (Degree)</option>
                        <option value="Master">Master</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stress Index (0-10)</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step="0.1"
                        required
                        value={currentStudent.stress_index ?? 3.0}
                        onChange={(e) => setCurrentStudent(prev => ({ ...prev, stress_index: Number(e.target.value) }))}
                        className="w-full text-slate-900 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 4: Cascading Dropdowns */}
              <div>
                <h4 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-3">Kulliyadda, Qaybta & Degree-ga (Academic Routing)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Faculty Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kulliyadda (Faculty)</label>
                    <select
                      value={selectedFacultyId}
                      onChange={(e) => setSelectedFacultyId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                    >
                      <option value="">-- Dooro Kulliyadda --</option>
                      {facultiesList.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Waaxda (Department)</label>
                    <select
                      disabled={!selectedFacultyId}
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {loadingDepartments ? "Waa la rari..." : !selectedFacultyId ? "-- Dooro Kulliyad horta --" : "-- Dooro Waaxda --"}
                      </option>
                      {departmentsList.map(d => (
                        <option key={d.id} value={d.id}>{d.department_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Degree Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Degree-ga (Degree Program)</label>
                    <select
                      disabled={!selectedDepartmentId}
                      value={selectedDegreeId}
                      onChange={(e) => setSelectedDegreeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {loadingDegrees ? "Waa la rari..." : !selectedDepartmentId ? "-- Dooro Waaxda horta --" : "-- Dooro Degree --"}
                      </option>
                      {degreesList.map(dg => (
                        <option key={dg.id} value={dg.id}>{dg.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer transition"
                >
                  Jooji (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-md cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      <span>Kaydinayaa...</span>
                    </>
                  ) : (
                    "Kaydi (Save)"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </motion.div>
    </AnimatePresence>
  );
}
