// src/components/payment/BillsTable.jsx
import React from "react";

export default function BillsTable({ bills, onEdit, onDelete, onAdd, onExport }) {
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700">Bills</h2>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700"
          >
            📥 Export PDF
          </button>
          <button
            onClick={onAdd}
            className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-purple-700"
          >
            + Add Bill
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Company</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Bill No.</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Site</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount (₹)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th></tr>
             </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500 text-sm">
                  No bills found
                </td>
               </tr>
            ) : (
              bills.map(bill => (
                <tr key={bill.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                      {bill.company}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs font-medium">{bill.billNo}</td>
                  <td className="px-4 py-2 text-xs">{bill.site}</td>
                  <td className="px-4 py-2 text-xs">{new Date(bill.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-xs font-semibold text-red-600">₹{formatNumber(bill.amount)}</td>
                  <td className="px-4 py-2 text-xs">
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(bill)} className="text-blue-600 hover:text-blue-800">✏️</button>
                      <button onClick={() => onDelete(bill.id)} className="text-red-600 hover:text-red-800">🗑️</button>
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