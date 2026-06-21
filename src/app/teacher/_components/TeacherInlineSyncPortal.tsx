"use client";

import React, { useState, useEffect } from "react";
import { Loader2, RefreshCw, AlertCircle, Save } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

interface TeacherStudent {
  student_id: string;
  name: string;
  department_name: string;
  attendance_rate: number;
  gpa: number;
  semester_gpa: number;
  assignment_delay_days: number;
  risk_level: string;
  dropout_probability: number;
  // hidden fields needed for ML
  age: number;
  gender: string;
  family_income: number;
  internet_access: boolean;
  study_hours_per_day: number;
  part_time_job: boolean;
  has_scholarship: boolean;
  travel_time_minutes: number;
  stress_index: number;
  financial_problem: boolean;
  semester_year: number;
  parent_education: string;
}

export default function TeacherInlineSyncPortal() {
  const { user } = useAuth();
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [user?.teacherId]);

  const fetchStudents = async () => {
    if (!user?.teacherId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Get classes assigned to this teacher
      const { data: teacherClasses, error: classError } = await supabase
        .from("classes")
        .select("id, class_name, department_id")
        .eq("teacher_id", user.teacherId);

      if (classError) throw classError;

      const classIds = (teacherClasses || []).map(c => c.id);
      if (classIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // 2. Get students in those classes
      const { data: junctionData, error: juncError } = await supabase
        .from("class_students")
        .select("student_id, class_id")
        .in("class_id", classIds);

      if (juncError) throw juncError;

      const studentIds = (junctionData || []).map(j => j.student_id);
      if (studentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // 3. Get students details
      const { data: stds, error: stdError } = await supabase
        .from("students")
        .select("*")
        .in("student_id", studentIds)
        .order("name", { ascending: true });

      if (stdError) throw stdError;

      // 4. Enrich students with department name
      const { data: deptData } = await supabase.from("departments").select("id, department_name");
      
      const enriched = (stds || []).map(student => {
        const matchJunc = (junctionData || []).find(j => j.student_id === student.student_id);
        const matchClass = (teacherClasses || []).find(c => c.id === matchJunc?.class_id);
        const matchDept = (deptData || []).find(d => d.id === matchClass?.department_id);
        return {
          ...student,
          department_name: matchDept?.department_name || "CS"
        };
      });

      setStudents(enriched as any[]);
    } catch (err) {
      console.error("Failed to fetch students in inline sync:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (studentId: string, field: keyof TeacherStudent, value: number) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, [field]: value } : s));
  };

  const syncStudent = async (student: TeacherStudent) => {
    setSavingId(student.student_id);
    try {
      // 1. Send to Stateless FastAPI proxy
      const response = await fetch("/api/predict/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...student,
          department: student.department_name
        }),
      });

      if (!response.ok) throw new Error("Failed prediction");
      const mlResult = await response.json();

      // 2. Update Supabase
      const { error } = await supabase
        .from("students")
        .update({
          attendance_rate: student.attendance_rate,
          gpa: student.gpa,
          semester_gpa: student.semester_gpa,
          assignment_delay_days: student.assignment_delay_days,
          dropout_probability: mlResult.dropout_probability,
          risk_level: mlResult.tier,
        })
        .eq("student_id", student.student_id);

      if (error) throw error;

      // Update local state with new risk tier
      setStudents(prev => prev.map(s => 
        s.student_id === student.student_id ? { 
          ...s, 
          dropout_probability: mlResult.dropout_probability, 
          risk_level: mlResult.tier 
        } : s
      ));

    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Teacher Inline Sync Portal</h2>
          <p className="text-xs text-slate-500">Edit metrics below. Changes instantly recalculate ML risk predictions.</p>
        </div>
        <button onClick={fetchStudents} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Attendance (%)</th>
              <th className="px-6 py-4">GPA</th>
              <th className="px-6 py-4">Semester GPA</th>
              <th className="px-6 py-4">Delay Days</th>
              <th className="px-6 py-4">Risk Tier</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map(student => (
              <tr key={student.student_id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{student.name}</div>
                  <div className="text-xs text-slate-500">{student.student_id}</div>
                </td>
                <td className="px-6 py-4">
                  <input type="number" step="0.1" value={student.attendance_rate} onChange={(e) => handleEdit(student.student_id, "attendance_rate", parseFloat(e.target.value))} className="w-20 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </td>
                <td className="px-6 py-4">
                  <input type="number" step="0.01" value={student.gpa} onChange={(e) => handleEdit(student.student_id, "gpa", parseFloat(e.target.value))} className="w-20 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </td>
                <td className="px-6 py-4">
                  <input type="number" step="0.01" value={student.semester_gpa} onChange={(e) => handleEdit(student.student_id, "semester_gpa", parseFloat(e.target.value))} className="w-20 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </td>
                <td className="px-6 py-4">
                  <input type="number" value={student.assignment_delay_days} onChange={(e) => handleEdit(student.student_id, "assignment_delay_days", parseInt(e.target.value))} className="w-20 px-2 py-1 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    student.risk_level === 'High-Risk' ? 'bg-rose-100 text-rose-700' :
                    student.risk_level === 'At-Risk' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {student.risk_level} ({(student.dropout_probability * 100).toFixed(1)}%)
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => syncStudent(student)}
                    disabled={savingId === student.student_id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-lg hover:bg-indigo-100 transition disabled:opacity-50"
                  >
                    {savingId === student.student_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Sync ML
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                  <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  No students assigned or found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
