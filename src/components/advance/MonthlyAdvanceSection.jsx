import React, { useState } from "react";

export default function MonthlyAdvanceSection({ 
  monthlyData,  // Now receives grouped monthly data
  advanceForm, 
  setAdvanceForm, 
  onGiveAdvance, 
  onOpenDeductModal, 
  loading, 
  formatDate, 
  formatNumber 
}) {
  const [selectedMonth, setSelectedMonth] = useState(null);
  
  // Get current month/year for new advances
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Separate active and completed months
  const activeMonths = monthlyData.filter(m => 
    m.advances.some(a => a.remainingAmount > 0)
  );
  const completedMonths = monthlyData.filter(m => 
    m.advances.every(a => a.remainingAmount === 0) && m.advances.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Give Monthly Advance Form */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 px-5 py-3">
          <h2 className="text-lg font-bold text-white">Give Monthly Advance</h2>
          <p className="text-xs opacity-90">For {getMonthName(currentMonth)} {currentYear}</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter amount"
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
            className="mt-4 bg-gradient-to-r from-green-600 to-teal-600 text-white px-5 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {loading ? "Processing..." : `Give Advance for ${getMonthName(currentMonth)} ${currentYear}`}
          </button>
        </div>
      </div>

      {/* Active Monthly Advances by Month */}
      {activeMonths.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Active Monthly Advances
          </h3>
          
          {activeMonths.map(monthData => (
            <div key={`${monthData.year}-${monthData.month}`} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {monthData.monthName} {monthData.year}
                    </h3>
                    <p className="text-xs opacity-90">Monthly Advance Summary</p>
                  </div>
                  <button
                    onClick={() => setSelectedMonth(selectedMonth === monthData.month ? null : monthData.month)}
                    className="text-white text-sm bg-white/20 px-3 py-1 rounded-lg"
                  >
                    {selectedMonth === monthData.month ? "Hide Details" : "View Details"}
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                {monthData.advances.map(advance => {
                  const paidAmount = advance.totalAmount - advance.remainingAmount;
                  const paidPercentage = (paidAmount / advance.totalAmount) * 100;
                  
                  return (
                    <div key={advance._id} className="space-y-3">
                      {/* Summary Card */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Total Advanced</p>
                          <p className="text-xl font-bold text-green-600">₹{formatNumber(advance.totalAmount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Remaining</p>
                          <p className="text-xl font-bold text-orange-600">₹{formatNumber(advance.remainingAmount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Paid</p>
                          <p className="text-xl font-bold text-blue-600">₹{formatNumber(paidAmount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Given Date</p>
                          <p className="text-sm font-semibold text-gray-700">{formatDate(advance.givenDate)}</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Repayment Progress</span>
                          <span>{paidPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${paidPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Transaction History for this advance */}
                      {selectedMonth === monthData.month && advance.transactions && advance.transactions.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Transaction History</p>
                          <div className="space-y-2">
                            {advance.transactions.map((tx, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                <div>
                                  <span className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'credit' ? '+' : '-'} ₹{formatNumber(tx.amount)}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">{formatDate(tx.date)}</span>
                                </div>
                                <span className="text-xs text-gray-600">{tx.remark}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Deduct Button */}
                      {advance.remainingAmount > 0 && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => onOpenDeductModal(advance._id)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                          >
                            Make Payment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Monthly Advances (History) */}
      {completedMonths.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            History - Completed Advances
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedMonths.map(monthData => (
              <div key={`${monthData.year}-${monthData.month}`} className="bg-green-50 rounded-xl shadow-lg overflow-hidden border border-green-200">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
                  <h3 className="font-bold text-white">
                    {monthData.monthName} {monthData.year}
                  </h3>
                </div>
                <div className="p-4">
                  {monthData.advances.map(advance => (
                    <div key={advance._id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Total Advanced</p>
                          <p className="text-lg font-bold text-green-600">₹{formatNumber(advance.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Completed Date</p>
                          <p className="text-sm font-semibold text-gray-700">{formatDate(advance.completedAt)}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          ✓ Fully Repaid
                        </span>
                      </div>
                      
                      {/* Show all transactions for completed advance */}
                      {advance.transactions && advance.transactions.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-xs text-blue-600 cursor-pointer">View Payment History</summary>
                          <div className="mt-2 space-y-1 pl-4 border-l-2 border-green-300">
                            {advance.transactions.map((tx, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span>{formatDate(tx.date)}</span>
                                <span className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                  {tx.type === 'credit' ? '+' : '-'} ₹{formatNumber(tx.amount)}
                                </span>
                                <span className="text-gray-500">{tx.remark}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthlyData.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-500">No monthly advances found</p>
        </div>
      )}
    </div>
  );
}

// Helper function
function getMonthName(month) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return monthNames[month - 1];
}