"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { 
  CloudUpload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  History, 
  Loader2, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface PreviewRow {
  student_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  Registration_Date?: string;
  faculty: string;
  department: string;
  address: string;
  kin_name: string;
  kin_phone: string;
  relationship: string;
  class?: string;
}

interface ImportLog {
  id: number;
  file_name: string;
  imported_by: string;
  status: "Guulaystay" | "Fashilmay";
  row_count: number;
  imported_at: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "loading";
}

const FALLBACK_FEATURES = [
  "Age", "Gender", "Family_Income", "Internet_Access", "Study_Hours_per_Day", 
  "Attendance_Rate", "Assignment_Delay_Days", "Travel_Time_Minutes", 
  "Part_Time_Job", "Scholarship", "Stress_Index", "GPA", "Semester_GPA", "CGPA", 
  "Financial_Problem", "GPA_Attendance_Interaction", "CGPA_Attendance_Interaction",
  "Semester_Year 1", "Semester_Year 2", "Semester_Year 3", "Semester_Year 4",
  "Department_Arts", "Department_Business", "Department_CS", "Department_Engineering", "Department_Science",
  "Parent_Bachelor", "Parent_High School", "Parent_Master", "Parent_PhD"
];

export default function DataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [allParsedData, setAllParsedData] = useState<any[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [parsing, setParsing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch("/api/metadata");
        if (res.ok) {
          const data = await res.json();
          if (data.features) {
            setFeatures(data.features);
          }
        }
      } catch (err) {
        console.error("Failed to fetch metadata from API", err);
      }
    };
    fetchMetadata();
  }, []);

  // Show floating toast message helper
  const showToast = useCallback((message: string, type: "success" | "error" | "loading") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove success/error toasts after 4 seconds
    if (type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch Import Logs
  const fetchLogs = useCallback(async () => {
    try {
      const storedLogs = localStorage.getItem("dropoutsys_import_logs");
      if (storedLogs) {
        setImportLogs(JSON.parse(storedLogs));
      } else {
        const defaultLogs: ImportLog[] = [
          { id: 1, file_name: "ardayda_cs_221.csv", imported_by: "admin", status: "Guulaystay", row_count: 4, imported_at: new Date(Date.now() - 3600000 * 24).toLocaleString() },
          { id: 2, file_name: "ba_112_finance.xlsx", imported_by: "admin", status: "Guulaystay", row_count: 3, imported_at: new Date(Date.now() - 3600000 * 48).toLocaleString() }
        ];
        localStorage.setItem("dropoutsys_import_logs", JSON.stringify(defaultLogs));
        setImportLogs(defaultLogs);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle Drag & Drop / Selected File
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    const toastId = showToast("Faylka waa la falanqaynayaa, fadlan sug...", "loading");

    try {
      const text = await selectedFile.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("CSV must contain a header row and at least one data row.");
      }

      // Preserve original casing of headers to match metadata exactly
      const headers = lines[0].split(",").map(h => h.trim());
      const allRows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(",").map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        allRows.push(row);
      }

      removeToast(toastId);
      setAllParsedData(allRows);
      setPreviewData(allRows.slice(0, 5));
      setTotalRows(allRows.length);
      showToast("Faylka si guul leh ayaa loo akhriyay (Client-Side Preview)!", "success");
    } catch (err) {
      removeToast(toastId);
      const msg = err instanceof Error ? err.message : "Cilad farsamo ayaa dhacday!";
      showToast(msg, "error");
      setFile(null);
      setPreviewData([]);
      setAllParsedData([]);
      setTotalRows(0);
    } finally {
      setParsing(false);
    }
  }, [showToast, removeToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: loading || parsing,
  });

  // Download CSV Import Template Helper based on backend metadata/features
  const downloadTemplate = () => {
    const activeFeatures = features.length > 0 ? features : FALLBACK_FEATURES;
    const cols = ["student_id", "name", ...activeFeatures];
    const headers = cols.join(",") + "\n";
    
    const sampleValues: string[] = [];
    cols.forEach(col => {
      if (col === "student_id") sampleValues.push("STU1088");
      else if (col === "name") sampleValues.push("Khalid Cabdi");
      else if (col === "Age") sampleValues.push("21");
      else if (col === "Gender") sampleValues.push("1"); // 1 for Male, 0 for Female
      else if (col === "Family_Income") sampleValues.push("3200");
      else if (col === "Internet_Access") sampleValues.push("1");
      else if (col === "Study_Hours_per_Day") sampleValues.push("3.5");
      else if (col === "Attendance_Rate") sampleValues.push("95.0");
      else if (col === "Assignment_Delay_Days") sampleValues.push("2");
      else if (col === "Travel_Time_Minutes") sampleValues.push("20");
      else if (col === "Part_Time_Job") sampleValues.push("0");
      else if (col === "Scholarship") sampleValues.push("1");
      else if (col === "Stress_Index") sampleValues.push("4.0");
      else if (col === "GPA") sampleValues.push("3.4");
      else if (col === "Semester_GPA") sampleValues.push("3.2");
      else if (col === "CGPA") sampleValues.push("3.3");
      else if (col === "Financial_Problem") sampleValues.push("0");
      else if (col === "GPA_Attendance_Interaction") sampleValues.push("323.0");
      else if (col === "CGPA_Attendance_Interaction") sampleValues.push("313.5");
      else if (col.startsWith("Semester_Year")) {
        sampleValues.push(col === "Semester_Year 2" ? "1" : "0");
      } else if (col.startsWith("Department")) {
        sampleValues.push(col === "Department_CS" ? "1" : "0");
      } else if (col.startsWith("Parent")) {
        sampleValues.push(col === "Parent_Bachelor" ? "1" : "0");
      } else {
        sampleValues.push("0");
      }
    });

    const sampleRow = sampleValues.join(",") + "\n";
    const blob = new Blob([headers + sampleRow], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ardayda_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform Final Commit Upload to DB
  const commitImport = async () => {
    if (!file || allParsedData.length === 0) return;

    setLoading(true);
    const toastId = showToast("Xogta ardayda waxaa loo diiwaangelinayaa oo saadaalin ML ah lagu samaynayaa...", "loading");

    try {
      // 1. Prepare data for ML Bulk endpoint (send the raw model-ready rows directly)
      const payload = allParsedData.map(row => {
        const item: any = {};
        const activeFeatures = features.length > 0 ? features : FALLBACK_FEATURES;
        activeFeatures.forEach(feat => {
          const val = row[feat];
          if (val === undefined) {
            item[feat] = 0; // fallback
          } else if (feat === "Internet_Access" || feat === "Part_Time_Job" || feat === "Scholarship" || feat === "Financial_Problem" || feat.startsWith("Semester_Year") || feat.startsWith("Department") || feat.startsWith("Parent")) {
            // parse as binary integer
            item[feat] = (val.toLowerCase() === "true" || val === "1") ? 1 : 0;
          } else {
            item[feat] = parseFloat(val) || 0.0;
          }
        });
        
        // Also keep student_id and name
        item.student_id = row.student_id || `STU${Math.floor(1000 + Math.random() * 9000)}`;
        item.name = row.name || row.full_name || "Arday Cusub";
        return item;
      });

      // 2. Call the bulk prediction Next.js proxy
      const mlResponse = await fetch("/api/predict/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!mlResponse.ok) throw new Error("Failed to get bulk predictions from ML Service.");
      
      const mlResults = await mlResponse.json();

      // 3. Upsert into Supabase students table
      const dbPayload = mlResults.map((item: any) => {
        // Decode semester_year from one-hot columns
        let semesterYear = 1;
        if (item["Semester_Year 1"] === 1) semesterYear = 1;
        else if (item["Semester_Year 2"] === 1) semesterYear = 2;
        else if (item["Semester_Year 3"] === 1) semesterYear = 3;
        else if (item["Semester_Year 4"] === 1) semesterYear = 4;

        let parentEducation = "High School";
        if (item["Parent_Bachelor"] === 1) parentEducation = "Bachelor";
        else if (item["Parent_High School"] === 1) parentEducation = "High School";
        else if (item["Parent_Master"] === 1) parentEducation = "Master";
        else if (item["Parent_PhD"] === 1) parentEducation = "PhD";

        return {
          student_id: item.student_id.trim(),
          name: item.name.trim(),
          age: Number(item.Age) || 20,
          gender: (item.Gender === 1 || String(item.Gender).toLowerCase() === "male" || String(item.Gender) === "1") ? "Male" : "Female",
          family_income: Number(item.Family_Income) || 3000.0,
          internet_access: item.Internet_Access === 1 || String(item.Internet_Access).toLowerCase() === "true" || String(item.Internet_Access) === "1",
          study_hours_per_day: Number(item.Study_Hours_per_Day) || 2.0,
          attendance_rate: Number(item.Attendance_Rate) || 100.0,
          assignment_delay_days: Number(item.Assignment_Delay_Days) || 0,
          travel_time_minutes: Number(item.Travel_Time_Minutes) || 15,
          part_time_job: item.Part_Time_Job === 1 || String(item.Part_Time_Job).toLowerCase() === "true" || String(item.Part_Time_Job) === "1",
          has_scholarship: item.Scholarship === 1 || String(item.Scholarship).toLowerCase() === "true" || String(item.Scholarship) === "1",
          gpa: Number(item.GPA) || 4.0,
          semester_gpa: Number(item.Semester_GPA) || 4.0,
          cgpa: Number(item.CGPA) || 4.0,
          financial_problem: item.Financial_Problem === 1 || String(item.Financial_Problem).toLowerCase() === "true" || String(item.Financial_Problem) === "1",
          semester_year: semesterYear,
          dropout_probability: Number(item.dropout_probability),
          risk_level: item.tier || "Safe",
          stress_index: Number(item.Stress_Index) || 3.0,
          parent_education: parentEducation
        };
      });

      const { error: dbError } = await supabase.from("students").upsert(dbPayload);
      if (dbError) throw dbError;

      // 4. Link students to a class by looking up the department name
      try {
        const { data: depts } = await supabase.from("departments").select("*");
        const { data: classes } = await supabase.from("classes").select("*");

        if (depts && classes) {
          for (const item of mlResults) {
            // Decode department name from one-hot columns
            let deptName = "CS";
            if (item.Department_Arts === 1) deptName = "Arts";
            else if (item.Department_Business === 1) deptName = "Business";
            else if (item.Department_CS === 1) deptName = "CS";
            else if (item.Department_Engineering === 1) deptName = "Engineering";
            else if (item.Department_Science === 1) deptName = "Science";

            const matchedDept = depts.find(d => d.department_name.toLowerCase().includes(deptName.toLowerCase()) || deptName.toLowerCase().includes(d.department_name.toLowerCase()));
            if (matchedDept) {
              const matchedClass = classes.find(c => c.department_id === matchedDept.id);
              if (matchedClass) {
                await supabase.from("class_students").upsert({
                  class_id: matchedClass.id,
                  student_id: item.student_id.trim()
                });
              }
            }
          }
        }
      } catch (linkErr) {
        console.warn("Failed to link imported students to classes/departments:", linkErr);
      }

      removeToast(toastId);

      // Add to logs
      const newLog: ImportLog = {
        id: Date.now(),
        file_name: file.name,
        imported_by: "admin",
        status: "Guulaystay",
        row_count: totalRows,
        imported_at: new Date().toLocaleString()
      };

      const storedLogs = localStorage.getItem("dropoutsys_import_logs");
      const currentLogs: ImportLog[] = storedLogs ? JSON.parse(storedLogs) : [];
      const updatedLogs = [newLog, ...currentLogs];
      localStorage.setItem("dropoutsys_import_logs", JSON.stringify(updatedLogs));
      setImportLogs(updatedLogs);

      showToast(`Si guul leh ayaa ${totalRows} arday loo diiwaangeliyay oo database-ka loogu daray!`, "success");
      setFile(null);
      setPreviewData([]);
      setAllParsedData([]);
      setTotalRows(0);
    } catch (err: any) {
      removeToast(toastId);
      const msg = err.message || "Cilad farsamo ayaa dhacday!";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };


  const cancelSelection = () => {
    setFile(null);
    setPreviewData([]);
    setTotalRows(0);
  };

  return (
    <div className="w-full space-y-6">
      {/* Premium Dashboard Panel Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Soo Dhoofsashada Xogta Ardayda (Data Import)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ku dar ama ku cusboonaysii xogta ardayda si wadajir ah adoo isticmaalaya faylka Excel ama CSV.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <Download className="h-4 w-4" />
          Soo Degso Template-ka (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Drag & Drop and Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag & Drop Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            {!file ? (
              <div
                {...getRootProps()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                  isDragActive
                    ? "border-indigo-600 bg-indigo-50/30"
                    : "border-slate-300 hover:border-indigo-500 bg-slate-50/30"
                }`}
              >
                <input {...getInputProps()} />
                <div className="rounded-full bg-white p-4 shadow-sm border border-slate-100">
                  <CloudUpload className={`h-8 w-8 ${isDragActive ? "text-indigo-600 animate-bounce" : "text-slate-400"}`} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  Ku raddayn faylka Excel ama CSV halkan
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 max-w-sm">
                  ama guji si aad u soo xulato kombiyuutarkaaga. Wuxuu aqbalayaa oo kaliya <span className="font-semibold text-slate-700">.xlsx, .xls, .csv</span>.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                      {file.name}
                    </h3>
                    <p className="text-[10px] font-medium text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • Guud ahaan {totalRows} records
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelSelection}
                    disabled={loading}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition"
                  >
                    Ka laabo
                  </button>
                  <button
                    onClick={commitImport}
                    disabled={loading || parsing}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Shubaya...
                      </>
                    ) : (
                      <>
                        Ku Shub Database-ka
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Preview Area (Table) */}
          {previewData.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
              <div className="border-b border-slate-100 p-5 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Horudhaca Xogta la Akhriyay (Preview)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Waxaa la tusayaa 5-ta saf ee ugu horreysa. Wadarta ardayda: <span className="font-semibold text-indigo-600">{totalRows}</span>
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-100">
                    <tr>
                      {previewData.length > 0 && Object.keys(previewData[0]).map((key) => (
                        <th key={key} className="px-4 py-3 font-semibold">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition">
                        {Object.keys(row).map((key) => (
                          <td key={key} className="px-4 py-3 text-slate-600 font-medium">
                            {row[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Audit History Log */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden flex flex-col h-full">
            <div className="border-b border-slate-100 p-5 flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-slate-500" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  Taariikhda Soo Dhoofsashada (Logs)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Audit trail-ka iyo heerka soo dhoofsashada
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px] flex-1">
              {importLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">Ma jirto wax taariikh import ah oo la helay.</p>
                </div>
              ) : (
                importLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/50 transition flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]" title={log.file_name}>
                        {log.file_name}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          log.status === "Guulaystay"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Arday: <span className="font-semibold text-slate-700">{log.row_count}</span></span>
                      <span>By: <span className="font-semibold text-slate-600">{log.imported_by}</span></span>
                    </div>
                    <div className="text-[9px] text-slate-400 text-right">
                      {log.imported_at}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notifications (Toasts Overlay) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-xl border ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : toast.type === "error"
                  ? "bg-rose-50 border-rose-100 text-rose-800"
                  : "bg-white border-slate-100 text-slate-800"
              }`}
            >
              {toast.type === "success" && (
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              )}
              {toast.type === "error" && (
                <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              {toast.type === "loading" && (
                <Loader2 className="h-5 w-5 text-indigo-600 animate-spin shrink-0" />
              )}
              <span className="text-xs font-semibold leading-relaxed">{toast.message}</span>
              {toast.type !== "loading" && (
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ml-auto p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100/50 transition"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
