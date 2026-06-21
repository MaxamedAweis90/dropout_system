"use client";

import React, { useState } from "react";
import { Save, Loader2, UserPlus, FileText, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminManualRegistration() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    // Student identification
    student_id: "",
    full_name: "",
    
    // Demographic
    age: 20,
    gender: "male",
    parent_education: "High School",
    
    // Academic
    department: "CS",
    semester_year: 1,
    gpa: 4.0,
    semester_gpa: 4.0,
    cgpa: 4.0,
    study_hours_per_day: 2.0,
    attendance_rate: 100.0,
    assignment_delay_days: 0,
    
    // Socioeconomic & Other
    family_income: 3000,
    internet_access: true,
    part_time_job: false,
    has_scholarship: false,
    travel_time_minutes: 15,
    stress_index: 3.0,
    financial_problem: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === "number") parsedValue = parseFloat(value);
    if (type === "checkbox") parsedValue = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id.trim() || !formData.full_name.trim()) {
      setMessage({ type: "error", text: "Fadlan geli ID-ga iyo Magaca ardayga." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Get Prediction from Stateless ML FastAPI Backend
      const mlResponse = await fetch("/api/predict/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!mlResponse.ok) throw new Error("Failed to get prediction from ML Service.");
      
      const prediction = await mlResponse.json();

      // 2. Insert into Supabase with standard schema columns
      const { data, error } = await supabase
        .from("students")
        .insert([{
          student_id: formData.student_id.trim(),
          name: formData.full_name.trim(),
          age: Number(formData.age),
          gender: formData.gender === "male" ? "Male" : "Female",
          family_income: Number(formData.family_income),
          internet_access: Boolean(formData.internet_access),
          study_hours_per_day: Number(formData.study_hours_per_day),
          attendance_rate: Number(formData.attendance_rate),
          assignment_delay_days: Number(formData.assignment_delay_days),
          travel_time_minutes: Number(formData.travel_time_minutes),
          part_time_job: Boolean(formData.part_time_job),
          has_scholarship: Boolean(formData.has_scholarship),
          gpa: Number(formData.gpa),
          semester_gpa: Number(formData.semester_gpa),
          cgpa: Number(formData.cgpa),
          financial_problem: Boolean(formData.financial_problem),
          semester_year: Number(formData.semester_year),
          dropout_probability: Number(prediction.dropout_probability),
          risk_level: prediction.tier,
          stress_index: Number(formData.stress_index),
          parent_education: formData.parent_education
        }])
        .select();

      if (error) throw error;

      // 3. Link student to class_students
      try {
        const { data: depts } = await supabase.from("departments").select("*");
        const { data: classes } = await supabase.from("classes").select("*");
        if (depts && classes) {
          const matchedDept = depts.find(d => d.department_name.toLowerCase().includes(formData.department.toLowerCase()) || formData.department.toLowerCase().includes(d.department_name.toLowerCase()));
          if (matchedDept) {
            const matchedClass = classes.find(c => c.department_id === matchedDept.id);
            if (matchedClass) {
              await supabase.from("class_students").upsert({
                class_id: matchedClass.id,
                student_id: formData.student_id.trim()
              });
            }
          }
        }
      } catch (linkErr) {
        console.warn("Failed to link student to class:", linkErr);
      }

      setMessage({ type: "success", text: `Ardayga waa la diiwaan geliyay! Tier: ${prediction.tier} (${(prediction.dropout_probability * 100).toFixed(1)}%)` });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Cilad ayaa dhacday." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-indigo-600" />
          Diiwaangelinta Arday Cusub (Manual)
        </h2>
        <p className="text-xs text-slate-500 mt-1">Ku qor xogta ardayga si toos ah database-ka loogu daro oo model-ka uu u saadaaliyo.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Demographics */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
            <UserPlus className="h-4 w-4" /> 1. Xogta Shakhsiga (Demographics)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Student ID (Card Number)</label>
              <input required type="text" name="student_id" placeholder="e.g. STU1088" value={formData.student_id} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Magaca Buuxa</label>
              <input required type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Da'da (Age)</label>
              <input required type="number" name="age" value={formData.age} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jinsiga (Gender)</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="male">Lab (Male)</option>
                <option value="female">Dhedig (Female)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Heerka Waxbarasho Ee Waalidka</label>
              <select name="parent_education" value={formData.parent_education} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="High School">Dugsiga Sare</option>
                <option value="Bachelor">Degree</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Academics */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
            <FileText className="h-4 w-4" /> 2. Xogta Waxbarashada (Academics)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Waaxda (Department)</label>
              <select name="department" value={formData.department} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="CS">Computer Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Science">Science</option>
                <option value="Arts">Arts</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Semistarka</label>
              <input required type="number" min="1" max="4" name="semester_year" value={formData.semester_year} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">GPA</label>
              <input required type="number" step="0.01" name="gpa" value={formData.gpa} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">CGPA</label>
              <input required type="number" step="0.01" name="cgpa" value={formData.cgpa} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Saacadaha Waxbarasho</label>
              <input required type="number" step="0.1" name="study_hours_per_day" value={formData.study_hours_per_day} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Xaadiritaanka (%)</label>
              <input required type="number" step="0.1" name="attendance_rate" value={formData.attendance_rate} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dib u dhaca Shaqada (Maalmo)</label>
              <input required type="number" name="assignment_delay_days" value={formData.assignment_delay_days} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Section 3: Socioeconomic */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
            <Activity className="h-4 w-4" /> 3. Xaaladda Bulsho & Dhaqaale
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dakhliga Qoyska ($)</label>
              <input required type="number" name="family_income" value={formData.family_income} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Socdaalka (Daqiiqado)</label>
              <input required type="number" name="travel_time_minutes" value={formData.travel_time_minutes} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stress Index (0-10)</label>
              <input required type="number" step="0.1" name="stress_index" value={formData.stress_index} onChange={handleChange} className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" name="internet_access" checked={formData.internet_access} onChange={handleChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                Internet Access
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" name="part_time_job" checked={formData.part_time_job} onChange={handleChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                Part-time Job
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" name="has_scholarship" checked={formData.has_scholarship} onChange={handleChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                Scholarship
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" name="financial_problem" checked={formData.financial_problem} onChange={handleChange} className="rounded text-indigo-600 focus:ring-indigo-500" />
                Dhibaato Dhaqaale
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Xafid oo Saadaali
          </button>
        </div>
      </form>
    </div>
  );
}
