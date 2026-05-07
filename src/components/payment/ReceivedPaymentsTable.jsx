// src/components/payment/ReceivedPaymentsTable.jsx
import React from "react";

export default function ReceivedPaymentsTable({ 
  payments, 
  onEdit, 
  onDelete,
  onAdd,
  onExport 
}) {
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700">Received Payments</h2>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700"
          >
            📥 Export PDF
          </button>
          <button
            onClick={onAdd}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700"
          >
            + Add Payment
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sr No.</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Payment (₹)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Company</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th></tr>
             </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500 text-sm">
                  No payments found
                 </td>
               </tr>
            ) : (
              payments.map(payment => (
                <tr key={payment.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs">{payment.srNo}</td>
                  <td className="px-4 py-2 text-xs font-semibold text-green-600">₹{formatNumber(payment.payment)}</td>
                  <td className="px-4 py-2 text-xs">{new Date(payment.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                      {payment.company}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(payment)} className="text-blue-600 hover:text-blue-800">✏️</button>
                      <button onClick={() => onDelete(payment.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}