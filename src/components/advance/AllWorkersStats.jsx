import React from "react";

export default function AllWorkersStats({ stats }) {
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500">Total Workers</div>
          <div className="text-lg font-bold text-gray-800">{stats.totalWorkers}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500">Active Workers</div>
          <div className="text-lg font-bold text-green-600">{stats.activeWorkers}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500">Inactive Workers</div>
          <div className="text-lg font-bold text-red-600">{stats.inactiveWorkers}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500">Workers with Advances</div>
          <div className="text-lg font-bold text-orange-600">{stats.withAdvances}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500">Total Due Amount</div>
          <div className="text-lg font-bold text-blue-600">₹{formatNumber(stats.totalDue)}</div>
        </div>
      </div>
    </div>
  );
}