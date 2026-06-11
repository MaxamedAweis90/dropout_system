"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function UserManagement() {
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    // Placeholder: replace with actual API call
    setTimeout(() => {
      setUsers([
        { id: "U001", name: "Admin User", email: "admin@example.com" },
        { id: "U002", name: "John Doe", email: "john.doe@example.com" },
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    toast.success("Add User functionality not implemented yet.");
  };

  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">User Management</h2>
        <button
          onClick={handleAddUser}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700"
        >
          + Add User
        </button>
      </div>
      {loading ? (
        <p className="text-slate-500">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-medium text-indigo-900">{u.id}</td>
                  <td className="px-4 py-2 text-slate-800">{u.name}</td>
                  <td className="px-4 py-2 text-slate-600">{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
