// src/components/reports/AdvanceReport.jsx
import React, { useState } from "react";

export default function AdvanceReport({ data, filters }) {
  const [viewMode, setViewMode] = useState("summary"); // summary, detailed, worker
  const [expandedWorkers, setExpandedWorkers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, monthly, loan

  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

  const toggleWorkerExpand = (workerId) => {
    setExpandedWorkers(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalMonthlyAdvance = 0;
    let totalLoan = 0;
    let totalMonthlyRemaining = 0;
    let totalLoanRemaining = 0;
    let activeWorkers = 0;
    let completedWorkers = 0;

    data.forEach(item => {
      item.advances.forEach(advance => {
        if (advance.type === "monthly") {
          totalMonthlyAdvance += advance.totalAmount || 0;
          totalMonthlyRemaining += advance.remainingAmount || 0;
        } else if (advance.type === "loan") {
          totalLoan += advance.totalAmount || 0;
          totalLoanRemaining += advance.remainingAmount || 0;
        }
      });
      
      const hasActive = item.advances.some(a => a.remainingAmount > 0);
      if (hasActive) activeWorkers++;
      else if (item.advances.length > 0) completedWorkers++;
    });

    return {
      totalMonthlyAdvance,
      totalLoan,
      totalMonthlyRemaining,
      totalLoanRemaining,
      totalDue: totalMonthlyRemaining + totalLoanRemaining,
      totalGiven: totalMonthlyAdvance + totalLoan,
      activeWorkers,
      completedWorkers,
      totalWorkers: data.length
    };
  };

  const totals = calculateTotals();

  // Filter data based on search and type filter
  const getFilteredData = () => {
    let filtered = [...data];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.worker.designation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(item => 
        item.advances.some(a => a.type === filterType)
      );
    }
    
    return filtered;
  };

  const filteredData = getFilteredData();

  // Summary View - REMOVED Monthly Advance
  const renderSummaryView = () => {
    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <p className="text-xs opacity-90">Total Advances Given</p>
            <p className="text-2xl font-bold">₹{formatNumber(totals.totalGiven)}</p>
            <div className="text-xs opacity-75 mt-1">
              Monthly: ₹{formatNumber(totals.totalMonthlyAdvance)} | Loan: ₹{formatNumber(totals.totalLoan)}
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <p className="text-xs opacity-90">Total Due Amount</p>
            <p className="text-2xl font-bold">₹{formatNumber(totals.totalDue)}</p>
            <div className="text-xs opacity-75 mt-1">
              Monthly: ₹{formatNumber(totals.totalMonthlyRemaining)} | Loan: ₹{formatNumber(totals.totalLoanRemaining)}
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <p className="text-xs opacity-90">Recovery Rate</p>
            <p className="text-2xl font-bold">
              {totals.totalGiven > 0 ? Math.round(((totals.totalGiven - totals.totalDue) / totals.totalGiven) * 100) : 0}%
            </p>
            <div className="text-xs opacity-75 mt-1">
              Recovered: ₹{formatNumber(totals.totalGiven - totals.totalDue)}
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <p className="text-xs opacity-90">Worker Status</p>
            <p className="text-2xl font-bold">
              {totals.activeWorkers} / {totals.totalWorkers}
            </p>
            <div className="text-xs opacity-75 mt-1">
              Active: {totals.activeWorkers} | Completed: {totals.completedWorkers}
            </div>
          </div>
        </div>

        {/* Summary Table - Monthly Advance column removed */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Worker</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Monthly Remaining</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Loan</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Loan Remaining</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Total Due</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => {
                const monthlyAdvance = item.advances.find(a => a.type === "monthly");
                const loan = item.advances.find(a => a.type === "loan");
                const monthlyRemaining = monthlyAdvance?.remainingAmount || 0;
                const loanTotal = loan?.totalAmount || 0;
                const loanRemaining = loan?.remainingAmount || 0;
                const totalDue = monthlyRemaining + loanRemaining;
                const hasActive = totalDue > 0;
                
                return (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-800">{item.worker.name}</div>
                      <div className="text-xs text-gray-500">{item.worker.designation}</div>
                    </td>
                    <td className="px-3 py-2 text-center text-orange-600 font-medium">
                      ₹{formatNumber(monthlyRemaining)}
                    </td>
                    <td className="px-3 py-2 text-center text-blue-600 font-medium">
                      ₹{formatNumber(loanTotal)}
                    </td>
                    <td className="px-3 py-2 text-center text-red-600 font-medium">
                      ₹{formatNumber(loanRemaining)}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-purple-600">
                      ₹{formatNumber(totalDue)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {hasActive ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Active</span>
                      ) : item.advances.length > 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Completed</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">No Advance</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td className="px-3 py-2 text-xs font-semibold text-gray-700">Total</td>
                <td className="px-3 py-2 text-center font-semibold text-orange-700">₹{formatNumber(totals.totalMonthlyRemaining)}</td>
                <td className="px-3 py-2 text-center font-semibold text-blue-700">₹{formatNumber(totals.totalLoan)}</td>
                <td className="px-3 py-2 text-center font-semibold text-red-700">₹{formatNumber(totals.totalLoanRemaining)}</td>
                <td className="px-3 py-2 text-center font-semibold text-purple-700">₹{formatNumber(totals.totalDue)}</td>
                <td className="px-3 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  // Detailed View - Removed Given Date and Total Amount from monthly advance, removed Given Date from loans
  const renderDetailedView = () => {
    return (
      <div className="space-y-6">
        {filteredData.map((item, idx) => {
          const hasAdvances = item.advances.length > 0;
          if (!hasAdvances) return null;
          
          return (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.worker.name}</h3>
                    <p className="text-xs text-gray-500">{item.worker.designation}</p>
                  </div>
                  <button
                    onClick={() => toggleWorkerExpand(item.worker._id)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    {expandedWorkers[item.worker._id] ? "Show Less" : "View Details"}
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Monthly Advances - Removed Given Date and Total Amount */}
                  <div>
                    <h4 className="text-sm font-semibold text-green-600 mb-2">📅 Monthly Advances</h4>
                    {item.advances.filter(a => a.type === "monthly").length > 0 ? (
                      <div className="space-y-2">
                        {item.advances.filter(a => a.type === "monthly").map((advance, aidx) => (
                          <div key={aidx} className="bg-green-50 rounded-lg p-2">
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-gray-600">Remaining:</span>
                              <span className="font-medium text-orange-600">₹{formatNumber(advance.remainingAmount)}</span>
                            </div>
                            {advance.remainingAmount === 0 && (
                              <div className="mt-1 text-xs text-green-600">✓ Fully Repaid</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No monthly advances</p>
                    )}
                  </div>
                  
                  {/* Loans - Removed Given Date */}
                  <div>
                    <h4 className="text-sm font-semibold text-blue-600 mb-2">💰 Loans</h4>
                    {item.advances.filter(a => a.type === "loan").length > 0 ? (
                      <div className="space-y-2">
                        {item.advances.filter(a => a.type === "loan").map((advance, aidx) => (
                          <div key={aidx} className="bg-blue-50 rounded-lg p-2">
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-gray-600">Total Amount:</span>
                              <span className="font-medium text-blue-600">₹{formatNumber(advance.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-gray-600">Remaining:</span>
                              <span className="font-medium text-red-600">₹{formatNumber(advance.remainingAmount)}</span>
                            </div>
                            {advance.remainingAmount === 0 && (
                              <div className="mt-1 text-xs text-green-600">✓ Fully Repaid</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No loans</p>
                    )}
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedWorkers[item.worker._id] && (
                  <div className="mt-4 pt-3 border-t">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2">Transaction History</h4>
                    <div className="text-xs text-gray-500">
                      <p>Total Advances Given: ₹{formatNumber(
                        item.advances.reduce((sum, a) => sum + (a.totalAmount || 0), 0)
                      )}</p>
                      <p>Total Repaid: ₹{formatNumber(
                        item.advances.reduce((sum, a) => sum + ((a.totalAmount || 0) - (a.remainingAmount || 0)), 0)
                      )}</p>
                      <p>Total Due: ₹{formatNumber(
                        item.advances.reduce((sum, a) => sum + (a.remainingAmount || 0), 0)
                      )}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Worker-wise View - Added Monthly Paid column and filter/search
  const renderWorkerWiseView = () => {
    return (
      <div className="space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Advances</option>
              <option value="monthly">Monthly Only</option>
              <option value="loan">Loan Only</option>
            </select>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {(searchTerm || filterType !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
              }}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-xs text-gray-500">
          Showing {filteredData.length} of {data.length} workers
        </div>

        {/* Worker Wise Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Worker</th>
                {/* <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Monthly Advance</th> */}
                {/* <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Monthly Paid</th> */}
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Monthly Due</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Loan Amount</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Loan Paid</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Loan Due</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Total Due</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => {
                const monthlyAdvance = item.advances.find(a => a.type === "monthly");
                const loan = item.advances.find(a => a.type === "loan");
                
                const monthlyTotal = monthlyAdvance?.totalAmount || 0;
                const monthlyRemaining = monthlyAdvance?.remainingAmount || 0;
                const monthlyPaid = monthlyTotal - monthlyRemaining;
                
                const loanTotal = loan?.totalAmount || 0;
                const loanRemaining = loan?.remainingAmount || 0;
                const loanPaid = loanTotal - loanRemaining;
                
                const totalDue = monthlyRemaining + loanRemaining;
                
                return (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px- py-2">
                      <div className="font-medium text-gray-800">{item.worker.name}</div>
                      <div className="text-xs text-gray-500">{item.worker.designation}</div>
                    </td>
                    {/* <td className="px-3 py-2 text-center text-green-600">₹{formatNumber(monthlyTotal)}</td> */}
                    {/* <td className="px-3 py-2 text-center text-blue-600">₹{formatNumber(monthlyPaid)}</td> */}
                    <td className="px-3 py-2 text-center text-orange-600">₹{formatNumber(monthlyRemaining)}</td>
                    <td className="px-3 py-2 text-center text-purple-600">₹{formatNumber(loanTotal)}</td>
                    <td className="px-3 py-2 text-center text-teal-600">₹{formatNumber(loanPaid)}</td>
                    <td className="px-3 py-2 text-center text-red-600">₹{formatNumber(loanRemaining)}</td>
                    <td className="px-3 py-2 text-center font-bold text-pink-600">₹{formatNumber(totalDue)}</td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-400 text-sm">
                    No workers found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="px-3 py-2 font-semibold">Total</td>
                  {/* <td className="px-3 py-2 text-center font-semibold text-green-700">₹{formatNumber(totals.totalMonthlyAdvance)}</td> */}
                  {/* <td className="px-3 py-2 text-center font-semibold text-blue-700">₹{formatNumber(totals.totalGiven - totals.totalDue - totals.totalLoanRemaining)}</td> */}
                  <td className="px-3 py-2 text-center font-semibold text-orange-700">₹{formatNumber(totals.totalMonthlyRemaining)}</td>
                  <td className="px-3 py-2 text-center font-semibold text-purple-700">₹{formatNumber(totals.totalLoan)}</td>
                  <td className="px-3 py-2 text-center font-semibold text-teal-700">₹{formatNumber(totals.totalLoan - totals.totalLoanRemaining)}</td>
                  <td className="px-3 py-2 text-center font-semibold text-red-700">₹{formatNumber(totals.totalLoanRemaining)}</td>
                  <td className="px-3 py-2 text-center font-semibold text-pink-700">₹{formatNumber(totals.totalDue)}</td>
                </tr>
              </tfoot>
            )}
           </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setViewMode("summary")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              viewMode === "summary" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📊 Summary View
          </button>
          <button
            onClick={() => setViewMode("detailed")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              viewMode === "detailed" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📋 Detailed View
          </button>
          <button
            onClick={() => setViewMode("worker")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              viewMode === "worker" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            👥 Worker-wise View
          </button>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
            Monthly Advance
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></span>
            Loan
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></span>
            Due Amount
          </span>
        </div>
      </div>

      {/* Active Filters Display */}
      {filters && (filters.type !== "all" || filters.worker !== "all" || filters.searchTerm) && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Active Filters:</span>
            {filters.type !== "all" && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                Type: {filters.type === "monthly" ? "Monthly Advance" : "Loan"}
              </span>
            )}
            {filters.worker !== "all" && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                Worker Filter Applied
              </span>
            )}
            {filters.searchTerm && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                Search: {filters.searchTerm}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === "summary" && renderSummaryView()}
      {viewMode === "detailed" && renderDetailedView()}
      {viewMode === "worker" && renderWorkerWiseView()}
      
      {/* Footer */}
      <div className="text-[10px] text-gray-400 text-center border-t pt-3">
        <p>Advance Report - Shows all monthly advances and loans with payment status</p>
        <p className="mt-1">Data includes advances given, remaining amounts, and repayment status</p>
      </div>
    </div>
  );
}