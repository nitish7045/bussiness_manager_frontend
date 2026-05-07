// src/components/salary/SalaryHistoryTable.jsx
import React, { useState } from "react";
import UPIQRModal from "./UPIQRModal";

export default function SalaryHistoryTable({ 
  salaries, 
  loading, 
  onViewHistory, 
  onMarkPaid, 
  onViewSlip, 
  onEditSalary,
  onDeleteSalary,
  workers 
}) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [selectedSalaryForDelete, setSelectedSalaryForDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [deleting, setDeleting] = useState(false);
  const [deleteOption, setDeleteOption] = useState("soft");

  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  const handlePayClick = (salary) => {
    const worker = workers?.find(w => w._id === salary.workerId?._id);
    setSelectedSalary({ salary, worker });
    setShowQRModal(true);
  };

  const handleDeleteClick = (salary) => {
    setSelectedSalaryForDelete(salary);
    setDeleteOption("soft");
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedSalaryForDelete) return;
    
    setDeleting(true);
    try {
      const shouldRestore = deleteOption === "restore";
      await onDeleteSalary(selectedSalaryForDelete._id, shouldRestore);
      setShowDeleteConfirm(false);
      setSelectedSalaryForDelete(null);
    } catch (error) {
      console.error("Error deleting salary:", error);
      alert("Failed to delete salary record");
    } finally {
      setDeleting(false);
    }
  };

  const handlePaymentSuccess = async (paymentNotes) => {
    if (selectedSalary) {
      await onMarkPaid(selectedSalary.salary._id);
      setShowQRModal(false);
      setSelectedSalary(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>;
      case 'processed':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Processed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Calculated</span>;
    }
  };

  const getFilteredAndSortedSalaries = () => {
    let filtered = [...salaries];
    
    if (searchTerm) {
      filtered = filtered.filter(salary =>
        salary.workerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salary.workerId?.designation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType === "paid") {
      filtered = filtered.filter(salary => salary.status === "paid");
    } else if (filterType === "unpaid") {
      filtered = filtered.filter(salary => salary.status !== "paid");
    } else if (filterType === "hasCarryForward") {
      filtered = filtered.filter(salary => 
        (salary.carryForwardToNext?.monthlyAdvance > 0 || salary.carryForwardToNext?.loan > 0)
      );
    } else if (filterType === "highSalary") {
      filtered = filtered.filter(salary => salary.netSalary > 20000);
    } else if (filterType === "lowSalary") {
      filtered = filtered.filter(salary => salary.netSalary <= 20000);
    }
    
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortBy) {
        case "name":
          aValue = a.workerId?.name || "";
          bValue = b.workerId?.name || "";
          break;
        case "earnings":
          aValue = a.earnings?.totalEarnings || 0;
          bValue = b.earnings?.totalEarnings || 0;
          break;
        case "netSalary":
          aValue = a.netSalary || 0;
          bValue = b.netSalary || 0;
          break;
        case "advance":
          aValue = a.deductions?.monthlyAdvanceDeducted || 0;
          bValue = b.deductions?.monthlyAdvanceDeducted || 0;
          break;
        case "loan":
          aValue = a.deductions?.loanDeducted || 0;
          bValue = b.deductions?.loanDeducted || 0;
          break;
        case "carryForward":
          aValue = (a.carryForwardToNext?.monthlyAdvance || 0) + (a.carryForwardToNext?.loan || 0);
          bValue = (b.carryForwardToNext?.monthlyAdvance || 0) + (b.carryForwardToNext?.loan || 0);
          break;
        default:
          aValue = a.workerId?.name || "";
          bValue = b.workerId?.name || "";
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const filteredSalaries = getFilteredAndSortedSalaries();
  
  const stats = {
    total: filteredSalaries.length,
    totalEarnings: filteredSalaries.reduce((sum, s) => sum + (s.earnings?.totalEarnings || 0), 0),
    totalNetSalary: filteredSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0),
    totalPaid: filteredSalaries.filter(s => s.status === "paid").length,
    totalUnpaid: filteredSalaries.filter(s => s.status !== "paid").length,
    withCarryForward: filteredSalaries.filter(s => 
      (s.carryForwardToNext?.monthlyAdvance > 0 || s.carryForwardToNext?.loan > 0)
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

  const hasDeductions = (salary) => {
    return (salary.deductions?.monthlyAdvanceDeducted > 0 || salary.deductions?.loanDeducted > 0);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (salaries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No salary records found
      </div>
    );
  }

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
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
              <option value="all">All Records</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="hasCarryForward">Has Carry Forward</option>
              <option value="highSalary">High Net Salary (&gt; ₹20,000)</option>
              <option value="lowSalary">Low Net Salary (≤ ₹20,000)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="name">Worker Name</option>
              <option value="earnings">Total Earnings</option>
              <option value="netSalary">Net Salary</option>
              <option value="advance">Advance Deducted</option>
              <option value="loan">Loan Deducted</option>
              <option value="carryForward">Carry Forward Amount</option>
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
                Filter: {filterType === "paid" ? "Paid Only" : 
                         filterType === "unpaid" ? "Unpaid Only" :
                         filterType === "hasCarryForward" ? "Has Carry Forward" :
                         filterType === "highSalary" ? "High Net Salary" : "Low Net Salary"}
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
      
      {/* Summary Stats */}
      {filteredSalaries.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-500">Showing</div>
              <div className="text-sm font-bold text-gray-800">{filteredSalaries.length} / {salaries.length}</div>
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
              <div className="text-xs text-gray-500">Paid / Unpaid</div>
              <div className="text-sm font-bold">
                <span className="text-green-600">{stats.totalPaid}</span> / <span className="text-red-600">{stats.totalUnpaid}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">With Carry Forward</div>
              <div className="text-sm font-bold text-orange-600">{stats.withCarryForward}</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                Worker {getSortIcon("name")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Attendance</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("earnings")}>
                Earnings {getSortIcon("earnings")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("advance")}>
                Advance Deducted {getSortIcon("advance")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("loan")}>
                Loan Deducted {getSortIcon("loan")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("netSalary")}>
                Net Salary {getSortIcon("netSalary")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("carryForward")}>
                Carry Forward {getSortIcon("carryForward")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSalaries.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-500 text-sm">
                  No records match the current filters
                </td>
              </tr>
            ) : (
              filteredSalaries.map(salary => {
                const hasSundayHoliday = salary.attendance?.sundayHoliday > 0;
                const hasSundayPresent = salary.attendance?.sundayPresent > 0;
                const hasSundayHalf = salary.attendance?.sundayHalf > 0;
                
                return (
                  <tr key={salary._id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-800 text-sm">{salary.workerId?.name}</div>
                      <div className="text-xs text-gray-500">{salary.workerId?.designation}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs space-y-0.5">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-green-600">P: {salary.attendance?.weekdayPresent || 0}</span>
                          {salary.attendance?.weekdayHalf > 0 && (
                            <span className="text-yellow-600 ml-1">H: {salary.attendance?.weekdayHalf}</span>
                          )}
                          {hasSundayPresent && (
                            <span className="text-purple-600 ml-1">SunP: {salary.attendance?.sundayPresent}</span>
                          )}
                          {hasSundayHalf && (
                            <span className="text-orange-600 ml-1">SunH: {salary.attendance?.sundayHalf}</span>
                          )}
                          {hasSundayHoliday && (
                            <span className="text-blue-600 ml-1">SunHol: {salary.attendance?.sundayHoliday}</span>
                          )}
                          {salary.attendance?.otherHolidays > 0 && (
                            <span className="text-blue-600 ml-1">Hol: {salary.attendance?.otherHolidays}</span>
                          )}
                          {salary.attendance?.overtimeHours > 0 && (
                            <span className="text-red-600 ml-1">OT: {salary.attendance?.overtimeHours}h</span>
                          )}
                        </div>
                        {(hasSundayPresent || hasSundayHalf || hasSundayHoliday) && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            Sun Total: {salary.attendance?.sundayPresent || 0}P / {salary.attendance?.sundayHalf || 0}H / {salary.attendance?.sundayHoliday || 0}Hol
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-semibold text-green-600">₹{formatNumber(salary.earnings?.totalEarnings)}</div>
                    </td>
                    <td className="px-3 py-2 text-sm">₹{formatNumber(salary.deductions?.monthlyAdvanceDeducted)}</td>
                    <td className="px-3 py-2 text-sm">₹{formatNumber(salary.deductions?.loanDeducted)}</td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-bold text-blue-600">₹{formatNumber(salary.netSalary)}</div>
                    </td>
                    <td className="px-3 py-2">
                      {salary.carryForwardToNext?.monthlyAdvance > 0 || salary.carryForwardToNext?.loan > 0 ? (
                        <div className="text-xs text-orange-600">
                          {salary.carryForwardToNext?.monthlyAdvance > 0 && `A: ₹${formatNumber(salary.carryForwardToNext.monthlyAdvance)}`}
                          {salary.carryForwardToNext?.loan > 0 && ` L: ₹${formatNumber(salary.carryForwardToNext.loan)}`}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{getStatusBadge(salary.status)}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => onViewHistory(salary.workerId._id)}
                          className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded hover:bg-gray-600"
                        >
                          History
                        </button>
                        <button
                          onClick={() => onViewSlip(salary)}
                          className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded hover:bg-purple-600 flex items-center gap-1"
                        >
                          📄 Slip
                        </button>
                        <button
                          onClick={() => onEditSalary(salary)}
                          className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded hover:bg-yellow-600 flex items-center gap-1"
                        >
                          ✏️ Edit
                        </button>
                        {salary.status !== "paid" && (
                          <button
                            onClick={() => handlePayClick(salary)}
                            className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600 flex items-center gap-1"
                          >
                            📱 Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(salary)}
                          className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 flex items-center gap-1"
                          title="Delete this salary record"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* QR Modal */}
      {showQRModal && selectedSalary && (
        <UPIQRModal
          worker={selectedSalary.worker}
          amount={selectedSalary.salary.netSalary}
          onClose={() => {
            setShowQRModal(false);
            setSelectedSalary(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Delete Confirmation Modal with Two Options */}
      {showDeleteConfirm && selectedSalaryForDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 px-5 py-3 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">Delete Salary Record</h2>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <p className="text-gray-700 mb-3">How would you like to delete this salary record?</p>
                
                {/* Worker Info */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">Worker: <span className="font-semibold">{selectedSalaryForDelete.workerId?.name}</span></p>
                  <p className="text-sm text-gray-600">Month: <span className="font-semibold">{selectedSalaryForDelete.month}/{selectedSalaryForDelete.year}</span></p>
                  <p className="text-sm text-gray-600">Net Salary: <span className="font-bold text-blue-600">₹{formatNumber(selectedSalaryForDelete.netSalary)}</span></p>
                </div>
                
                {/* Delete Options */}
                <div className="space-y-3">
                  {/* Option 1: Just Delete (Soft Delete) */}
                  <label 
                    className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      deleteOption === "soft" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setDeleteOption("soft")}
                  >
                    <input
                      type="radio"
                      name="deleteOption"
                      value="soft"
                      checked={deleteOption === "soft"}
                      onChange={() => setDeleteOption("soft")}
                      className="mt-0.5 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">Just Delete (Soft Delete)</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Delete the salary record only. 
                        {hasDeductions(selectedSalaryForDelete) ? (
                          <span className="text-red-500 block mt-1">
                            ⚠️ ₹{formatNumber(selectedSalaryForDelete.deductions?.monthlyAdvanceDeducted || 0)} advance and 
                            ₹{formatNumber(selectedSalaryForDelete.deductions?.loanDeducted || 0)} loan deducted will NOT be restored.
                          </span>
                        ) : (
                          <span className="text-green-500 block mt-1">No deductions were made from this salary.</span>
                        )}
                      </div>
                    </div>
                  </label>
                  
                  {/* Option 2: Delete with Restoration (only show if there are deductions) */}
                  {hasDeductions(selectedSalaryForDelete) && (
                    <label 
                      className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        deleteOption === "restore" 
                          ? "border-green-500 bg-green-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setDeleteOption("restore")}
                    >
                      <input
                        type="radio"
                        name="deleteOption"
                        value="restore"
                        checked={deleteOption === "restore"}
                        onChange={() => setDeleteOption("restore")}
                        className="mt-0.5 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-green-700">Delete & Restore Deductions</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Delete salary and restore deducted amounts back to advances.
                          <span className="text-green-600 block mt-1">
                            ✅ Will restore: 
                            {selectedSalaryForDelete.deductions?.monthlyAdvanceDeducted > 0 && ` Advance ₹${formatNumber(selectedSalaryForDelete.deductions.monthlyAdvanceDeducted)}`}
                            {selectedSalaryForDelete.deductions?.loanDeducted > 0 && ` Loan ₹${formatNumber(selectedSalaryForDelete.deductions.loanDeducted)}`}
                          </span>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-4">
                  <p className="text-xs text-yellow-700">
                    <span className="font-bold">⚠️ Note:</span> This action cannot be undone. 
                    {deleteOption === "restore" 
                      ? " The deducted amounts will be added back to the worker's advances."
                      : " Deducted amounts will be permanently lost."}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm text-white ${
                    deleteOption === "restore" 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50`}
                >
                  {deleting ? "Deleting..." : deleteOption === "restore" ? "Delete & Restore" : "Delete Only"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedSalaryForDelete(null);
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}