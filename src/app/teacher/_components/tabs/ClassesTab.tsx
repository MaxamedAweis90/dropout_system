"use client";

import React from "react";

interface ClassCourse {
  id: number;
  class_name: string;
  department_id: number;
  teacher_id: string;
  department_name?: string;
}

interface ClassesTabProps {
  classes: ClassCourse[];
  setSelectedClassId: (id: number) => void;
  loadStudentsForClass: (id: number) => void;
  setActiveTab: (tab: "classes" | "attendance" | "gradebook") => void;
}

export default function ClassesTab({
  classes,
  setSelectedClassId,
  loadStudentsForClass,
  setActiveTab
}: ClassesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">My Assigned Classes</h3>
        <p className="text-xs text-slate-400">Liiska fasalada laguu xil-saaray akhrintooda.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200/60 rounded-3xl p-8 text-center text-slate-400">
            Lama helin wax fasalo ah oo laguu xil saaray.
          </div>
        ) : (
          classes.map(cls => (
            <div key={cls.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cls.department_name}</span>
                <h4 className="text-base font-bold text-slate-900">{cls.class_name}</h4>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Teacher ID: {cls.teacher_id}</span>
                <button
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    loadStudentsForClass(cls.id);
                    setActiveTab("attendance");
                  }}
                  className="text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  Diiwaangeli Xaadirinta
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
