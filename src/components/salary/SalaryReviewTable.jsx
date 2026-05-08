// src/components/salary/SalaryReviewTable.jsx
import React, { useState } from "react";
import SalaryBreakdown from "./SalaryBreakdown";

export default function SalaryReviewTable({ salaryData, onUpdateDeduction, onSave, onBack, onRemoveWorker, loading, month, year }) {
  const [expandedRows, setExpandedRows] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
  const [errorMessages, setErrorMessages] = useState({});

  const toggleExpand = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;
  
  const getMonthName = (month) => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[month - 1];
  };

  const handleRemoveWorker = (index, workerName) => {
    setShowRemoveConfirm({ index, workerName });
  };

  const confirmRemove = () => {
    if (showRemoveConfirm) {
      onRemoveWorker(showRemoveConfirm.index);
      setShowRemoveConfirm(null);
    }
  };

  const cancelRemove = () => {
    setShowRemoveConfirm(null);
  };

  // Validate and update deduction with limit
  const handleDeductionChange = (index, type, value, maxLimit) => {
    // Clear any existing error for this worker
    setErrorMessages(prev => ({ ...prev, [index]: undefined }));
    
    // Ensure value is not negative and not exceeding max limit
    let limitedValue = Math.min(value, maxLimit);
    
    if (limitedValue !== value) {
      // Show error message
      setErrorMessages(prev => ({ 
        ...prev, 
        [index]: `${type === 'monthlyAdvance' ? 'Monthly advance' : 'Loan'} cannot exceed ₹${formatNumber(maxLimit)}` 
      }));
      // Auto-clear error after 3 seconds
      setTimeout(() => {
        setErrorMessages(prev => ({ ...prev, [index]: undefined }));
      }, 3000);
    }
    
    onUpdateDeduction(index, type, limitedValue);
  };

  // Filter and sort data
  const getFilteredAndSortedData = () => {
    let filtered = [...salaryData];
    filtered = filtered.filter(data => !data.error);
    
    if (searchTerm) {
      filtered = filtered.filter(data =>
        data.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.worker.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType === "highEarnings") {
      filtered = filtered.filter(data => data.earnings.totalEarnings > 30000);
    } else if (filterType === "lowEarnings") {
      filtered = filtered.filter(data => data.earnings.totalEarnings <= 30000);
    } else if (filterType === "highNet") {
      filtered = filtered.filter(data => {
        const earnings = data.earnings.totalEarnings;
        const totalDeductions = data.ownerEdits.monthlyAdvance + data.ownerEdits.loan;
        const netSalary = earnings - totalDeductions;
        return netSalary > 20000;
      });
    } else if (filterType === "lowNet") {
      filtered = filtered.filter(data => {
        const earnings = data.earnings.totalEarnings;
        const totalDeductions = data.ownerEdits.monthlyAdvance + data.ownerEdits.loan;
        const netSalary = earnings - totalDeductions;
        return netSalary <= 20000;
      });
    } else if (filterType === "hasCarryForward") {
      filtered = filtered.filter(data => 
        data.calculatedRemaining && (data.calculatedRemaining.monthlyAdvance > 0 || data.calculatedRemaining.loan > 0)
      );
    } else if (filterType === "hasAdvance") {
      filtered = filtered.filter(data => data.deductions.monthlyAdvanceDue > 0);
    } else if (filterType === "hasLoan") {
      filtered = filtered.filter(data => data.deductions.loanDue > 0);
    }
    
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortBy) {
        case "name":
          aValue = a.worker.name;
          bValue = b.worker.name;
          break;
        case "earnings":
          aValue = a.earnings.totalEarnings;
          bValue = b.earnings.totalEarnings;
          break;
        case "netSalary":
          const aNet = a.earnings.totalEarnings - (a.ownerEdits.monthlyAdvance + a.ownerEdits.loan);
          const bNet = b.earnings.totalEarnings - (b.ownerEdits.monthlyAdvance + b.ownerEdits.loan);
          aValue = aNet;
          bValue = bNet;
          break;
        case "monthlyAdvance":
          aValue = a.deductions.monthlyAdvanceDue;
          bValue = b.deductions.monthlyAdvanceDue;
          break;
        case "loan":
          aValue = a.deductions.loanDue;
          bValue = b.deductions.loanDue;
          break;
        default:
          aValue = a.worker.name;
          bValue = b.worker.name;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const filteredData = getFilteredAndSortedData();
  
  const stats = {
    total: filteredData.length,
    totalEarnings: filteredData.reduce((sum, d) => sum + d.earnings.totalEarnings, 0),
    totalNetSalary: filteredData.reduce((sum, d) => {
      const net = d.earnings.totalEarnings - (d.ownerEdits.monthlyAdvance + d.ownerEdits.loan);
      return sum + net;
    }, 0),
    withCarryForward: filteredData.filter(d => 
      d.calculatedRemaining && (d.calculatedRemaining.monthlyAdvance > 0 || d.calculatedRemaining.loan > 0)
    ).length
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <div className="space-y-4">
      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Removal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove <strong>{showRemoveConfirm.workerName}</strong> from salary processing for {getMonthName(month)} {year}?
            </p>
            <p className="text-xs text-red-500 mb-4">
              This worker will not be included when saving salaries. You can add them back next month.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelRemove}
                className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Remove Worker
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 rounded-t-lg">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-blue-700">
              Review Salaries - {getMonthName(month)} {year}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={onBack}
                className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={onSave}
                disabled={loading}
                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save All"}
              </button>
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Workers</option>
                <option value="highEarnings">High Earnings (&gt; ₹30,000)</option>
                <option value="lowEarnings">Low Earnings (≤ ₹30,000)</option>
                <option value="highNet">High Net Salary (&gt; ₹20,000)</option>
                <option value="lowNet">Low Net Salary (≤ ₹20,000)</option>
                <option value="hasCarryForward">Has Carry Forward</option>
                <option value="hasAdvance">Has Monthly Advance</option>
                <option value="hasLoan">Has Loan</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="earnings">Total Earnings</option>
                <option value="netSalary">Net Salary</option>
                <option value="monthlyAdvance">Monthly Advance Due</option>
                <option value="loan">Loan Due</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          
          {(searchTerm || filterType !== "all") && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Active Filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="hover:text-blue-900">✕</button>
                </span>
              )}
              {filterType !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                  Filter: {filterType === "highEarnings" ? "High Earnings" : 
                           filterType === "lowEarnings" ? "Low Earnings" :
                           filterType === "highNet" ? "High Net Salary" :
                           filterType === "lowNet" ? "Low Net Salary" :
                           filterType === "hasCarryForward" ? "Has Carry Forward" :
                           filterType === "hasAdvance" ? "Has Monthly Advance" : "Has Loan"}
                  <button onClick={() => setFilterType("all")} className="hover:text-purple-900">✕</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setSortBy("name");
                  setSortOrder("asc");
                }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
        
        {filteredData.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center">
                <div className="text-xs text-gray-500">Showing</div>
                <div className="text-sm font-bold text-gray-800">{filteredData.length} / {salaryData.filter(d => !d.error).length}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Total Earnings</div>
                <div className="text-sm font-bold text-green-600">₹{formatNumber(stats.totalEarnings)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Total Net Salary</div>
                <div className="text-sm font-bold text-blue-600">₹{formatNumber(stats.totalNetSalary)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">With Carry Forward</div>
                <div className="text-sm font-bold text-orange-600">{stats.withCarryForward}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Remove Worker</div>
                <div className="text-sm font-bold text-red-600">Click ❌</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-8"></th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                  Worker {getSortIcon("name")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Attendance</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("earnings")}>
                  Earnings {getSortIcon("earnings")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("monthlyAdvance")}>
                  Monthly Advance {getSortIcon("monthlyAdvance")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("loan")}>
                  Loan {getSortIcon("loan")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("netSalary")}>
                  Net Salary {getSortIcon("netSalary")}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-12">Remove</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500 text-sm">
                    No workers match the current filters
                  </td>
                </tr>
              ) : (
                filteredData.map((data, idx) => {
                  const originalIndex = salaryData.findIndex(d => d.workerId === data.workerId);
                  const isExpanded = expandedRows[originalIndex];
                  const earnings = data.earnings.totalEarnings;
                  const monthlyDue = data.deductions.monthlyAdvanceDue;
                  const loanDue = data.deductions.loanDue;
                  const monthlyDeduction = data.ownerEdits.monthlyAdvance;
                  const loanDeduction = data.ownerEdits.loan;
                  const totalDeductions = monthlyDeduction + loanDeduction;
                  const netSalary = data.calculatedNetSalary !== undefined ? data.calculatedNetSalary : earnings - totalDeductions;
                  const hasCarryForward = data.calculatedRemaining && (data.calculatedRemaining.monthlyAdvance > 0 || data.calculatedRemaining.loan > 0);
                  const maxDeduction = earnings;
                  
                  return (
                    <React.Fragment key={originalIndex}>
                      <tr className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <button
                            onClick={() => toggleExpand(originalIndex)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? '▼' : '▶'}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-800 text-sm">{data.worker.name}</div>
                          <div className="text-xs text-gray-500">{data.worker.designation}</div>
                          <div className="text-[10px] text-gray-400">Daily: ₹{formatNumber(data.rates.dailySalary)}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <span className="text-green-600">P: {data.attendance.weekdayPresent}</span>
                            {data.attendance.weekdayHalf > 0 && <span className="text-yellow-600 ml-1">H: {data.attendance.weekdayHalf}</span>}
                            {data.attendance.sundayPresent > 0 && <span className="text-purple-600 ml-1">SunP: {data.attendance.sundayPresent}</span>}
                            {data.attendance.sundayHalf > 0 && <span className="text-orange-600 ml-1">SunH: {data.attendance.sundayHalf}</span>}
                            {data.attendance.sundayHoliday > 0 && <span className="text-blue-600 ml-1">SunHol: {data.attendance.sundayHoliday}</span>}
                            {data.attendance.otherHolidays > 0 && <span className="text-blue-600 ml-1">Hol: {data.attendance.otherHolidays}</span>}
                            {data.attendance.overtimeHours > 0 && <span className="text-red-600 ml-1">OT: {data.attendance.overtimeHours}h</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm font-semibold text-green-600">₹{formatNumber(earnings)}</div>
                          <div className="text-[10px] text-gray-400">Max: ₹{formatNumber(maxDeduction)}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-500 mb-1">Due: ₹{formatNumber(monthlyDue)}</div>
                          <input
                            type="text"
                            value={monthlyDeduction === 0 ? "" : monthlyDeduction}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^\d]/g, '');
                              value = value.replace(/^0+/, '');
                              const numValue = value === '' ? 0 : parseInt(value, 10);
                              handleDeductionChange(originalIndex, 'monthlyAdvance', numValue, maxDeduction);
                            }}
                            onFocus={(e) => {
                              if (e.target.value === "0") {
                                e.target.value = "";
                              }
                            }}
                            placeholder="0"
                            className={`w-24 border rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 ${
                              monthlyDeduction > maxDeduction ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                        </td>
                        <td className="px-3 py-2 relative">
                          <div className="text-xs text-gray-500 mb-1">Due: ₹{formatNumber(loanDue)}</div>
                          <input
                            type="text"
                            value={loanDeduction === 0 ? "" : loanDeduction}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^\d]/g, '');
                              value = value.replace(/^0+/, '');
                              const numValue = value === '' ? 0 : parseInt(value, 10);
                              handleDeductionChange(originalIndex, 'loan', numValue, maxDeduction - monthlyDeduction);
                            }}
                            onFocus={(e) => {
                              if (e.target.value === "0") {
                                e.target.value = "";
                              }
                            }}
                            placeholder="0"
                            className={`w-24 border rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 ${
                              loanDeduction > (maxDeduction - monthlyDeduction) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {errorMessages[originalIndex] && (
                            <div className="absolute z-50 mt-1 px-2 py-1 bg-red-600 text-white text-[10px] rounded shadow-lg whitespace-nowrap">
                              ⚠️ {errorMessages[originalIndex]}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className={`text-sm font-bold ${netSalary < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            ₹{formatNumber(netSalary < 0 ? 0 : netSalary)}
                          </div>
                          {netSalary < 0 && (
                            <div className="text-[10px] text-red-500">Deductions exceed earnings!</div>
                          )}
                          {hasCarryForward && (
                            <div className="text-[10px] text-orange-600">
                              Carry: {data.calculatedRemaining.monthlyAdvance > 0 && `A:₹${formatNumber(data.calculatedRemaining.monthlyAdvance)}`}
                              {data.calculatedRemaining.loan > 0 && ` L:₹${formatNumber(data.calculatedRemaining.loan)}`}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            placeholder="Notes"
                            value={data.ownerEdits.notes}
                            onChange={(e) => {
                              const updated = [...salaryData];
                              updated[originalIndex].ownerEdits.notes = e.target.value;
                              onUpdateDeduction(originalIndex, 'notes', e.target.value);
                            }}
                            className="w-32 border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleRemoveWorker(originalIndex, data.worker.name)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Remove this worker from salary processing"
                          >
                            ❌
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expandable Detailed Breakdown Row */}
                      {isExpanded && (
                        <tr className="bg-gray-50 border-t">
                          <td colSpan="9" className="px-4 py-3">
                            <SalaryBreakdown
                              data={data}
                              monthlyDeduction={Math.min(monthlyDeduction, maxDeduction)}
                              loanDeduction={Math.min(loanDeduction, maxDeduction - monthlyDeduction)}
                              totalDeductions={Math.min(totalDeductions, maxDeduction)}
                              netSalary={netSalary < 0 ? 0 : netSalary}
                              hasCarryForward={hasCarryForward}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}