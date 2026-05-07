// src/components/workers/StatsCards.jsx
import React from "react";

export default function StatsCards({ workers, activeWorkers, inactiveWorkers }) {
  const avgSalary = workers.length > 0 
    ? Math.round(workers.reduce((sum, w) => sum + (w.wages?.monthly || 0), 0) / workers.length) 
    : 0;

  return (
    <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white rounded-lg shadow p-3">
        <div className="text-gray-500 text-xs">Total Workers</div>
        <div className="text-xl font-bold text-gray-800">{workers.length}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-3">
        <div className="text-gray-500 text-xs">Active Workers</div>
        <div className="text-xl font-bold text-green-600">{activeWorkers.length}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-3">
        <div className="text-gray-500 text-xs">Inactive Workers</div>
        <div className="text-xl font-bold text-red-600">{inactiveWorkers.length}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-3">
        <div className="text-gray-500 text-xs">Average Salary</div>
        <div className="text-xl font-bold text-blue-600">₹{avgSalary}</div>
      </div>
    </div>
  );
}