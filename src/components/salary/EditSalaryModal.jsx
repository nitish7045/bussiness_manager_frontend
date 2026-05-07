// src/components/salary/EditSalaryModal.jsx
import React, { useState, useEffect } from "react";
import API from "../../api/api";

export default function EditSalaryModal({ salary, worker, onClose, onSave }) {
  const [formData, setFormData] = useState({
    monthlyAdvanceDeduction: 0,
    loanDeduction: 0,
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [originalValues, setOriginalValues] = useState({});

  useEffect(() => {
    // Set initial values from salary data
    const monthlyAdvance = salary.deductions?.monthlyAdvanceDeducted || 0;
    const loan = salary.deductions?.loanDeducted || 0;
    const notes = salary.ownerEdits?.notes || "";
    
    setFormData({
      monthlyAdvanceDeduction: monthlyAdvance,
      loanDeduction: loan,
      notes: notes
    });
    
    setOriginalValues({
      monthlyAdvance,
      loan,
      notes
    });
  }, [salary]);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString('en-IN');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Remove any non-digit characters and convert to number
    const cleanValue = value.replace(/[^\d]/g, '');
    const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    
    setFormData({
      ...formData,
      [name]: numValue
    });
  };

  const handleSubmit = async () => {
    // Validate amounts
    if (formData.monthlyAdvanceDeduction < 0 || formData.loanDeduction < 0) {
      alert("Deduction amounts cannot be negative");
      return;
    }
    
    setLoading(true);
    try {
      // Call API to update salary deductions
      await API.put(`/salary/${salary._id}/deductions`, {
        monthlyAdvance: formData.monthlyAdvanceDeduction,
        loan: formData.loanDeduction,
        notes: formData.notes
      });
      
      alert("Salary updated successfully!");
      onSave();
    } catch (err) {
      console.error("Error updating salary:", err);
      alert("Error updating salary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      formData.monthlyAdvanceDeduction !== originalValues.monthlyAdvance ||
      formData.loanDeduction !== originalValues.loan ||
      formData.notes !== originalValues.notes
    );
  };

  const totalEarnings = salary.earnings?.totalEarnings || 0;
  const totalDeductions = formData.monthlyAdvanceDeduction + formData.loanDeduction;
  const netSalary = totalEarnings - totalDeductions;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Edit Salary</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Worker Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Worker</p>
                <p className="text-sm font-semibold text-gray-800">{worker?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Designation</p>
                <p className="text-sm text-gray-700">{worker?.designation}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Month/Year</p>
                <p className="text-sm text-gray-700">{salary.month}/{salary.year}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Earnings</p>
                <p className="text-sm font-bold text-green-600">₹{formatNumber(totalEarnings)}</p>
              </div>
            </div>
          </div>

          {/* Deductions Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Monthly Advance Deduction (₹)
              </label>
              <input
                type="text"
                name="monthlyAdvanceDeduction"
                value={formData.monthlyAdvanceDeduction === 0 ? "" : formData.monthlyAdvanceDeduction}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-[10px] text-gray-400 mt-1">Enter 0 or leave blank for no deduction</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Loan Deduction (₹)
              </label>
              <input
                type="text"
                name="loanDeduction"
                value={formData.loanDeduction === 0 ? "" : formData.loanDeduction}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-[10px] text-gray-400 mt-1">Enter 0 or leave blank for no deduction</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="2"
                placeholder="Add any remarks..."
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Earnings:</span>
                <span className="font-semibold text-green-600">₹{formatNumber(totalEarnings)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Deductions:</span>
                <span className="font-semibold text-red-600">-₹{formatNumber(totalDeductions)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 flex justify-between text-base">
                <span className="font-semibold text-gray-800">Net Salary:</span>
                <span className="font-bold text-blue-600 text-lg">₹{formatNumber(netSalary < 0 ? 0 : netSalary)}</span>
              </div>
              {netSalary < 0 && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Net salary is negative. The excess will be carried forward to next month.
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading || !hasChanges()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}