"use client";

import React from "react";
import { Plus, Trash2, Edit } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Department {
  id: number;
  department_name: string;
}

interface ClassItem {
  id: number;
  class_name: string;
  department_id: number;
  teacher_id: string | null;
  departments?: { department_name: string } | null;
  teachers?: { name: string } | null;
}

interface DepartmentsTabProps {
  departments: Department[];
  classes: ClassItem[];
  teachers: Teacher[];
  setCurrentDept: (dept: { id: number; department_name: string }) => void;
  setShowDeptModal: (show: boolean) => void;
  handleDeleteDept: (id: number) => void;
  setClassEditMode: (mode: boolean) => void;
  setCurrentClass: (cls: { id: number; class_name: string; department_id: number; teacher_id: string }) => void;
  setShowClassModal: (show: boolean) => void;
  handleDeleteClass: (id: number) => void;
}

export default function DepartmentsTab({
  departments,
  classes,
  teachers,
  setCurrentDept,
  setShowDeptModal,
  handleDeleteDept,
  setClassEditMode,
  setCurrentClass,
  setShowClassModal,
  handleDeleteClass
}: DepartmentsTabProps) {
  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Departments Section */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Departments</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Active faculties structure</p>
          </div>
          <button
            onClick={() => {
              setCurrentDept({ id: 0, department_name: "" });
              setShowDeptModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 px-3 rounded-xl transition cursor-pointer"
          >
            <Plus size={12} />
            <span>Ku dar Waax</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Department Name</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-slate-400">
                    Ma jiraan waaxyo diiwaangashan.
                  </td>
                </tr>
              ) : (
                departments.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-indigo-900">{dept.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{dept.department_name}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteDept(dept.id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classes Section */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Classes Setup</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Assign courses to teachers and faculties</p>
          </div>
          <button
            onClick={() => {
              setClassEditMode(false);
              setCurrentClass({ id: 0, class_name: "", department_id: departments[0]?.id || 0, teacher_id: teachers[0]?.id || "" });
              setShowClassModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 px-3 rounded-xl transition cursor-pointer"
          >
            <Plus size={12} />
            <span>Ku dar Fasal</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/50 font-bold text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Fasal</th>
                <th className="px-4 py-3">Waaxda</th>
                <th className="px-4 py-3">Macalinka</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                    Ma jiraan fasalo la habeeyey.
                  </td>
                </tr>
              ) : (
                classes.map(cls => (
                  <tr key={cls.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">{cls.class_name}</td>
                    <td className="px-4 py-3 text-slate-500 font-semibold">{cls.departments?.department_name || "Lama aqoonsan"}</td>
                    <td className="px-4 py-3 text-slate-800 font-bold">{cls.teachers?.name || <span className="text-amber-500 text-[10px] font-bold">Ma jiro macalin</span>}</td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setClassEditMode(true);
                          setCurrentClass({ id: cls.id, class_name: cls.class_name, department_id: cls.department_id, teacher_id: cls.teacher_id || "" });
                          setShowClassModal(true);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
