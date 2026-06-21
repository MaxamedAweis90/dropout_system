"use client";

import React from "react";
import { Plus, Edit, Trash2, Loader2, Search } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

interface Administrator {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

interface UsersTabProps {
  user: any;
  userSubTab: "teachers" | "admins";
  setUserSubTab: (tab: "teachers" | "admins") => void;
  teachers: Teacher[];
  administrators: Administrator[];
  setUserEditMode: (mode: boolean) => void;
  setCurrentUser: (user: any) => void;
  setShowUserModal: (show: boolean) => void;
  handleDeleteUser: (id: string, role: "admin" | "teacher") => void;
  formatDate: (dateStr?: string) => string;
  loading: boolean;
  teachersSearchTerm: string;
  setTeachersSearchTerm: (text: string) => void;
  adminsSearchTerm: string;
  setAdminsSearchTerm: (text: string) => void;
  hasMoreTeachers: boolean;
  loadingMoreTeachers: boolean;
  loadMoreTeachers: () => void;
  hasMoreAdmins: boolean;
  loadingMoreAdmins: boolean;
  loadMoreAdmins: () => void;
}

export default function UsersTab({
  user,
  userSubTab,
  setUserSubTab,
  teachers,
  administrators,
  setUserEditMode,
  setCurrentUser,
  setShowUserModal,
  handleDeleteUser,
  formatDate,
  loading,
  teachersSearchTerm,
  setTeachersSearchTerm,
  adminsSearchTerm,
  setAdminsSearchTerm,
  hasMoreTeachers,
  loadingMoreTeachers,
  loadMoreTeachers,
  hasMoreAdmins,
  loadingMoreAdmins,
  loadMoreAdmins
}: UsersTabProps) {
  const [localTeachersSearch, setLocalTeachersSearch] = React.useState(teachersSearchTerm);
  const [localAdminsSearch, setLocalAdminsSearch] = React.useState(adminsSearchTerm);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setTeachersSearchTerm(localTeachersSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localTeachersSearch, setTeachersSearchTerm]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setAdminsSearchTerm(localAdminsSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localAdminsSearch, setAdminsSearchTerm]);

  const teachersSentryRef = React.useRef<HTMLTableRowElement | null>(null);
  const adminsSentryRef = React.useRef<HTMLTableRowElement | null>(null);

  React.useEffect(() => {
    if (!hasMoreTeachers || loadingMoreTeachers) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreTeachers();
        }
      },
      { threshold: 0.1 }
    );

    if (teachersSentryRef.current) {
      observer.observe(teachersSentryRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreTeachers, loadingMoreTeachers, loadMoreTeachers]);

  React.useEffect(() => {
    if (!hasMoreAdmins || loadingMoreAdmins) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreAdmins();
        }
      },
      { threshold: 0.1 }
    );

    if (adminsSentryRef.current) {
      observer.observe(adminsSentryRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreAdmins, loadingMoreAdmins, loadMoreAdmins]);
  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">User Accounts</h3>
          <p className="text-xs text-slate-400 font-semibold">Manage system access credentials (Admins & Teachers)</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              placeholder="Search user..."
              value={userSubTab === "admins" ? localAdminsSearch : localTeachersSearch}
              onChange={(e) => {
                if (userSubTab === "admins") {
                  setLocalAdminsSearch(e.target.value);
                } else {
                  setLocalTeachersSearch(e.target.value);
                }
              }}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {!(userSubTab === "admins" && !user?.isSuperAdmin) && (
            <button
              onClick={() => {
                setUserEditMode(false);
                setCurrentUser({ id: "", name: "", email: "", password: "", role: userSubTab === "admins" ? "admin" : "teacher" });
                setShowUserModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={14} />
              <span>{userSubTab === "admins" ? "Ku Dar Maamule" : "Ku Dar Macallin"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs Toggle */}
      <div className="flex border-b border-slate-100 pb-2 gap-2">
        <button
          onClick={() => setUserSubTab("teachers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            userSubTab === "teachers"
              ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          Macallimiinta ({teachers.length})
        </button>
        {user?.isSuperAdmin && (
          <button
            onClick={() => setUserSubTab("admins")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              userSubTab === "admins"
                ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Maamulayaasha ({administrators.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Teachers Sub-Tab */}
          {userSubTab === "teachers" && (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Teacher Name</th>
                    <th className="px-6 py-4 font-semibold">Email Address</th>
                    <th className="px-6 py-4">Date Added</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        Ma jiraan macallimiin diiwaangashan.
                      </td>
                    </tr>
                  ) : (
                    teachers.map(teach => (
                      <tr key={teach.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">{teach.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-bold font-mono">{teach.email}</td>
                        <td className="px-6 py-4 text-slate-400 font-semibold">{formatDate(teach.created_at)}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setUserEditMode(true);
                              setCurrentUser({ id: teach.id, name: teach.name, email: teach.email, password: "", role: "teacher" });
                              setShowUserModal(true);
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(teach.id, "teacher")}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {loadingMoreTeachers && (
                    <>
                      {[1, 2].map(i => (
                        <tr key={`loading-teacher-${i}`} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                          <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-200 rounded-xl w-16 ml-auto"></div></td>
                        </tr>
                      ))}
                    </>
                  )}
                  {hasMoreTeachers && !loadingMoreTeachers && (
                    <tr ref={teachersSentryRef}>
                      <td colSpan={4} className="py-4 text-center text-[10px] text-slate-400 font-semibold animate-pulse">
                        Loading more records...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Administrators Sub-Tab */}
          {userSubTab === "admins" && user?.isSuperAdmin && (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Admin Name</th>
                    <th className="px-6 py-4 font-semibold">Email Address</th>
                    <th className="px-6 py-4">Date Added</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {administrators.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        Ma jiraan maamulayaal diiwaangashan.
                      </td>
                    </tr>
                  ) : (
                    administrators.map(admin => (
                      <tr key={admin.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">{admin.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-bold font-mono">{admin.email}</td>
                        <td className="px-6 py-4 text-slate-400 font-semibold">{formatDate(admin.created_at)}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setUserEditMode(true);
                              setCurrentUser({ id: admin.id, name: admin.name, email: admin.email, password: "", role: "admin" });
                              setShowUserModal(true);
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(admin.id, "admin")}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {loadingMoreAdmins && (
                    <>
                      {[1, 2].map(i => (
                        <tr key={`loading-admin-${i}`} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                          <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-200 rounded-xl w-16 ml-auto"></div></td>
                        </tr>
                      ))}
                    </>
                  )}
                  {hasMoreAdmins && !loadingMoreAdmins && (
                    <tr ref={adminsSentryRef}>
                      <td colSpan={4} className="py-4 text-center text-[10px] text-slate-400 font-semibold animate-pulse">
                        Loading more records...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
