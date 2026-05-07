// src/components/reports/ReportHeader.jsx
import React from "react";

export default function ReportHeader({ companyDetails, reportType, month, year }) {
  const getMonthName = (month) => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[month - 1];
  };

  const getTitle = () => {
    switch(reportType) {
      case "salary": return `Salary Report - ${getMonthName(month)} ${year}`;
      case "advance": return "Advance Report";
      case "attendance": return `Attendance Report - ${getMonthName(month)} ${year}`;
      case "worker": return "Worker Report";
      default: return "Report";
    }
  };

  return (
    <div className="text-center mb-6 pb-4 border-b border-gray-200">
      {companyDetails.logo && (
        <img src={companyDetails.logo} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
      )}
      <h1 className="text-xl font-bold text-gray-800">{companyDetails.name || "Business Manager"}</h1>
      <div className="text-xs text-gray-500 mt-1">
        {companyDetails.phone && <span>📞 {companyDetails.phone} | </span>}
        {companyDetails.email && <span>✉️ {companyDetails.email}</span>}
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-blue-600">{getTitle()}</h2>
        <p className="text-xs text-gray-400 mt-1">Generated on: {new Date().toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
}