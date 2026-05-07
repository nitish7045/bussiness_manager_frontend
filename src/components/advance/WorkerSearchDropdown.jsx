import React, { useState, useRef, useEffect } from "react";

export default function WorkerSearchDropdown({ workers, selectedWorker, onWorkerSelect }) {
  const [workerSearchInput, setWorkerSearchInput] = useState("");
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const workerSearchRef = useRef(null);
  const selectedWorkerData = workers.find(w => w._id === selectedWorker);

  useEffect(() => {
    if (selectedWorkerData) {
      setWorkerSearchInput(`${selectedWorkerData.name} - ${selectedWorkerData.designation}`);
    } else {
      setWorkerSearchInput("");
    }
  }, [selectedWorker, selectedWorkerData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (workerSearchRef.current && !workerSearchRef.current.contains(event.target)) {
        setShowWorkerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFilteredWorkers = () => {
    if (!workerSearchInput.trim()) return workers;
    return workers.filter(worker =>
      worker.name.toLowerCase().includes(workerSearchInput.toLowerCase()) ||
      worker.designation.toLowerCase().includes(workerSearchInput.toLowerCase())
    );
  };

  const handleSelectWorker = (worker) => {
    onWorkerSelect(worker._id);
    setShowWorkerDropdown(false);
  };

  const filteredWorkers = getFilteredWorkers();

  return (
    <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3">
        <h2 className="text-lg font-bold text-white">Select Worker</h2>
        <p className="text-xs text-white/80 mt-1">Search by name or designation</p>
      </div>
      <div className="p-5" ref={workerSearchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Type worker name or designation to search..."
            value={workerSearchInput}
            onChange={(e) => {
              setWorkerSearchInput(e.target.value);
              setShowWorkerDropdown(true);
            }}
            onFocus={() => setShowWorkerDropdown(true)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          
          {/* Search Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
          
          {/* Dropdown with improved height and scrolling */}
          {showWorkerDropdown && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {filteredWorkers.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {filteredWorkers.map(worker => (
                    <div
                      key={worker._id}
                      onClick={() => handleSelectWorker(worker)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors duration-150"
                    >
                      <div className="font-medium text-gray-800 text-sm">{worker.name}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">{worker.designation}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          worker.status === "active" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {worker.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No workers found matching "{workerSearchInput}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Worker Display */}
        {selectedWorker && selectedWorkerData && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg flex justify-between items-center border border-blue-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <div>
                <span className="text-xs text-gray-600">Selected Worker:</span>
                <div className="font-semibold text-gray-800">{selectedWorkerData.name}</div>
                <div className="text-xs text-gray-500">{selectedWorkerData.designation}</div>
              </div>
            </div>
            <button
              onClick={() => {
                onWorkerSelect("");
                setWorkerSearchInput("");
              }}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
            >
              Change
            </button>
          </div>
        )}
        
        {/* Show worker count */}
        {!selectedWorker && workers.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {workers.length} workers available
          </div>
        )}
      </div>
    </div>
  );
}