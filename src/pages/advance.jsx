import React, { useEffect, useState, useRef } from "react";
import API from "../api/api";

export default function AdvanceManagement() {
  const [workers, setWorkers] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [activeTab, setActiveTab] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllWorkersView, setShowAllWorkersView] = useState(false);
  const [allWorkersAdvances, setAllWorkersAdvances] = useState([]);
  
  // Search states
  const [workerSearchInput, setWorkerSearchInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  
  // Filters for All Workers View
  const [filterType, setFilterType] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Form states
  const [advanceForm, setAdvanceForm] = useState({ amount: "", remark: "" });
  const [deductionForm, setDeductionForm] = useState({ amount: "", remark: "" });
  const [showConfirmDeductAll, setShowConfirmDeductAll] = useState(false);
  const [deductAllAdvance, setDeductAllAdvance] = useState(null);

  // Fetch ALL workers (active + inactive with dues)
  const fetchWorkers = async () => {
    try {
      const res = await API.get("/employees");
      const allWorkers = res.data;
      setWorkers(allWorkers);
      setFilteredWorkers(allWorkers);
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  // Filter workers based on search input
  useEffect(() => {
    if (workerSearchInput.trim() === "") {
      setFilteredWorkers(workers);
      return;
    }
    const filtered = workers.filter(worker =>
      worker.name.toLowerCase().includes(workerSearchInput.toLowerCase()) ||
      worker.designation.toLowerCase().includes(workerSearchInput.toLowerCase())
    );
    setFilteredWorkers(filtered);
  }, [workerSearchInput, workers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch ALL workers advances (including inactive)
  const fetchAllWorkersAdvances = async () => {
    setLoading(true);
    try {
      const results = [];
      for (const worker of workers) {
        try {
          const res = await API.get(`/advance/worker/${worker._id}`);
          const monthlyAdvance = res.data.find(a => a.type === "monthly");
          const loan = res.data.find(a => a.type === "loan");
          
          results.push({
            workerId: worker._id,
            name: worker.name,
            designation: worker.designation,
            status: worker.status,
            monthlyAdvance: monthlyAdvance || { remainingAmount: 0, totalAmount: 0, _id: null },
            loan: loan || { remainingAmount: 0, totalAmount: 0, _id: null }
          });
        } catch (err) {
          results.push({
            workerId: worker._id,
            name: worker.name,
            designation: worker.designation,
            status: worker.status,
            monthlyAdvance: { remainingAmount: 0, totalAmount: 0, _id: null },
            loan: loan || { remainingAmount: 0, totalAmount: 0, _id: null }
          });
        }
      }
      setAllWorkersAdvances(results);
    } catch (err) {
      console.error("Error fetching all workers advances:", err);
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvances = async (workerId) => {
    if (!workerId) return;
    setLoading(true);
    try {
      const res = await API.get(`/advance/worker/${workerId}`);
      setAdvances(res.data);
    } catch (err) {
      console.error("Error fetching advances:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (workerId) => {
    if (!workerId) return;
    try {
      const res = await API.get(`/advance/transactions?workerId=${workerId}`);
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      fetchAdvances(selectedWorker);
      fetchTransactions(selectedWorker);
    } else {
      setAdvances([]);
      setTransactions([]);
    }
  }, [selectedWorker]);

  const handleWorkerSelect = (workerId, workerName, workerDesignation) => {
    setSelectedWorker(workerId);
    setWorkerSearchInput(`${workerName} - ${workerDesignation}`);
    setShowDropdown(false);
    setSelectedAdvance(null);
    setShowAdvanceForm(false);
    setAdvanceForm({ amount: "", remark: "" });
    setDeductionForm({ amount: "", remark: "" });
    setShowAllWorkersView(false);
  };

  const handleViewAllWorkers = async () => {
    await fetchAllWorkersAdvances();
    setShowAllWorkersView(true);
    setSelectedWorker("");
    setWorkerSearchInput("");
  };

  // Deduct All Amount from an advance
  const handleDeductAll = (advance) => {
    setDeductAllAdvance(advance);
    setShowConfirmDeductAll(true);
  };

  const confirmDeductAll = async () => {
    if (!deductAllAdvance) return;
    
    const remainingAmount = deductAllAdvance.remainingAmount;
    if (remainingAmount <= 0) {
      alert("No amount left to deduct");
      setShowConfirmDeductAll(false);
      return;
    }

    setLoading(true);
    try {
      await API.post("/advance/debit", {
        advanceId: deductAllAdvance._id,
        amount: remainingAmount,
        remark: "Full amount deducted"
      });
      alert(`Successfully deducted ₹${remainingAmount}`);
      setShowConfirmDeductAll(false);
      setDeductAllAdvance(null);
      fetchAdvances(selectedWorker);
      fetchTransactions(selectedWorker);
      if (showAllWorkersView) fetchAllWorkersAdvances();
    } catch (err) {
      alert(err.response?.data?.msg || "Error deducting amount");
    } finally {
      setLoading(false);
    }
  };

  const giveAdvance = async (type) => {
    if (!advanceForm.amount || parseFloat(advanceForm.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await API.post("/advance/credit", {
        workerId: selectedWorker,
        amount: parseFloat(advanceForm.amount),
        type: type,
        remark: advanceForm.remark || `${type === "monthly" ? "Monthly" : "Loan"} advance given`
      });
      alert(`${type === "monthly" ? "Monthly advance" : "Loan"} given successfully`);
      setAdvanceForm({ amount: "", remark: "" });
      fetchAdvances(selectedWorker);
      fetchTransactions(selectedWorker);
      if (showAllWorkersView) fetchAllWorkersAdvances();
    } catch (err) {
      alert(err.response?.data?.msg || "Error giving advance");
    } finally {
      setLoading(false);
    }
  };

  const deductAdvance = async () => {
    if (!selectedAdvance) {
      alert("Please select an advance to deduct");
      return;
    }
    if (!deductionForm.amount || parseFloat(deductionForm.amount) <= 0) {
      alert("Please enter a valid deduction amount");
      return;
    }
    const selectedAdvanceData = advances.find(a => a._id === selectedAdvance);
    if (parseFloat(deductionForm.amount) > selectedAdvanceData.remainingAmount) {
      alert(`Cannot deduct more than remaining amount: ₹${selectedAdvanceData.remainingAmount}`);
      return;
    }
    setLoading(true);
    try {
      await API.post("/advance/debit", {
        advanceId: selectedAdvance,
        amount: parseFloat(deductionForm.amount),
        remark: deductionForm.remark || "Salary deduction"
      });
      alert("Advance deducted successfully");
      setDeductionForm({ amount: "", remark: "" });
      setShowAdvanceForm(false);
      setSelectedAdvance(null);
      fetchAdvances(selectedWorker);
      fetchTransactions(selectedWorker);
      if (showAllWorkersView) fetchAllWorkersAdvances();
    } catch (err) {
      alert(err.response?.data?.msg || "Error deducting advance");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatDateTime = (date) => new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  const selectedWorkerData = workers.find(w => w._id === selectedWorker);
  const filteredTransactions = transactions.filter(t => t.remark?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredAndSortedWorkers = getFilteredAndSortedWorkers();
  
  const filteredStats = {
    totalWorkers: filteredAndSortedWorkers.length,
    withAdvances: filteredAndSortedWorkers.filter(w => (w.monthlyAdvance?.remainingAmount || 0) > 0).length,
    withLoans: filteredAndSortedWorkers.filter(w => (w.loan?.remainingAmount || 0) > 0).length,
    totalDue: filteredAndSortedWorkers.reduce((sum, w) => sum + (w.monthlyAdvance?.remainingAmount || 0) + (w.loan?.remainingAmount || 0), 0)
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
  };
  const getSortIcon = (field) => sortBy !== field ? "↕️" : sortOrder === "asc" ? "↑" : "↓";

  function getFilteredAndSortedWorkers() {
    let filtered = [...allWorkersAdvances];
    
    if (filterSearch) {
      filtered = filtered.filter(worker =>
        worker.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
        worker.designation.toLowerCase().includes(filterSearch.toLowerCase())
      );
    }
    
    if (filterType === "hasAdvance") {
      filtered = filtered.filter(worker => (worker.monthlyAdvance?.remainingAmount || 0) > 0);
    } else if (filterType === "hasLoan") {
      filtered = filtered.filter(worker => (worker.loan?.remainingAmount || 0) > 0);
    } else if (filterType === "allClear") {
      filtered = filtered.filter(worker => 
        (worker.monthlyAdvance?.remainingAmount || 0) === 0 && 
        (worker.loan?.remainingAmount || 0) === 0
      );
    } else if (filterType === "inactive") {
      filtered = filtered.filter(worker => worker.status === "inactive");
    } else if (filterType === "active") {
      filtered = filtered.filter(worker => worker.status === "active");
    }
    
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch(sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "monthlyDue":
          aValue = a.monthlyAdvance?.remainingAmount || 0;
          bValue = b.monthlyAdvance?.remainingAmount || 0;
          break;
        case "loanDue":
          aValue = a.loan?.remainingAmount || 0;
          bValue = b.loan?.remainingAmount || 0;
          break;
        case "totalDue":
          aValue = (a.monthlyAdvance?.remainingAmount || 0) + (a.loan?.remainingAmount || 0);
          bValue = (b.monthlyAdvance?.remainingAmount || 0) + (b.loan?.remainingAmount || 0);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      return sortOrder === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
    
    return filtered;
  }

  // Loading Screen Component
  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-2xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-700 font-medium">Loading workers data...</p>
        <p className="text-xs text-gray-400">Please wait while we fetch all records</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Loading Overlay */}
        {loading && <LoadingScreen />}

        {/* Confirm Deduct All Modal */}
        {showConfirmDeductAll && deductAllAdvance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-500 to-orange-600 px-5 py-3 rounded-t-xl">
                <h2 className="text-lg font-bold text-white">Confirm Full Deduction</h2>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">Are you sure you want to deduct the full remaining amount?</p>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-600">Advance Type: <span className="font-semibold">{deductAllAdvance.type === "monthly" ? "Monthly Advance" : "Loan"}</span></p>
                    <p className="text-sm text-gray-600">Remaining Amount: <span className="font-bold text-red-600">₹{formatNumber(deductAllAdvance.remainingAmount)}</span></p>
                    <p className="text-xs text-gray-500 mt-1">This action cannot be undone</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={confirmDeductAll} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">Yes, Deduct All</button>
                  <button onClick={() => { setShowConfirmDeductAll(false); setDeductAllAdvance(null); }} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Advance Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage monthly advances and loans for workers</p>
          </div>
          <button
            onClick={handleViewAllWorkers}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md flex items-center gap-2 text-sm"
          >
            <span className="text-lg">👥</span>
            View All Workers
          </button>
        </div>

        {/* All Workers View */}
        {showAllWorkersView ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">All Workers - Advance Summary</h2>
              <button onClick={() => setShowAllWorkersView(false)} className="text-white hover:text-gray-200">✕ Close</button>
            </div>
            
            {/* Filters Section */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input type="text" placeholder="Search by name or designation..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="border rounded-md p-2 text-sm" />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-md p-2 text-sm">
                  <option value="all">All Workers</option>
                  <option value="active">Active Workers</option>
                  <option value="inactive">Inactive Workers</option>
                  <option value="hasAdvance">Has Monthly Advance</option>
                  <option value="hasLoan">Has Loan</option>
                  <option value="allClear">All Clear (No Dues)</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded-md p-2 text-sm">
                  <option value="name">Sort by Name</option>
                  <option value="monthlyDue">Sort by Monthly Due</option>
                  <option value="loanDue">Sort by Loan Due</option>
                  <option value="totalDue">Sort by Total Due</option>
                </select>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="border rounded-md p-2 text-sm">
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
            
            {/* Summary Stats */}
            {allWorkersAdvances.length > 0 && (
              <div className="p-4 bg-gray-50 border-b">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm"><div className="text-xs text-gray-500">Total Workers</div><div className="text-lg font-bold">{filteredStats.totalWorkers}</div></div>
                  <div className="bg-white rounded-lg p-3 shadow-sm"><div className="text-xs text-gray-500">With Advances</div><div className="text-lg font-bold text-orange-600">{filteredStats.withAdvances}</div></div>
                  <div className="bg-white rounded-lg p-3 shadow-sm"><div className="text-xs text-gray-500">With Loans</div><div className="text-lg font-bold text-red-600">{filteredStats.withLoans}</div></div>
                  <div className="bg-white rounded-lg p-3 shadow-sm"><div className="text-xs text-gray-500">Total Due</div><div className="text-lg font-bold text-blue-600">₹{formatNumber(filteredStats.totalDue)}</div></div>
                </div>
              </div>
            )}
            
            {/* Workers Table */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold cursor-pointer" onClick={() => handleSort("name")}>Worker {getSortIcon("name")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold cursor-pointer" onClick={() => handleSort("monthlyDue")}>Monthly Advance {getSortIcon("monthlyDue")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold cursor-pointer" onClick={() => handleSort("loanDue")}>Loan {getSortIcon("loanDue")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold cursor-pointer" onClick={() => handleSort("totalDue")}>Total Due {getSortIcon("totalDue")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedWorkers.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No workers found</td></tr>
                  ) : (
                    filteredAndSortedWorkers.map((worker, idx) => {
                      const monthlyDue = worker.monthlyAdvance?.remainingAmount || 0;
                      const loanDue = worker.loan?.remainingAmount || 0;
                      const totalDue = monthlyDue + loanDue;
                      return (
                        <tr key={worker.workerId} className={`border-t ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                          <td className="px-4 py-3 font-semibold text-sm">{worker.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{worker.designation}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${worker.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{worker.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                          <td className="px-4 py-3">{monthlyDue > 0 ? <span className="font-semibold text-orange-600">₹{formatNumber(monthlyDue)}</span> : <span className="text-xs text-green-600">No Advance</span>}</td>
                          <td className="px-4 py-3">{loanDue > 0 ? <span className="font-semibold text-red-600">₹{formatNumber(loanDue)}</span> : <span className="text-xs text-green-600">No Loan</span>}</td>
                          <td className="px-4 py-3">{totalDue > 0 ? <span className="font-bold text-blue-600">₹{formatNumber(totalDue)}</span> : <span className="text-xs text-green-600">All Clear</span>}</td>
                          <td className="px-4 py-3"><button onClick={() => handleWorkerSelect(worker.workerId, worker.name, worker.designation)} className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded hover:bg-blue-600">View Details</button></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Worker Selection Dropdown */}
            <div className="bg-white rounded-xl shadow-lg mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 rounded-t-xl">
                <h2 className="text-lg font-bold text-white">Select Worker</h2>
                <p className="text-xs text-white/80">Click dropdown or type to search</p>
              </div>
              <div className="p-5">
                <div className="relative">
                  <input ref={inputRef} type="text" placeholder="Type to search or click to see all workers..." value={workerSearchInput} onChange={(e) => setWorkerSearchInput(e.target.value)} onFocus={() => setShowDropdown(true)} className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 pr-10" autoComplete="off" />
                  <button onClick={() => setShowDropdown(!showDropdown)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">{showDropdown ? "▲" : "▼"}</button>
                  {showDropdown && (
                    <div ref={dropdownRef} className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-2xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b"><span className="text-xs text-gray-500">{filteredWorkers.length} worker(s) available</span></div>
                      <div className="max-h-80 overflow-y-auto">
                        {filteredWorkers.map((worker) => (
                          <div key={worker._id} onClick={() => handleWorkerSelect(worker._id, worker.name, worker.designation)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b">
                            <div className="flex justify-between items-start">
                              <div><div className="font-medium text-sm">{worker.name}</div><div className="text-xs text-gray-500">{worker.designation}</div></div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${worker.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{worker.status === "active" ? "Active" : "Inactive"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {selectedWorker && selectedWorkerData && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                    <div><span className="text-xs text-gray-600">Selected:</span><div className="font-semibold">{selectedWorkerData.name} - {selectedWorkerData.designation}</div></div>
                    <button onClick={() => { setSelectedWorker(""); setWorkerSearchInput(""); }} className="text-xs text-red-500">Change</button>
                  </div>
                )}
              </div>
            </div>

            {selectedWorker && (
              <>
                {/* Tabs */}
                <div className="mb-6 flex gap-2 border-b">
                  {["monthly", "loan", "history"].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>
                      {tab === "monthly" ? "Monthly Advance" : tab === "loan" ? "Loan" : "Transaction History"}
                    </button>
                  ))}
                </div>

                {/* Monthly Advance & Loan Sections */}
                {(activeTab === "monthly" || activeTab === "loan") && (
                  <div className="space-y-6">
                    {/* Give Advance Form */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className={`px-5 py-3 ${activeTab === "monthly" ? "bg-gradient-to-r from-green-500 to-teal-600" : "bg-gradient-to-r from-purple-500 to-pink-600"}`}>
                        <h2 className="text-lg font-bold text-white">{activeTab === "monthly" ? "Give Monthly Advance" : "Give Loan"}</h2>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="number" placeholder="Amount (₹)" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })} className="border rounded-lg p-2 text-sm" />
                          <input type="text" placeholder="Remark (Optional)" value={advanceForm.remark} onChange={(e) => setAdvanceForm({ ...advanceForm, remark: e.target.value })} className="border rounded-lg p-2 text-sm" />
                        </div>
                        <button onClick={() => giveAdvance(activeTab === "monthly" ? "monthly" : "loan")} disabled={loading} className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">Give {activeTab === "monthly" ? "Monthly Advance" : "Loan"}</button>
                      </div>
                    </div>

                    {/* Advances List Table */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="bg-gray-700 px-5 py-3 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white">{activeTab === "monthly" ? "Monthly Advances" : "Loans"}</h2>
                        <span className="text-xs text-gray-300">Total: {advances.filter(a => a.type === activeTab).length} record(s)</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold">Total Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold">Remaining</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold" colSpan="2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advances.filter(a => a.type === activeTab).length === 0 ? (
                              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No {activeTab === "monthly" ? "monthly advances" : "loans"} found</td></tr>
                            ) : (
                              advances.filter(a => a.type === activeTab).map(advance => (
                                <tr key={advance._id} className="border-t hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm">{formatDate(advance.createdAt)}</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{advance.totalAmount}</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-orange-600">₹{advance.remainingAmount}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${advance.remainingAmount === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                      {advance.remainingAmount === 0 ? 'Completed' : 'Active'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button 
                                      onClick={() => { setSelectedAdvance(advance._id); setShowAdvanceForm(true); }} 
                                      className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded hover:bg-blue-600 mr-2"
                                      disabled={advance.remainingAmount === 0}
                                    >
                                      Deduct
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button 
                                      onClick={() => handleDeductAll(advance)} 
                                      className={`text-xs px-2.5 py-1 rounded ${advance.remainingAmount > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                      disabled={advance.remainingAmount === 0}
                                    >
                                      Deduct All
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction History */}
                {activeTab === "history" && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gray-700 px-5 py-3"><h2 className="text-lg font-bold text-white">Transaction History</h2></div>
                    <div className="p-5">
                      <input type="text" placeholder="Search by remark..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-lg p-2 text-sm mb-4" />
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs">Date & Time</th>
                              <th className="px-4 py-3 text-left text-xs">Type</th>
                              <th className="px-4 py-3 text-left text-xs">Amount</th>
                              <th className="px-4 py-3 text-left text-xs">Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTransactions.length === 0 ? 
                              <tr><td colSpan="4" className="text-center py-8 text-gray-500">No transactions found</td></tr> :
                              filteredTransactions.map(t => (
                                <tr key={t._id} className="border-t hover:bg-gray-50">
                                  <td className="px-4 py-3 text-xs">{formatDateTime(t.date)}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {t.type === 'credit' ? 'Credit (Given)' : 'Debit (Deducted)'}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-semibold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'credit' ? '+' : '-'} ₹{t.amount}
                                  </td>
                                  <td className="px-4 py-3 text-sm">{t.remark || '-'}</td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deduction Modal */}
                {showAdvanceForm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 rounded-t-xl"><h2 className="text-lg font-bold text-white">Deduct Advance</h2></div>
                      <div className="p-5">
                        <input type="number" placeholder="Deduction Amount (₹)" value={deductionForm.amount} onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })} className="w-full border rounded-lg p-2 text-sm mb-3" />
                        <input type="text" placeholder="Remark (Optional)" value={deductionForm.remark} onChange={(e) => setDeductionForm({ ...deductionForm, remark: e.target.value })} className="w-full border rounded-lg p-2 text-sm mb-4" />
                        <div className="flex gap-3">
                          <button onClick={deductAdvance} disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Deduct</button>
                          <button onClick={() => { setShowAdvanceForm(false); setSelectedAdvance(null); setDeductionForm({ amount: "", remark: "" }); }} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}