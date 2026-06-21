import React from "react";

interface DataTableProps<T> {
  columns: { header: string; accessor: keyof T; render?: (value: T[keyof T], row: T) => React.ReactNode }[];
  data: T[];
  className?: string;
}

export function DataTable<T>({ columns, data, className }: DataTableProps<T>) {
  return (
    <div className={className}>
      <table className="w-full text-left text-xs text-slate-900">
        <thead className="bg-slate-50 uppercase text-slate-500 font-semibold">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-3 py-2">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50/50">
              {columns.map((col, colIdx) => {
                const value = row[col.accessor];
                return (
                  <td key={colIdx} className="px-3 py-2">
                    {col.render ? col.render(value, row) : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
