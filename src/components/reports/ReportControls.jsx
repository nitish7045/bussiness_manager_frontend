// src/components/reports/ReportControls.jsx
import React from "react";

export default function ReportControls({ 
  reportType, 
  onReportTypeChange, 
  selectedMonth, 
  onMonthChange, 
  selectedYear, 
  onYearChange, 
  onGenerate, 
  loading 
}) {
  const getMonthName = (month) => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[month - 1];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <h2 className="text-sm font-semibold text-gray-700">Report Settings</h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => onReportTypeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
            >
              <option value="salary">Salary Report</option>
              <option value="advance">Advance Report</option>
              <option value="attendance">Attendance Report</option>
              <option value="worker">Worker Report</option>
            </select>
          </div>
          
          {(reportType === "salary" || reportType === "attendance") && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{getMonthName(month)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => onYearChange(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                  min="2020"
                  max="2030"
                />
              </div>
            </>
          )}
        </div>
        
        <button
          onClick={onGenerate}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>
    </div>
  );
}