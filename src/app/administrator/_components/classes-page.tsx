"use client";
import React from "react";

export function ClassesPage() {
  const classes = [
    { name: "CS201 - Data Structures", students: 45, att: "92%", risk: "2 students" },
    { name: "CS202 - Algorithms", students: 38, att: "89%", risk: "3 students" },
    { name: "IT302 - Machine Learning", students: 30, att: "94%", risk: "0 students" },
  ];

  return (
    <div className="mt-6 rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-900">Class Roasters Summary</h3>
      <p className="text-xs text-slate-400 mb-4">Class-level retention and performance diagnostics.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {classes.map((c) => (
          <div key={c.name} className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm">
            <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Enrolled:</span>
                <span className="font-bold text-slate-800">{c.students}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Attendance:</span>
                <span className="font-bold text-emerald-600">{c.att}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Alert Flags:</span>
                <span className="font-bold text-rose-600">{c.risk}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
