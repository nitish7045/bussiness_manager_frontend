// src/components/workers/WorkerTable.jsx
import React from "react";
import WorkerTableRow from "./WorkerTableRow";
import WorkerExpandableRow from "./WorkerExpandableRow";

export default function WorkerTable({ 
  workers, 
  expandedRows, 
  onToggleExpand,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
  onViewPhoto,
  onUploadPhoto,
  onDeletePhoto,
  onViewAadhaar,
  onUploadAadhaar,
  onDeleteAadhaar,
  uploadingPhoto,
  extraFieldSuggestions,
  loading 
}) {
  if (loading && workers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="text-center py-8 text-gray-500 text-sm">
          No workers found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-white text-sm font-semibold">Photo</th>
              <th className="px-4 py-3 text-left text-white text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-white text-sm font-semibold">Designation</th>
              <th className="px-4 py-3 text-left text-white text-sm font-semibold">Salary</th>
              <th className="px-4 py-3 text-left text-white text-sm font-semibold">Contact</th>
              <th className="px-4 py-3 text-left text-white text-sm font-semibold">Bank Details</th>
              <th className="px-4 py-3 text-left text-white text-sm font-semibold">Aadhaar</th>
              <th className="px-4 py-3 text-left text-white text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-white text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker, index) => {
              const isExpanded = expandedRows[worker._id];
              return (
                <React.Fragment key={worker._id}>
                  <WorkerTableRow
                    worker={worker}
                    index={index}
                    isExpanded={isExpanded}
                    onToggleExpand={onToggleExpand}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                    onReactivate={onReactivate}
                    onDelete={onDelete}
                    onViewPhoto={onViewPhoto}
                    onUploadPhoto={onUploadPhoto}
                    onDeletePhoto={onDeletePhoto}
                    onViewAadhaar={onViewAadhaar}
                    onUploadAadhaar={onUploadAadhaar}
                    onDeleteAadhaar={onDeleteAadhaar}
                    uploadingPhoto={uploadingPhoto}
                    extraFieldSuggestions={extraFieldSuggestions}
                  />
                  {isExpanded && (
                    <WorkerExpandableRow
                      worker={worker}
                      extraFieldSuggestions={extraFieldSuggestions}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}