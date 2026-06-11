"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Edit, Trash2, X, Search, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Dean {
  id: number;
  username: string;
  role: string;
}

interface Faculty {
  id: number;
  faculty_name: string;
  faculty_code: string;
  dean_id: number | null;
  established_year: number;
  students_count: number;
  status: "Active" | "Inactive";
}

export default function FacultyManagement() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [deans, setDeans] = useState<Dean[]>([]);

  useEffect(() => {
    fetchFaculties();
    fetchDeans();
  }, []);

  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/faculties", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFaculties(data);
      } else {
        setToast({ message: "Waa uu kuashoomay soo qaadashada kulliyadaha!", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Cilad ayaa ku dhacday la xiriirka server-ka!", type: "error" });
    }
  };

  const fetchDeans = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/deans", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setDeans(data);
      }
    } catch (err) {
      console.error("Error fetching deans:", err);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  
  // UI States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form State
  const [form, setForm] = useState({
    faculty_name: "",
    faculty_code: "",
    dean_id: "" as string,
    established_year: "",
    students_count: "",
    status: "Active" as "Active" | "Inactive",
  });

  const resetForm = () => {
    setForm({
      faculty_name: "",
      faculty_code: "",
      dean_id: "",
      established_year: "",
      students_count: "",
      status: "Active",
    });
    setEditId(null);
    setIsEditing(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredFaculties = useMemo(() => {
    if (!searchQuery) return faculties;
    const lowerQuery = searchQuery.toLowerCase();
    return faculties.filter(
      (f) =>
        f.faculty_name.toLowerCase().includes(lowerQuery) ||
        f.faculty_code.toLowerCase().includes(lowerQuery)
    );
  }, [faculties, searchQuery]);

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (faculty: Faculty) => {
    setIsEditing(true);
    setEditId(faculty.id);
    setForm({
      faculty_name: faculty.faculty_name,
      faculty_code: faculty.faculty_code,
      dean_id: faculty.dean_id ? faculty.dean_id.toString() : "",
      established_year: faculty.established_year.toString(),
      students_count: faculty.students_count.toString(),
      status: faculty.status,
    });
    setShowModal(true);
  };

  const handleDeletePrompt = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`/api/faculties/${deleteId}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          setFaculties((prev) => prev.filter((f) => f.id !== deleteId));
          setToast({ message: "Kulliyadda si guul leh ayaa loo tirtiray!", type: "success" });
        } else {
          const errData = await res.json();
          setToast({ message: `Cilad: ${errData.detail || "Ma suurtagalin tirtiriddu!"}`, type: "error" });
        }
      } catch (err) {
        setToast({ message: "Cilad ayaa ku dhacday la xiriirka server-ka!", type: "error" });
      }
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const { faculty_name, faculty_code, dean_id, established_year, students_count, status } = form;
    
    if (!faculty_name || !faculty_code || !established_year || !students_count) return;

    const payload = {
      faculty_name: faculty_name.trim(),
      faculty_code: faculty_code.trim().toUpperCase(),
      dean_id: dean_id ? parseInt(dean_id) : null,
      established_year: parseInt(established_year),
      students_count: parseInt(students_count),
      status: status,
    };

    try {
      const url = isEditing ? `/api/faculties/${editId}` : "/api/faculties";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedFaculty = await res.json();
        if (isEditing) {
          setFaculties((prev) => prev.map((f) => (f.id === editId ? savedFaculty : f)));
          setToast({ message: "Xogta kulliyadda waa la cusboonaysiiyey!", type: "success" });
        } else {
          setFaculties((prev) => [...prev, savedFaculty]);
          setToast({ message: "Kulliyad cusub ayaa si guul leh lagu daray!", type: "success" });
        }
        setShowModal(false);
        resetForm();
      } else {
        const errData = await res.json();
        setToast({ message: `Cilad: ${errData.detail || "Ma suurtagalin kaydinta!"}`, type: "error" });
      }
    } catch (err) {
      setToast({ message: "Cilad ayaa ku dhacday la xiriirka server-ka!", type: "error" });
    }
  };

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getDeanName = (id: number | null) => {
    if (!id) return "Loo ma magacaabin";
    const dean = deans.find((d) => d.id === id);
    return dean ? dean.username : "Loo ma magacaabin";
  };

  return (
    <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kulliyadaha Jaamacadda</h2>
          <p className="text-sm text-slate-500 mt-1">Halkan ka maamul xogta dhammaystiran ee kulliyadaha (Habka B - Rich Metadata)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi kulliyad..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Kulliyad Cusub
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 w-16">#</th>
              <th className="px-6 py-4">Magaca Kulliyadda</th>
              <th className="px-6 py-4">Koodhka</th>
              <th className="px-6 py-4">Deanka Maamula</th>
              <th className="px-6 py-4">La Aasaasay</th>
              <th className="px-6 py-4 text-right">Ardayda</th>
              <th className="px-6 py-4 text-center">Xaaladda</th>
              <th className="px-6 py-4 text-center">Awoodaha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFaculties.length > 0 ? (
              filteredFaculties.map((f, idx) => (
                <tr key={f.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{f.faculty_name}</td>
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">{f.faculty_code}</td>
                  <td className="px-6 py-4 text-slate-600">{getDeanName(f.dean_id)}</td>
                  <td className="px-6 py-4 text-slate-600">{f.established_year}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">{f.students_count}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        f.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        {f.status === "Active" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {f.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(f)}
                        className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(f.id)}
                        className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  Kulliyad helaysa shuruudahan lama helin!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Area */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
        <div className="font-medium">Wadar Guud: {filteredFaculties.length} Kulliyadood</div>
        <div>SIMAD Student Dropout Prediction Database Panel v1.0</div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg">
                  {isEditing ? "Wax ka beddel Kulliyad" : "Kulliyad Cusub"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-full hover:bg-slate-200/50 text-slate-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitForm} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Magaca Kulliyadda *</label>
                    <input
                      required
                      type="text"
                      value={form.faculty_name}
                      onChange={(e) => setForm({ ...form, faculty_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Tusaale: Computer Science"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Koodhka Kulliyadda *</label>
                    <input
                      required
                      type="text"
                      value={form.faculty_code}
                      onChange={(e) => setForm({ ...form, faculty_code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm uppercase font-mono"
                      placeholder="FOC"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Sanadka la Aasaasay *</label>
                    <input
                      required
                      type="number"
                      min="1990"
                      value={form.established_year}
                      onChange={(e) => setForm({ ...form, established_year: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="2010"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Deanka Maamula</label>
                    <select
                      value={form.dean_id}
                      onChange={(e) => setForm({ ...form, dean_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    >
                      <option value="">Loo ma magacaabin</option>
                      {deans.map(dean => (
                        <option key={dean.id} value={dean.id}>{dean.username}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Tirada Ardayda *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.students_count}
                      onChange={(e) => setForm({ ...form, students_count: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Xaaladda</label>
                    <div className="flex gap-4 mt-2.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="Active"
                          checked={form.status === "Active"}
                          onChange={() => setForm({ ...form, status: "Active" })}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="text-sm text-slate-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="Inactive"
                          checked={form.status === "Inactive"}
                          onChange={() => setForm({ ...form, status: "Inactive" })}
                          className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-gray-300"
                        />
                        <span className="text-sm text-slate-700">Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Jooji
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm"
                  >
                    Kaydi Xogta
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Tirtir Kulliyadda</h3>
              <p className="text-sm text-slate-500 mb-6">Ma hubaal baa in aad rabto in aad tirtirto kulliyaddan? Tallaabadan dib looma soo celin karo.</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 w-full text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Jooji
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 w-full text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
                >
                  Haa, Tirtir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg border text-sm font-medium z-[70] ${
              toast.type === "success" 
                ? "bg-white border-emerald-100 text-slate-800" 
                : "bg-white border-rose-100 text-slate-800"
            }`}
          >
            {toast.type === "success" ? (
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <XCircle className="h-4 w-4" />
              </div>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
