import React from "react";
import AllWorkersTableRow from "./AllWorkersTableRow";
import ErrorBoundary from "../ErrorBoundary";

export default function AllWorkersTable({ workers, loading, onWorkerSelect }) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading workers...</p>
      </div>
    );
  }

  if (!workers || workers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No workers found matching the filters
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Worker</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Designation</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Monthly Advance</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Loan</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total Due</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((worker, idx) => (
            <ErrorBoundary key={worker?.workerId || idx}>
              <AllWorkersTableRow
                worker={worker}
                idx={idx}
                onWorkerSelect={onWorkerSelect}
              />
            </ErrorBoundary>
          ))}
        </tbody>
      </table>
    </div>
  );
}