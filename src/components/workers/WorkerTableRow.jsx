// src/components/workers/WorkerTableRow.jsx
import React from "react";

export default function WorkerTableRow({ 
  worker, 
  index, 
  isExpanded, 
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
  extraFieldSuggestions
}) {
  const formatAadhaar = (aadhaar) => {
    if (!aadhaar) return "Not provided";
    return aadhaar.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const hasExtraFields = worker.extraFields && Object.keys(worker.extraFields).length > 0;
  const hasBankDetails = worker.bank?.accountNumber || worker.bank?.ifsc;
  const hasUPI = worker.upi?.id;
  const hasAadhaar = worker.aadhaar;

  return (
    <React.Fragment>
      <tr className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
        <td className="px-4 py-3">
          <div className="relative group">
            <div 
              onClick={() => worker.profilePhoto && onViewPhoto(worker.profilePhoto, "profile")}
              className="cursor-pointer"
            >
              {worker.profilePhoto ? (
                <img
                  src={worker.profilePhoto}
                  alt={worker.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 hover:border-blue-500 transition-all"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white text-lg font-bold">
                  {worker.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onUploadPhoto(worker._id, "profile")}
                disabled={uploadingPhoto}
                className="bg-blue-500 text-white rounded-full p-1 text-xs hover:bg-blue-600 disabled:opacity-50"
                title="Upload/Change Photo"
              >
                📷
              </button>
              {worker.profilePhoto && (
                <button
                  onClick={() => onDeletePhoto(worker._id, "profile")}
                  className="bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                  title="Delete Photo"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="font-semibold text-gray-800 text-sm">{worker.name}</div>
          {worker.experience > 0 && (
            <div className="text-xs text-gray-500">Exp: {worker.experience} yrs</div>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 rounded-full text-xs ${
            worker.designation === 'Carpenter' ? 'bg-orange-100 text-orange-800' :
            worker.designation === 'Electrician' ? 'bg-yellow-100 text-yellow-800' :
            worker.designation === 'Plumber' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {worker.designation}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="font-semibold text-green-600 text-sm">₹{worker.wages?.monthly}</div>
          <div className="text-xs text-gray-500">/{worker.wages?.calculationDays || 30}d</div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium">{worker.phone}</div>
          {hasUPI && (
            <div className="text-xs text-gray-600 mt-1 break-all">
              <span className="font-semibold">UPI:</span> {worker.upi.id}
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          {hasBankDetails ? (
            <div className="space-y-1">
              {worker.bank?.accountNumber && (
                <div className="text-xs">
                  <span className="font-semibold">Acc:</span> {worker.bank.accountNumber}
                </div>
              )}
              {worker.bank?.ifsc && (
                <div className="text-xs">
                  <span className="font-semibold">IFSC:</span> {worker.bank.ifsc}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">Not provided</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-2">
            {hasAadhaar && (
              <div className="text-xs font-mono">
                {formatAadhaar(worker.aadhaar)}
              </div>
            )}
            <div className="flex gap-1">
              {worker.aadhaarPhoto ? (
                <button
                  onClick={() => onViewAadhaar(worker.aadhaarPhoto)}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  View Aadhaar
                </button>
              ) : (
                <button
                  onClick={() => onUploadAadhaar(worker._id)}
                  disabled={uploadingPhoto}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Upload Aadhaar
                </button>
              )}
              {worker.aadhaarPhoto && (
                <button
                  onClick={() => onDeleteAadhaar(worker._id)}
                  className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            worker.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {worker.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => onEdit(worker)}
              className="bg-blue-500 text-white px-2.5 py-1 rounded hover:bg-blue-600 transition-colors text-xs"
            >
              Edit
            </button>
            {worker.status === 'active' ? (
              <button
                onClick={() => onDeactivate(worker._id, worker.name)}
                className="bg-yellow-500 text-white px-2.5 py-1 rounded hover:bg-yellow-600 transition-colors text-xs"
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => onReactivate(worker._id, worker.name)}
                className="bg-green-500 text-white px-2.5 py-1 rounded hover:bg-green-600 transition-colors text-xs"
              >
                Reactivate
              </button>
            )}
            <button
              onClick={() => onDelete(worker._id, worker.name)}
              className="bg-red-500 text-white px-2.5 py-1 rounded hover:bg-red-600 transition-colors text-xs"
            >
              Delete
            </button>
            {hasExtraFields && (
              <button
                onClick={() => onToggleExpand(worker._id)}
                className="bg-gray-500 text-white px-2.5 py-1 rounded hover:bg-gray-600 transition-colors text-xs flex items-center gap-1"
              >
                <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                {isExpanded ? 'Hide' : 'More'}
              </button>
            )}
          </div>
        </td>
      </tr>
    </React.Fragment>
  );
}