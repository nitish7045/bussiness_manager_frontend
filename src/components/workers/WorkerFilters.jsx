// src/components/workers/WorkerFilters.jsx
import React from "react";

export default function WorkerFilters({ 
  statusFilter, 
  onStatusChange, 
  searchTerm, 
  onSearchChange,
  totalCount,
  activeCount,
  inactiveCount 
}) {
  return (
    <>
      {/* Status Filter Tabs with Counts */}
      <div className="mb-5">
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => onStatusChange("all")}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              statusFilter === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === "all" 
                ? "bg-blue-100 text-blue-700" 
                : "bg-gray-100 text-gray-600"
            }`}>
              {totalCount}
            </span>
          </button>
          <button
            onClick={() => onStatusChange("active")}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              statusFilter === "active"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Active
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === "active" 
                ? "bg-green-100 text-green-700" 
                : "bg-gray-100 text-gray-600"
            }`}>
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => onStatusChange("inactive")}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              statusFilter === "inactive"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Inactive
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === "inactive" 
                ? "bg-red-100 text-red-700" 
                : "bg-gray-100 text-gray-600"
            }`}>
              {inactiveCount}
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, designation, or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
  );
}