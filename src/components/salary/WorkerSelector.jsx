// src/components/salary/WorkerSelector.jsx
import React, { useState, useEffect } from "react";

export default function WorkerSelector({ workers, selectedWorkers, selectAll, onToggleSelectAll, onToggleWorker }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredWorkers, setFilteredWorkers] = useState(workers);

  // Filter workers based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredWorkers(workers);
    } else {
      const filtered = workers.filter(worker =>
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (worker.email && worker.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredWorkers(filtered);
    }
  }, [searchTerm, workers]);

  // Calculate selection stats
  const selectedCount = selectedWorkers.length;
  const filteredCount = filteredWorkers.length;
  const filteredSelectedCount = filteredWorkers.filter(w => selectedWorkers.includes(w._id)).length;
  const isAllFilteredSelected = filteredCount > 0 && filteredSelectedCount === filteredCount;

  // Handle select all for filtered workers
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredWorkers.map(w => w._id);
    const allSelected = filteredIds.every(id => selectedWorkers.includes(id));
    
    if (allSelected) {
      // Remove all filtered workers from selection
      const newSelected = selectedWorkers.filter(id => !filteredIds.includes(id));
      onToggleSelectAll(false, newSelected);
    } else {
      // Add all filtered workers to selection
      const newSelected = [...new Set([...selectedWorkers, ...filteredIds])];
      onToggleSelectAll(false, newSelected);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-5">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Select Workers</h2>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={onToggleSelectAll}
                className="rounded"
              />
              Select All ({workers.length})
            </label>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="🔍 Search by name, designation, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Search Results Info */}
        {searchTerm && (
          <div className="mt-2 flex justify-between items-center text-xs">
            <span className="text-gray-500">
              Found {filteredCount} worker(s) matching "{searchTerm}"
            </span>
            {filteredCount > 0 && (
              <button
                onClick={handleSelectAllFiltered}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {isAllFilteredSelected ? "Deselect All" : "Select All"} ({filteredCount})
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 max-h-80 overflow-y-auto">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No workers found matching "{searchTerm}"</p>
            <button
              onClick={clearSearch}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            {/* Selection Summary (visible when workers are selected) */}
            {selectedCount > 0 && !searchTerm && (
              <div className="mb-3 pb-2 border-b border-gray-200">
                <span className="text-xs text-green-600 font-medium">
                  ✓ {selectedCount} worker(s) selected
                </span>
              </div>
            )}
            
            {/* Worker Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredWorkers.map(worker => (
                <label
                  key={worker._id}
                  className={`flex items-center gap-2 text-sm p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedWorkers.includes(worker._id)
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedWorkers.includes(worker._id)}
                    onChange={() => onToggleWorker(worker._id)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{worker.name}</div>
                    <div className="text-xs text-gray-500 truncate">{worker.designation}</div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Footer with selection info */}
      {selectedCount > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">
              Total selected: <span className="font-semibold text-blue-600">{selectedCount}</span> worker(s)
            </span>
            {selectedCount === workers.length && (
              <span className="text-green-600">All workers selected</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}