// src/components/salary/SalaryHistoryModal.jsx
import React from "react";

export default function SalaryHistoryModal({ worker, history, onClose }) {
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;
  
  const getMonthName = (month) => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[month - 1];
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return React.createElement('span', {
          className: "px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
        }, "Paid");
      case 'processed':
        return React.createElement('span', {
          className: "px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
        }, "Processed");
      default:
        return React.createElement('span', {
          className: "px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
        }, "Calculated");
    }
  };

  // In SalaryHistoryModal.jsx, add send email button
const handleSendEmail = async (salary) => {
  if (!worker.email) {
    alert("No email found for this worker. Please add email in worker profile.");
    return;
  }
  
  try {
    // Generate PDF and send via email
    const element = document.getElementById(`salary-slip-${salary._id}`);
    // ... PDF generation code
    await API.post("/email/send-salary-slip", {
      email: worker.email,
      salaryId: salary._id
    });
    alert("Salary slip sent to email!");
  } catch (err) {
    console.error("Error sending email:", err);
    alert("Error sending email. Please try again.");
  }
};

  if (!worker) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-4 py-2 bg-blue-600 rounded-t-lg flex justify-between items-center">
          <h2 className="text-sm font-semibold text-white">
            Salary History - {worker.name}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Month/Year</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Earnings</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Advance Deducted</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Loan Deducted</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Net Salary</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Carry Forward</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(record => (
                <tr key={record._id} className="border-t">
                  <td className="px-3 py-2 text-xs">{getMonthName(record.month)} {record.year}</td>
                  <td className="px-3 py-2 text-xs">₹{formatNumber(record.earnings?.totalEarnings)}</td>
                  <td className="px-3 py-2 text-xs">₹{formatNumber(record.deductions?.monthlyAdvanceDeducted)}</td>
                  <td className="px-3 py-2 text-xs">₹{formatNumber(record.deductions?.loanDeducted)}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-blue-600">₹{formatNumber(record.netSalary)}</td>
                  <td className="px-3 py-2 text-xs text-orange-600">
                    {record.carryForwardToNext?.monthlyAdvance > 0 && `A:₹${formatNumber(record.carryForwardToNext.monthlyAdvance)} `}
                    {record.carryForwardToNext?.loan > 0 && `L:₹${formatNumber(record.carryForwardToNext.loan)}`}
                  </td>
                  <td className="px-3 py-2">{getStatusBadge(record.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}