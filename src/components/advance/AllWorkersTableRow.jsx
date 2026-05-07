import React, { useState } from "react";

export default function AllWorkersTableRow({ worker, idx, onWorkerSelect }) {
  const [showHistory, setShowHistory] = useState(false);
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;
  
  // Safety check - if worker is undefined or null
  if (!worker) {
    return (
      <tr className="border-t bg-gray-50">
        <td colSpan="7" className="px-4 py-3 text-center text-red-500">
          Error: Worker data not available
        </td>
      </tr>
    );
  }
  
  // Use the correct property names - monthlyAdvances (array) not monthlyAdvance
  const monthlyAdvances = worker?.monthlyAdvances || [];
  const loans = worker?.loans || [];
  
  // Calculate current dues from active monthly advances
  const activeMonthlyDue = monthlyAdvances.reduce((sum, m) => 
    m?.status === "active" ? sum + (m?.remainingAmount || 0) : sum, 0
  );
  
  const activeLoanDue = loans.reduce((sum, l) => 
    l?.status === "active" ? sum + (l?.remainingAmount || 0) : sum, 0
  );
  
  const totalDue = activeMonthlyDue + activeLoanDue;
  
  // Get completed advances for history
  const completedMonthly = monthlyAdvances.filter(m => m?.status === "completed") || [];
  const completedLoans = loans.filter(l => l?.status === "completed") || [];

  return (
    <>
      <tr className={`border-t ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
        <td className="px-4 py-3">
          <div className="font-semibold text-gray-800 text-sm">{worker?.name || 'N/A'}</div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{worker?.designation || 'N/A'}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            worker?.status === "active" 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {worker?.status === "active" ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-3">
          {activeMonthlyDue > 0 ? (
            <div>
              <span className="font-semibold text-orange-600">₹{formatNumber(activeMonthlyDue)}</span>
              <div className="text-xs text-gray-500">
                {monthlyAdvances.filter(m => m?.status === "active").length} active month(s)
              </div>
            </div>
          ) : completedMonthly.length > 0 ? (
            <div>
              <span className="text-xs text-green-600">✓ All Cleared</span>
              <div className="text-xs text-gray-400">{completedMonthly.length} month(s) completed</div>
            </div>
          ) : (
            <span className="text-xs text-gray-400">No Advance</span>
          )}
        </td>
        <td className="px-4 py-3">
          {activeLoanDue > 0 ? (
            <div>
              <span className="font-semibold text-red-600">₹{formatNumber(activeLoanDue)}</span>
              <div className="text-xs text-gray-500">Active Loan</div>
            </div>
          ) : completedLoans.length > 0 ? (
            <div>
              <span className="text-xs text-green-600">✓ Repaid</span>
              <div className="text-xs text-gray-400">Loan Completed</div>
            </div>
          ) : (
            <span className="text-xs text-gray-400">No Loan</span>
          )}
        </td>
        <td className="px-4 py-3">
          {totalDue > 0 ? (
            <span className="font-bold text-blue-600">₹{formatNumber(totalDue)}</span>
          ) : (completedMonthly.length > 0 || completedLoans.length > 0) ? (
            <span className="text-xs text-green-600">✓ All Clear</span>
          ) : (
            <span className="text-xs text-gray-400">No Dues</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => onWorkerSelect(worker?.workerId)}
              className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded hover:bg-blue-600"
            >
              View Details
            </button>
            {(completedMonthly.length > 0 || completedLoans.length > 0) && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs bg-gray-500 text-white px-2.5 py-1 rounded hover:bg-gray-600"
              >
                {showHistory ? "Hide History" : "Show History"}
              </button>
            )}
          </div>
        </td>
      </tr>
      
      {/* Expandable History Row */}
      {showHistory && (completedMonthly.length > 0 || completedLoans.length > 0) && (
        <tr className="bg-gray-100">
          <td colSpan="7" className="px-4 py-3">
            <div className="space-y-3">
              {/* Completed Monthly Advances History */}
              {completedMonthly.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">📅 Completed Monthly Advances</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {completedMonthly.map(month => (
                      <div key={month?._id} className="bg-white rounded-lg p-2 shadow-sm">
                        <div className="font-semibold text-sm">{month?.monthName} {month?.year}</div>
                        <div className="text-xs text-gray-600">Amount: ₹{formatNumber(month?.totalAmount)}</div>
                        <div className="text-xs text-green-600">Completed: {month?.completedAt ? new Date(month.completedAt).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Completed Loans History */}
              {completedLoans.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">💰 Repaid Loans</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {completedLoans.map(loan => (
                      <div key={loan?._id} className="bg-white rounded-lg p-2 shadow-sm">
                        <div className="font-semibold text-sm">Loan of ₹{formatNumber(loan?.totalAmount)}</div>
                        <div className="text-xs text-gray-600">Given: {loan?.givenDate ? new Date(loan.givenDate).toLocaleDateString() : 'N/A'}</div>
                        <div className="text-xs text-green-600">Repaid: {loan?.completedAt ? new Date(loan.completedAt).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}