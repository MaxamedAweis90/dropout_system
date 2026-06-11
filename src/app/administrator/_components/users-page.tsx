"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

interface User {
  id: number;
  name: string;
  role: string;
  status: "Active" | "Inactive";
}

const initialUsers: User[] = [
  { id: 1, name: "Mr. Abdirahman", role: "Admin", status: "Active" },
  { id: 2, name: "Ms. Fadumo", role: "Teacher", status: "Active" },
  { id: 3, name: "Mr. Husein", role: "Teacher", status: "Active" },
  { id: 4, name: "Mr. Omar", role: "Clerk", status: "Inactive" },
  { id: 5, name: "Ms. Aisha", role: "Counselor", status: "Active" },
];

const roleOptions = ["Admin", "Teacher", "Dean", "Head of Department", "Clerk", "Counselor"];

export function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);

  // Load users from backend API
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Failed to load users:", err));
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", role: "Teacher", status: "Active" as "Active" | "Inactive" });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const openAdd = () => {
    setEditingUser(null);
    setForm({ name: "", role: "Teacher", status: "Active" });
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, role: user.role, status: user.status });
    setShowModal(true);
  };

    const handleSave = async () => {
      if (!form.name.trim()) return;
      try {
        const payload = {
          name: form.name,
          role: form.role,
          status: form.status,
        };
        let res;
        const token = localStorage.getItem('access_token');
        if (editingUser) {
          // Update existing user
          res = await fetch(`/api/users/${editingUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {} ) },
            body: JSON.stringify(payload),
          });
        } else {
          // Create new user
          res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {} ) },
            body: JSON.stringify(payload),
          });
        }
        if (res.ok) {
          const savedUser = await res.json();
          if (editingUser) {
            setUsers((prev) => prev.map((u) => (u.id === savedUser.id ? savedUser : u)));
            toast.success("Isticmaalaha waa la cusboonaysiiyey!");
          } else {
            setUsers((prev) => [...prev, savedUser]);
            toast.success("Isticmaale cusub ayaa la diiwaan geliyey!");
          }
          setShowModal(false);
        } else {
          const err = await res.json();
          toast.error(err.detail || "Fal khalad ah ayaa dhacay");
        }
      } catch (e) {
        toast.error("Isku xidhka server-ka ayaa fashilmay");
      }
    };

    const handleDelete = async (id: number) => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/api/users/${id}`, { 
          method: "DELETE",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {} ) }
        });
        if (res.ok) {
          setUsers((prev) => prev.filter((u) => u.id !== id));
          toast.success("Isticmaalaha waa la tirtiray!");
        } else {
          const err = await res.json();
          toast.error(err.detail || "Qalad tirtirid");
        }
      } catch (e) {
        toast.error("Isku xidhka server-ka ayaa fashilmay");
      }
      setDeleteConfirm(null);
    };

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg overflow-hidden">
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#08184a] to-[#1a3a7a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">Maamulka Isticmaalayaasha</h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            <span className="text-base leading-none">+</span> Ku dar Isticmaale
          </button>
        </div>

        {/* Table */}
        <div className="px-6 pb-2">
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{user.role}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${
                          user.status === "Active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-indigo-600 transition hover:bg-indigo-50"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-rose-500 transition hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4">
          <span className="text-xs font-medium text-slate-400">Total Users: {users.length}</span>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900">
              {editingUser ? "Edit User" : "Add New User"}
            </h3>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Mr. Ahmed"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {roleOptions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Optimistically update UI
                    handleSave();
                    // Show toast based on mode
                    toast.success(editingUser ? "Xogta isticmaalaha si guul leh ayaa loo cusboonaysiiyey!" : "Isticmaale cusub ayaa si guul leh loo diiwangaliyey!");
                  }}
                  className="rounded-xl bg-gradient-to-r from-[#08184a] to-[#1a3a7a] px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition"
                >
                  {editingUser ? "Update" : "Save"}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-rose-50">
              <svg className="h-7 w-7 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete User?</h3>
            <p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p>
            <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(deleteConfirm);
                    toast.success("Isticmaalihii waa la tirtiray!");
                  }}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700 transition"
                >
                  Delete
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
