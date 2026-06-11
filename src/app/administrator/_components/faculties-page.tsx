"use client";
import { useState } from "react";

interface Faculty {
  id: number;
  name: string;
  dean: string;
  status: "Active" | "Inactive";
}

const initialFaculties: Faculty[] = [
  { id: 1, name: "Faculty of Engineering", dean: "Dr. Ahmed", status: "Active" },
  { id: 2, name: "Faculty of Arts", dean: "Prof. Yusuf", status: "Active" },
];

export function FacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>(initialFaculties);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [form, setForm] = useState({ name: "", dean: "", status: "Active" as "Active" | "Inactive" });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const openAdd = () => { setEditing(null); setForm({ name: "", dean: "", status: "Active" }); setShowModal(true); };
  const openEdit = (f: Faculty) => { setEditing(f); setForm({ name: f.name, dean: f.dean, status: f.status }); setShowModal(true); };
  const handleSave = () => {
    if (!form.name.trim() || !form.dean.trim()) return;
    if (editing) {
      setFaculties(faculties.map(f => f.id === editing.id ? { ...f, ...form } : f));
    } else {
      const newId = Math.max(0, ...faculties.map(f => f.id)) + 1;
      setFaculties([...faculties, { id: newId, ...form }]);
    }
    setShowModal(false);
  };
  const handleDelete = (id: number) => { setFaculties(faculties.filter(f => f.id !== id)); setDeleteId(null); };

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#08184a] to-[#1a3a7a]" />
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">Faculty Management</h2>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">
            <span className="text-base leading-none">+</span> Add Faculty
          </button>
        </div>
        <div className="px-6 pb-2">
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Dean</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map((f, idx) => (
                  <tr key={f.id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{f.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{f.dean}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${f.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{f.status}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(f)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-indigo-600 transition hover:bg-indigo-50" title="Edit">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteId(f.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-rose-500 transition hover:bg-rose-50" title="Delete">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {faculties.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400">No faculties found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="border-t border-slate-100 px-6 py-4">
          <span className="text-xs font-medium text-slate-400">Total Faculties: {faculties.length}</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900">{editing ? "Edit Faculty" : "Add New Faculty"}</h3>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Faculty of Science" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dean *</label>
                <input value={form.dean} onChange={e => setForm({ ...form, dean: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Dr. Ahmed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status *</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="rounded-xl bg-gradient-to-r from-[#08184a] to-[#1a3a7a] px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition">{editing ? "Update" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-rose-50">
              <svg className="h-7 w-7 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Faculty?</h3>
            <p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
