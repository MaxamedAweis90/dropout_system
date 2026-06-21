"use client";
import { useState, useEffect, Fragment, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";

interface Faculty {
  id: number;
  faculty_name: string;
  faculty_code: string;
}

interface User {
  id: number;
  name: string;
  role: "Administrator" | "Dean" | "Head of Department" | "Teacher";
}

interface Department {
  id: number;
  department_name: string;
  faculty_id: number;
  hod_id: number | null;
  // derived fields
  faculty_name?: string;
  hod_name?: string;
}

// Toast component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-md animate-fade-in">
      {message}
      <button className="ml-2" onClick={onClose}>
        <X size={16} className="text-white" />
      </button>
    </div>
  );
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  // State for dynamic data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      return token ? { "Authorization": `Bearer ${token}` } : {};
    }
    return {};
  };

  const fetchFaculties = useCallback(() => {
    const headers = getAuthHeaders();
    fetch('/api/faculties', { headers })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setFaculties(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error fetching faculties:', err);
        setFaculties([]);
      });
  }, []);

  const fetchUsers = useCallback(() => {
    const headers = getAuthHeaders();
    fetch('/api/users/', { headers })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error fetching users:', err);
        setUsers([]);
      });
  }, []);

  const fetchDepartments = useCallback(() => {
    const headers = getAuthHeaders();
    fetch('/api/departments/', { headers })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error fetching departments:', err);
        setDepartments([]);
      });
  }, []);

  // Fetch data from backend
  useEffect(() => {
    fetchFaculties();
    fetchUsers();
    fetchDepartments();
  }, [fetchFaculties, fetchUsers, fetchDepartments]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDept, setCurrentDept] = useState<Partial<Department>>({});
  const [toastMsg, setToastMsg] = useState<string>("");

  // Helper to enrich department rows with names – ensure departments is an array
  const enriched = Array.isArray(departments) ? departments.map((d) => {
    const faculty = faculties.find((f) => f.id === d.faculty_id);
    const hod = users.find((u) => u.id === d.hod_id);
    return { ...d, faculty_name: faculty?.faculty_name, hod_name: hod?.name };
  }) : [];

  const filtered = enriched.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      d.department_name.toLowerCase().includes(term) ||
      (d.faculty_name ?? "").toLowerCase().includes(term)
    );
  });

  const resetForm = () => {
    setCurrentDept({});
    setEditMode(false);
  };

  const handleSave = () => {
    if (!currentDept.department_name || !currentDept.faculty_id) return;
    
    const payload = {
      department_name: currentDept.department_name.trim(),
      faculty_id: currentDept.faculty_id,
      hod_id: currentDept.hod_id || null
    };

    if (editMode && currentDept.id) {
        // Update existing department via API
        fetch(`/api/departments/${currentDept.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        })
          .then(async (res) => {
            if (!res.ok) {
              let errMsg = 'Failed to update department';
              try {
                const errData = await res.json();
                errMsg = errData.detail || errMsg;
              } catch {}
              throw new Error(errMsg);
            }
            return res.json();
          })
          .then(() => {
            fetchDepartments();
            setToastMsg('Xogta waaxda si guul leh ayaa loo cusboonaysiiyey!');
          })
          .catch((err) => {
            console.error(err);
            setToastMsg(err.message);
          });
    } else {
        // Create new department via API
        fetch('/api/departments/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        })
          .then(async (res) => {
            if (!res.ok) {
              let errMsg = 'Failed to create department';
              try {
                const errData = await res.json();
                errMsg = errData.detail || errMsg;
              } catch {}
              throw new Error(errMsg);
            }
            return res.json();
          })
          .then(() => {
            fetchDepartments();
            setToastMsg('Waax cusub ayaa si guul leh lagu daray!');
          })
          .catch((err) => {
            console.error(err);
            setToastMsg(err.message);
          });
    }
    setShowModal(false);
    resetForm();
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ma hubaal baa in aad rabto in aad tirtirto waaxdan?")) {
      fetch(`/api/departments/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to delete department');
          fetchDepartments();
          setToastMsg('Waaxda si guul leh ayaa loo tirtiray!');
        })
        .catch((err) => console.error(err));
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  return (
    <div className="p-6">
      {/* Card */}
      <div className="rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Waaxyaha Jaamacadda (Departments)</h2>
            <p className="text-sm text-slate-600">Halkan ka maamul waaxyaha akadeemiyada, kuna xir Kulliyadaha iyo Madaxda Waaxyaha (HOD)</p>
          </div>
          <button
            className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            onClick={() => {
              setEditMode(false);
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={18} /> + Ku dar Waax
          </button>
        </div>
        {/* Search */}
        <div className="relative mb-4 w-80">
          <Search size={20} className="absolute left-2 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi waax..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Table */}
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto text-slate-900">
              <thead className="bg-slate-100 text-slate-900">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Magaca Waaxda</th>
                  <th className="p-2">Kulliyadda</th>
                  <th className="p-2">Madaxa Waaxda (HOD)</th>
                  <th className="p-2">Awoodaha</th>
                  <th className="p-2">Falalka</th>
                </tr>
              </thead>
              <tbody className="text-slate-900">
                {filtered.map((dept, idx) => (
                  <tr key={dept.id} className={idx % 2 === 0 ? "bg-white text-slate-900" : "bg-slate-50 text-slate-900"}>
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">{dept.department_name}</td>
                    <td className="p-2">{dept.faculty_name}</td>
                    <td className="p-2">{dept.hod_name ?? "Loo ma magacaabin"}</td>
                    <td className="p-2">{dept.hod_name ? "✔" : "—"}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={() => {
                          setEditMode(true);
                          setCurrentDept(dept);
                          setShowModal(true);
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">Waax dhalisay shuruudahan lama helin!</p>
        )}
        {/* Footer */}
        <div className="mt-4 flex justify-between text-sm text-slate-600">
          <span>Wadar Guud: {departments.length} Waaxood</span>
          <span>DropoutSyS Student Dropout Prediction Database Panel v1.0</span>
        </div>
      </div>

      {/* Modal */}
      <Transition appear show={showModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-slate-900 mb-4">
                    {editMode ? "Wax ka beddel Waax" : "Ku dar Waax"}
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Magaca Waaxda</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 placeholder:text-slate-400"
                        value={currentDept.department_name ?? ""}
                        onChange={(e) => setCurrentDept({ ...currentDept, department_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kulliyadda</label>
                      <select
                        className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                        value={currentDept.faculty_id ?? ""}
                        onChange={(e) => setCurrentDept({ ...currentDept, faculty_id: Number(e.target.value) })}
                        required
                      >
                        <option value="" disabled>-- Dooro Kulliyadda --</option>
                         {Array.isArray(faculties) && faculties.map((f) => (
                           <option key={f.id} value={f.id}>
                             {f.faculty_name}
                           </option>
                         ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Madaxa Waaxda (HOD)</label>
                      <select
                        className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                        value={currentDept.hod_id ?? ""}
                        onChange={(e) =>
                          setCurrentDept({ ...currentDept, hod_id: e.target.value ? Number(e.target.value) : null })
                        }
                      >
                        <option value="">Loo ma magacaabin</option>
                         {Array.isArray(users) && users.filter(u => u.role === "Head of Department").map((u) => (
                           <option key={u.id} value={u.id}>
                             {u.name}
                           </option>
                         ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300"
                      onClick={() => setShowModal(false)}
                    >
                      {"Jooji"}
                    </button>
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      onClick={handleSave}
                    >
                      {editMode ? "Cusboonaysii" : "Kaydi"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
