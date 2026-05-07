// src/components/salary/PeriodSelector.jsx
import React from "react";

export default function PeriodSelector({ selectedMonth, selectedYear, onMonthChange, onYearChange }) {
  const getMonthName = (month) => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[month - 1];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-5">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <h2 className="text-sm font-semibold text-gray-700">Select Period</h2>
      </div>
      <div className="p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-1.5 text-sm focus:ring-1 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-1.5 text-sm focus:ring-1 focus:ring-blue-500"
              min="2020"
              max="2030"
            />
          </div>
        </div>
      </div>
    </div>
  );
}