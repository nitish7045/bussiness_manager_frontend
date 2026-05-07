import React from "react";

export default function LoanSection({ 
  advances, 
  advanceForm, 
  setAdvanceForm, 
  onGiveAdvance, 
  onOpenDeductModal, 
  loading, 
  formatDate, 
  formatNumber 
}) {
  const activeLoans = advances.filter(a => a.remainingAmount > 0);
  const completedLoans = advances.filter(a => a.remainingAmount === 0 && a.totalAmount > 0);

  return (
    <div className="space-y-6">
      {/* Give Loan Form */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-5 py-3">
          <h2 className="text-lg font-bold text-white">Give Loan</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter loan amount"
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Given Date</label>
              <input
                type="date"
                value={advanceForm.givenDate}
                onChange={(e) => setAdvanceForm({ ...advanceForm, givenDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Remark (Optional)</label>
              <input
                type="text"
                placeholder="Enter remark"
                value={advanceForm.remark}
                onChange={(e) => setAdvanceForm({ ...advanceForm, remark: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={onGiveAdvance}
            disabled={loading}
            className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {loading ? "Processing..." : "Give Loan"}
          </button>
        </div>
      </div>

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3">
            <h2 className="text-lg font-bold text-white">Active Loans</h2>
            <p className="text-xs opacity-90">Loans with remaining balance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Given Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Remaining</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map(loan => {
                  const paidAmount = loan.totalAmount - loan.remainingAmount;
                  const paidPercentage = (paidAmount / loan.totalAmount) * 100;
                  
                  return (
                    <tr key={loan._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(loan.givenDate || loan.createdAt)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{formatNumber(loan.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-orange-600">₹{formatNumber(loan.remainingAmount)}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-blue-600">₹{formatNumber(paidAmount)}</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${paidPercentage}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onOpenDeductModal(loan._id)}
                          className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded hover:bg-blue-600"
                        >
                          Make Payment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed Loans (History) */}
      {completedLoans.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-5 py-3">
            <h2 className="text-lg font-bold text-white">History - Repaid Loans</h2>
            <p className="text-xs opacity-90">Fully repaid loans moved to history</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Given Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Repaid Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedLoans.map(loan => (
                  <tr key={loan._id} className="border-t bg-green-50 hover:bg-green-100">
                    <td className="px-4 py-3 text-sm">{formatDate(loan.givenDate || loan.createdAt)}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(loan.completedAt || loan.updatedAt)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{formatNumber(loan.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        ✓ Repaid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {advances.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-500">No loans found</p>
        </div>
      )}
    </div>
  );
}