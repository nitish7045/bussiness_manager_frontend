import React from "react";

export default function WorkerInfoCard({ worker }) {
  if (!worker) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-5 py-3">
        <h2 className="text-lg font-bold text-white">Worker Information</h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-sm font-semibold text-gray-800">{worker.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Designation</p>
            <p className="text-sm font-semibold text-gray-800">{worker.designation}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-sm font-semibold">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                worker.status === "active" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {worker.status === "active" ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}