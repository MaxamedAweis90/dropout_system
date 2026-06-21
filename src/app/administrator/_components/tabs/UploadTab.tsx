"use client";

import React from "react";
import { Upload } from "lucide-react";

interface UploadTabProps {
  csvText: string;
  setCsvText: (text: string) => void;
  handleBulkUpload: (e: React.FormEvent) => void;
}

export default function UploadTab({
  csvText,
  setCsvText,
  handleBulkUpload
}: UploadTabProps) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-xs space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">Bulk Insert Student Records</h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Upload or paste student records to append/upsert them directly into the database.
        </p>
      </div>

      <form onSubmit={handleBulkUpload} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            CSV Data Input
          </label>
          <textarea
            rows={12}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="block w-full rounded-2xl border border-slate-200 p-4 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900 text-slate-100 focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md cursor-pointer transition"
          >
            <Upload size={14} />
            <span>Shub Xogta (CSV Import)</span>
          </button>
        </div>
      </form>
    </div>
  );
}
