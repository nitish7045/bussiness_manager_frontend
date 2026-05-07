// src/components/payment/AddPaymentModal.jsx
import React from "react";

export default function AddPaymentModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingPayment, 
  formData, 
  setFormData,
  companies 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-4 py-3 bg-blue-600 rounded-t-lg flex justify-between items-center">
          <h2 className="text-sm font-semibold text-white">
            {editingPayment ? "Edit Payment" : "Add Payment"}
          </h2>
          <button onClick={onClose} className="text-white">✕</button>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                value={formData.payment}
                onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company *</label>
              <select
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={onSave}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700"
            >
              {editingPayment ? "Update" : "Save"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded-md text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}