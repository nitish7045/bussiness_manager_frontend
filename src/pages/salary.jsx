// src/pages/SalaryManagement.js
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../api/api";
import SalaryHeader from "../components/salary/SalaryHeader";
import PeriodSelector from "../components/salary/PeriodSelector";
import WorkerSelector from "../components/salary/WorkerSelector";
import SalaryReviewTable from "../components/salary/SalaryReviewTable";
import SalaryHistoryTable from "../components/salary/SalaryHistoryTable";
import SalaryHistoryModal from "../components/salary/SalaryHistoryModal";
import SalarySlip from "../components/salary/SalarySlip";
import BulkSalaryDownload from "../components/salary/BulkSalaryDownload";

export default function SalaryManagement() {
  const location = useLocation();
  
  // Check if we're in edit mode from navigation state
  const editMode = location.state?.editMode || false;
  const editSalaryData = location.state?.salary || null;
  const editMonth = location.state?.month || new Date().getMonth() + 1;
  const editYear = location.state?.year || new Date().getFullYear();
  const editWorkerId = location.state?.workerId || null;

  // State declarations
  const [workers, setWorkers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(editMonth);
  const [selectedYear, setSelectedYear] = useState(editYear);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [salaryData, setSalaryData] = useState([]);
  const [showReview, setShowReview] = useState(editMode);
  const [processedSalaries, setProcessedSalaries] = useState([]);
  const [activeTab, setActiveTab] = useState(editMode ? "calculate" : "calculate");
  const [selectedWorkerForHistory, setSelectedWorkerForHistory] = useState(null);
  const [workerHistory, setWorkerHistory] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState(editWorkerId ? [editWorkerId] : []);
  const [selectAll, setSelectAll] = useState(false);
  
  // Salary slip states
  const [showSalarySlip, setShowSalarySlip] = useState(false);
  const [selectedSalaryForSlip, setSelectedSalaryForSlip] = useState(null);
  const [selectedWorkerForSlip, setSelectedWorkerForSlip] = useState(null);
  
  // Bulk download states
  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [companyDetails, setCompanyDetails] = useState({});

  // ==================== Helper Functions ====================
  
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  // ==================== API Calls ====================
  
  // Fetch all active workers
  const fetchWorkers = async () => {
    try {
      const res = await API.get("/employees");
      const activeWorkers = res.data.filter(w => w.status === "active");
      setWorkers(activeWorkers);
      
      // If in edit mode and worker is available, automatically calculate
      if (editMode && editWorkerId && activeWorkers.length > 0) {
        const worker = activeWorkers.find(w => w._id === editWorkerId);
        if (worker) {
          setTimeout(() => {
            calculateSingleSalary(worker, editSalaryData);
          }, 500);
        }
      }
    } catch (err) {
      console.error("Error fetching workers:", err);
      alert("Error fetching workers");
    }
  };

  // Fetch company details
  const fetchCompanyDetails = async () => {
    try {
      const res = await API.get("/auth/company-details");
      setCompanyDetails(res.data.companyDetails || {});
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  // Fetch processed salaries
  const fetchProcessedSalaries = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/salary/monthly?month=${selectedMonth}&year=${selectedYear}`);
      setProcessedSalaries(res.data);
    } catch (err) {
      console.error("Error fetching processed salaries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch worker history
  const fetchWorkerHistory = async (workerId) => {
    setLoading(true);
    try {
      const res = await API.get(`/salary/worker/${workerId}/history`);
      setWorkerHistory(res.data);
      const worker = workers.find(w => w._id === workerId);
      setSelectedWorkerForHistory(worker);
    } catch (err) {
      console.error("Error fetching worker history:", err);
    } finally {
      setLoading(false);
    }
  };

 // Update the handleDeleteSalary function
const handleDeleteSalary = async (salaryId, shouldRestore = false) => {
  try {
    const url = shouldRestore 
      ? `/salary/${salaryId}?restoreAmounts=true` 
      : `/salary/${salaryId}`;
    
    const res = await API.delete(url);
    alert(res.data.msg);
    // Refresh the salary list
    await fetchProcessedSalaries();
  } catch (error) {
    console.error("Error deleting salary:", error);
    alert(error.response?.data?.msg || "Failed to delete salary record");
    throw error;
  }
};

  // ==================== Salary Calculation Functions ====================
  
  // Calculate single salary for edit mode
  const calculateSingleSalary = async (worker, existingSalary = null) => {
    setCalculating(true);
    try {
      const res = await API.post(`/salary/calculate/${worker._id}`, {
        month: selectedMonth,
        year: selectedYear
      });
      
      // Default owner edits
      let ownerEdits = {
        monthlyAdvance: res.data.deductions?.defaultMonthlyDeduction || 0,
        loan: res.data.deductions?.defaultLoanDeduction || 0,
        notes: ""
      };
      
      // If editing existing salary, use its deduction values
      if (existingSalary) {
        ownerEdits = {
          monthlyAdvance: existingSalary.ownerEdits?.monthlyAdvanceDeduction || existingSalary.deductions?.monthlyAdvanceDeducted || 0,
          loan: existingSalary.ownerEdits?.loanDeduction || existingSalary.deductions?.loanDeducted || 0,
          notes: existingSalary.ownerEdits?.notes || ""
        };
      }
      
      setSalaryData([{
        ...res.data,
        workerId: worker._id,
        ownerEdits
      }]);
      setShowReview(true);
    } catch (err) {
      console.error(`Error calculating salary for ${worker.name}:`, err);
      alert("Error calculating salary");
    } finally {
      setCalculating(false);
    }
  };

  // Calculate salary for all workers
  const calculateAllSalaries = async () => {
    if (!window.confirm(`Calculate salaries for ${workers.length} workers?`)) return;

    setCalculating(true);
    setSalaryData([]);
    
    const results = [];
    
    for (const worker of workers) {
      try {
        const res = await API.post(`/salary/calculate/${worker._id}`, {
          month: selectedMonth,
          year: selectedYear
        });
        
        results.push({
          ...res.data,
          workerId: worker._id,
          ownerEdits: {
            monthlyAdvance: res.data.deductions?.defaultMonthlyDeduction || 0,
            loan: res.data.deductions?.defaultLoanDeduction || 0,
            notes: ""
          }
        });
      } catch (err) {
        console.error(`Error calculating salary for ${worker.name}:`, err);
        results.push({
          worker: { _id: worker._id, name: worker.name, designation: worker.designation },
          error: true,
          message: err.response?.data?.msg || "Calculation failed"
        });
      }
    }
    
    setSalaryData(results);
    setShowReview(true);
    setCalculating(false);
  };

  // Calculate salary for selected workers
  const calculateSelectedSalaries = async () => {
    if (!window.confirm(`Calculate salaries for ${selectedWorkers.length} selected workers?`)) return;

    setCalculating(true);
    setSalaryData([]);
    
    const results = [];
    const selectedWorkersList = workers.filter(w => selectedWorkers.includes(w._id));
    
    for (const worker of selectedWorkersList) {
      try {
        const res = await API.post(`/salary/calculate/${worker._id}`, {
          month: selectedMonth,
          year: selectedYear
        });
        
        results.push({
          ...res.data,
          workerId: worker._id,
          ownerEdits: {
            monthlyAdvance: res.data.deductions?.defaultMonthlyDeduction || 0,
            loan: res.data.deductions?.defaultLoanDeduction || 0,
            notes: ""
          }
        });
      } catch (err) {
        console.error(`Error calculating salary for ${worker.name}:`, err);
        results.push({
          worker: { _id: worker._id, name: worker.name, designation: worker.designation },
          error: true,
          message: err.response?.data?.msg || "Calculation failed"
        });
      }
    }
    
    setSalaryData(results);
    setShowReview(true);
    setCalculating(false);
  };

  // Update deduction
  const updateDeduction = (index, type, value) => {
    const updated = [...salaryData];
    if (type === 'notes') {
      updated[index].ownerEdits.notes = value;
    } else {
      updated[index].ownerEdits[type] = value;
    
      const earnings = updated[index].earnings.totalEarnings;
      const totalDeductions = updated[index].ownerEdits.monthlyAdvance + updated[index].ownerEdits.loan;
      let netSalary = earnings - totalDeductions;
      let monthlyRemaining = 0;
      let loanRemaining = 0;
      
      if (netSalary < 0) {
        const excess = Math.abs(netSalary);
        if (updated[index].ownerEdits.monthlyAdvance > 0 && updated[index].ownerEdits.loan > 0) {
          const ratio = updated[index].ownerEdits.monthlyAdvance / totalDeductions;
          monthlyRemaining = excess * ratio;
          loanRemaining = excess - monthlyRemaining;
        } else if (updated[index].ownerEdits.monthlyAdvance > 0) {
          monthlyRemaining = excess;
        } else if (updated[index].ownerEdits.loan > 0) {
          loanRemaining = excess;
        }
        netSalary = 0;
      }
      
      updated[index].calculatedNetSalary = netSalary;
      updated[index].calculatedRemaining = {
        monthlyAdvance: monthlyRemaining,
        loan: loanRemaining
      };
    }
    setSalaryData(updated);
  };

  // Save all salaries
  const saveAllSalaries = async () => {
    if (!window.confirm(`Save ${salaryData.length} salary record(s)?`)) return;

    setLoading(true);
    
    try {
      const salariesToSave = salaryData.map(data => ({
        workerId: data.workerId,
        month: selectedMonth,
        year: selectedYear,
        attendance: data.attendance,
        rates: data.rates,
        earnings: data.earnings,
        deductions: data.ownerEdits,
        notes: data.ownerEdits.notes
      }));
      
      const res = await API.post("/salary/save", { salaries: salariesToSave });
      alert(res.data.msg);
      setShowReview(false);
      setSalaryData([]);
      if (activeTab === "history") fetchProcessedSalaries();
    } catch (err) {
      console.error("Error saving salaries:", err);
      alert("Error saving salaries");
    } finally {
      setLoading(false);
    }
  };

  // ==================== Action Handlers ====================
  
  // Mark salary as paid
  const markAsPaid = async (salaryId) => {
    if (!window.confirm("Mark this salary as paid?")) return;
    try {
      await API.patch(`/salary/${salaryId}/paid`);
      fetchProcessedSalaries();
      alert("Salary marked as paid");
    } catch (err) {
      console.error("Error marking as paid:", err);
      alert("Error updating salary");
    }
  };

  // Handle view salary slip
  const handleViewSlip = (salary) => {
    const worker = workers.find(w => w._id === salary.workerId._id);
    setSelectedSalaryForSlip(salary);
    setSelectedWorkerForSlip(worker);
    setShowSalarySlip(true);
  };

  // Handle Edit Salary
  const handleEditSalary = (salary) => {
    // Set the month and year to the salary's month/year
    setSelectedMonth(salary.month);
    setSelectedYear(salary.year);
    // Set the worker as selected
    setSelectedWorkers([salary.workerId._id]);
    // Switch to calculate tab
    setActiveTab("calculate");
    // Clear any existing review data
    setShowReview(false);
    setSalaryData([]);
    
    // Wait a moment then trigger calculation for that worker
    setTimeout(() => {
      const worker = workers.find(w => w._id === salary.workerId._id);
      if (worker) {
        calculateSingleSalary(worker, salary);
      }
    }, 100);
  };

  const handleRemoveWorker = (index) => {
  const updatedData = [...salaryData];
  updatedData.splice(index, 1);
  setSalaryData(updatedData);
};

  // ==================== Worker Selection Handlers ====================
  
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(workers.map(w => w._id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectWorker = (workerId) => {
    if (selectedWorkers.includes(workerId)) {
      setSelectedWorkers(selectedWorkers.filter(id => id !== workerId));
    } else {
      setSelectedWorkers([...selectedWorkers, workerId]);
    }
  };

  // ==================== Effects ====================
  
  useEffect(() => {
    fetchWorkers();
    fetchCompanyDetails();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchProcessedSalaries();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  // ==================== Render ====================
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* <div className="max-w-7xl mx-auto"> */}
      <div className="w-full">
        <SalaryHeader />
        
        {/* Tabs */}
        <div className="mb-5">
          <div className="flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("calculate")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "calculate"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Calculate Salary
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Salary History
            </button>
          </div>
        </div>

        {/* Calculate Tab */}
        {activeTab === "calculate" && !showReview && (
          <>
            <PeriodSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
            
            <WorkerSelector
              workers={workers}
              selectedWorkers={selectedWorkers}
              selectAll={selectAll}
              onToggleSelectAll={toggleSelectAll}
              onToggleWorker={toggleSelectWorker}
            />
            
            <div className="flex gap-3">
              <button
                onClick={calculateAllSalaries}
                disabled={calculating || workers.length === 0}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {calculating ? "Calculating..." : "Calculate All Workers"}
              </button>
              <button
                onClick={calculateSelectedSalaries}
                disabled={calculating || selectedWorkers.length === 0}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
              >
                {calculating ? "Calculating..." : `Calculate Selected (${selectedWorkers.length})`}
              </button>
            </div>
          </>
        )}

        {/* Review Screen */}
        {showReview && (
          <SalaryReviewTable
            salaryData={salaryData}
            onUpdateDeduction={updateDeduction}
            onSave={saveAllSalaries}
             onRemoveWorker={handleRemoveWorker}  // Add this line
            onBack={() => {
              setShowReview(false);
              setSalaryData([]);
            }}
            loading={loading}
            month={selectedMonth}
            year={selectedYear}
          />
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-5">
            <PeriodSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-700">Salary Records</h2>
                <button
                  onClick={() => {
                    if (processedSalaries.length > 0) {
                      setShowBulkDownload(true);
                    } else {
                      alert("No salary records found for this month");
                    }
                  }}
                  className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-purple-700 transition flex items-center gap-1"
                >
                  📦 Bulk Download All
                </button>
              </div>
              <SalaryHistoryTable
                salaries={processedSalaries}
                loading={loading}
                onViewHistory={fetchWorkerHistory}
                onMarkPaid={markAsPaid}
                onViewSlip={handleViewSlip}
                onEditSalary={handleEditSalary}
                onDeleteSalary={handleDeleteSalary}  // NEW: Pass delete handler
                workers={workers}
              />
            </div>
          </div>
        )}

        {/* History Modal */}
        {selectedWorkerForHistory && workerHistory.length > 0 && (
          <SalaryHistoryModal
            worker={selectedWorkerForHistory}
            history={workerHistory}
            onClose={() => {
              setSelectedWorkerForHistory(null);
              setWorkerHistory([]);
            }}
          />
        )}

        {/* Salary Slip Modal */}
        {showSalarySlip && selectedSalaryForSlip && selectedWorkerForSlip && (
          <SalarySlip
            salary={selectedSalaryForSlip}
            worker={selectedWorkerForSlip}
            onClose={() => {
              setShowSalarySlip(false);
              setSelectedSalaryForSlip(null);
              setSelectedWorkerForSlip(null);
            }}
            onSend={async (email) => {
              try {
                await API.post("/email/send-salary-slip", {
                  email,
                  salaryId: selectedSalaryForSlip._id
                });
                alert(`Salary slip sent to ${email}`);
              } catch (err) {
                console.error("Error sending email:", err);
                alert("Error sending email. Please try again.");
              }
            }}
          />
        )}

        {/* Bulk Download Modal */}
        {showBulkDownload && (
          <BulkSalaryDownload
            salaries={processedSalaries}
            month={selectedMonth}
            year={selectedYear}
            companyDetails={companyDetails}
            onClose={() => setShowBulkDownload(false)}
          />
        )}
      </div>
    </div>
  );
}