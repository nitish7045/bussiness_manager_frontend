import React from "react";

export default function AdvanceHeader({ onViewAllWorkers }) {
  return (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Advance Management</h1>
        <p className="text-sm text-gray-600 mt-1">Manage monthly advances and loans for workers</p>
      </div>
      <button
        onClick={onViewAllWorkers}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md flex items-center gap-2 text-sm"
      >
        <span className="text-lg">👥</span>
        View All Workers
      </button>
    </div>
  );
}