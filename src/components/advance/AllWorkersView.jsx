import React, { useState, useEffect } from "react";
import AllWorkersFilters from "./AllWorkersFilters";
import AllWorkersStats from "./AllWorkersStats";
import AllWorkersTable from "./AllWorkersTable";

export default function AllWorkersView({ workers, loading, onWorkerSelect, onRefresh, onBack }) {
  const [filterSearch, setFilterSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Reset filters when component mounts
  useEffect(() => {
    setFilterSearch("");
    setFilterType("all");
    setSortBy("name");
    setSortOrder("asc");
  }, []);

  const getFilteredAndSortedWorkers = () => {
    if (!workers || workers.length === 0) return [];
    
    let filtered = [...workers];
    
    if (filterSearch) {
      filtered = filtered.filter(worker =>
        worker?.name?.toLowerCase().includes(filterSearch.toLowerCase()) ||
        worker?.designation?.toLowerCase().includes(filterSearch.toLowerCase())
      );
    }
    
    if (filterType === "hasAdvance") {
      filtered = filtered.filter(worker => {
        const monthlyDue = worker?.monthlyAdvances?.reduce((sum, m) => 
          m?.status === "active" ? sum + (m?.remainingAmount || 0) : sum, 0
        ) || 0;
        return monthlyDue > 0;
      });
    } else if (filterType === "hasLoan") {
      filtered = filtered.filter(worker => {
        const loanDue = worker?.loans?.reduce((sum, l) => 
          l?.status === "active" ? sum + (l?.remainingAmount || 0) : sum, 0
        ) || 0;
        return loanDue > 0;
      });
    } else if (filterType === "allClear") {
      filtered = filtered.filter(worker => {
        const monthlyDue = worker?.monthlyAdvances?.reduce((sum, m) => 
          m?.status === "active" ? sum + (m?.remainingAmount || 0) : sum, 0
        ) || 0;
        const loanDue = worker?.loans?.reduce((sum, l) => 
          l?.status === "active" ? sum + (l?.remainingAmount || 0) : sum, 0
        ) || 0;
        return monthlyDue === 0 && loanDue === 0;
      });
    } else if (filterType === "active") {
      filtered = filtered.filter(worker => worker?.status === "active");
    } else if (filterType === "inactive") {
      filtered = filtered.filter(worker => worker?.status === "inactive");
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch(sortBy) {
        case "name":
          aValue = a?.name || "";
          bValue = b?.name || "";
          break;
        case "monthlyDue":
          aValue = a?.monthlyAdvances?.reduce((sum, m) => 
            m?.status === "active" ? sum + (m?.remainingAmount || 0) : sum, 0
          ) || 0;
          bValue = b?.monthlyAdvances?.reduce((sum, m) => 
            m?.status === "active" ? sum + (m?.remainingAmount || 0) : sum, 0
          ) || 0;
          break;
        case "loanDue":
          aValue = a?.loans?.reduce((sum, l) => 
            l?.status === "active" ? sum + (l?.remainingAmount || 0) : sum, 0
          ) || 0;
          bValue = b?.loans?.reduce((sum, l) => 
            l?.status === "active" ? sum + (l?.remainingAmount || 0) : sum, 0
          ) || 0;
          break;
        case "totalDue":
          aValue = (a?.monthlyAdvances?.reduce((sum, m) => 
            m?.status === "active" ? sum + (m?.remainingAmount || 0) : sum, 0
          ) || 0) + (a?.loans?.reduce((sum, l) => 
            l?.status === "active" ? sum + (l?.remainingAmount || 0) : sum, 0
          ) || 0);
          bValue = (b?.monthlyAdvances?.reduce((sum, m) => 
            m?.status === "active" ? sum + (m?.remainingAmount || 0) : sum, 0
          ) || 0) + (b?.loans?.reduce((sum, l) => 
            l?.status === "active" ? sum + (l?.remainingAmount || 0) : sum, 0
          ) || 0);
          break;
        default:
          aValue = a?.name || "";
          bValue = b?.name || "";
      }
      return sortOrder === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
    
    return filtered;
  };

  const filteredWorkers = getFilteredAndSortedWorkers();
  
  const stats = {
    totalWorkers: filteredWorkers.length,
    withAdvances: filteredWorkers.filter(w => {
      const due = w?.monthlyAdvances?.reduce((sum, m) => 
        m?.status === "active" ? sum + (m?.remainingAmount || 0) : sum, 0
      ) || 0;
      return due > 0;
    }).length,
    withLoans: filteredWorkers.filter(w => {
      const due = w?.loans?.reduce((sum, l) => 
        l?.status === "active" ? sum + (l?.remainingAmount || 0) : sum, 0
      ) || 0;
      return due > 0;
    }).length,
    totalDue: filteredWorkers.reduce((sum, w) => {
      const monthlyDue = w?.monthlyAdvances?.reduce((s, m) => 
        m?.status === "active" ? s + (m?.remainingAmount || 0) : s, 0
      ) || 0;
      const loanDue = w?.loans?.reduce((s, l) => 
        l?.status === "active" ? s + (l?.remainingAmount || 0) : s, 0
      ) || 0;
      return sum + monthlyDue + loanDue;
    }, 0),
    activeWorkers: filteredWorkers.filter(w => w?.status === "active").length,
    inactiveWorkers: filteredWorkers.filter(w => w?.status === "inactive").length
  };

  if (loading && (!workers || workers.length === 0)) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">All Workers - Advance Summary</h2>
          <button
            onClick={onBack}
            className="text-white hover:text-gray-200 text-sm bg-white/20 px-3 py-1 rounded"
          >
            ← Back
          </button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading workers data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">All Workers - Advance Summary</h2>
          <p className="text-xs text-white/80 mt-1">Total Workers: {workers?.length || 0}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="text-white hover:text-gray-200 text-sm bg-white/20 px-3 py-1 rounded transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={onBack}
            className="text-white hover:text-gray-200 text-sm bg-white/20 px-3 py-1 rounded transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
      
      <AllWorkersFilters
        filterSearch={filterSearch}
        setFilterSearch={setFilterSearch}
        filterType={filterType}
        setFilterType={setFilterType}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      
      <AllWorkersStats stats={stats} />
      
      <AllWorkersTable
        workers={filteredWorkers}
        loading={loading}
        onWorkerSelect={onWorkerSelect}
      />
    </div>
  );
}