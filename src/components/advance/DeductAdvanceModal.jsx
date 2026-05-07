import React from "react";

export default function DeductAdvanceModal({ isOpen, deductionForm, setDeductionForm, onDeduct, onClose, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 rounded-t-xl">
          <h2 className="text-lg font-bold text-white">Deduct Advance</h2>
        </div>
        <div className="p-5">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Deduction Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter amount to deduct"
              value={deductionForm.amount}
              onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Remark (Optional)</label>
            <input
              type="text"
              placeholder="Enter remark"
              value={deductionForm.remark}
              onChange={(e) => setDeductionForm({ ...deductionForm, remark: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onDeduct}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 text-sm"
            >
              {loading ? "Processing..." : "Deduct"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 