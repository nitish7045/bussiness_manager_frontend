import React from "react";

export default function AllWorkersFilters({ 
  filterSearch, setFilterSearch, 
  filterType, setFilterType, 
  sortBy, setSortBy, 
  sortOrder, setSortOrder 
}) {
  const clearAllFilters = () => {
    setFilterSearch("");
    setFilterType("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name or designation..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Filter</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Workers</option>
            <option value="active">Active Workers</option>
            <option value="inactive">Inactive Workers</option>
            <option value="hasAdvance">Has Monthly Advance</option>
            <option value="hasLoan">Has Loan</option>
            <option value="allClear">All Clear (No Dues)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-purple-500"
          >
            <option value="name">Name</option>
            <option value="monthlyDue">Monthly Advance Due</option>
            <option value="loanDue">Loan Due</option>
            <option value="totalDue">Total Due</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-purple-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
      
      {(filterSearch || filterType !== "all") && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Active Filters:</span>
          {filterSearch && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
              Search: {filterSearch}
              <button onClick={() => setFilterSearch("")} className="hover:text-blue-900">✕</button>
            </span>
          )}
          {filterType !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
              Filter: {filterType === "active" ? "Active Workers" : 
                       filterType === "inactive" ? "Inactive Workers" :
                       filterType === "hasAdvance" ? "Has Monthly Advance" : 
                       filterType === "hasLoan" ? "Has Loan" : "All Clear"}
              <button onClick={() => setFilterType("all")} className="hover:text-purple-900">✕</button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}