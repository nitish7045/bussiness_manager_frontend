// src/components/workers/WorkerExpandableRow.jsx
import React from "react";

export default function WorkerExpandableRow({ worker, extraFieldSuggestions }) {
  const formatAadhaar = (aadhaar) => {
    if (!aadhaar) return "Not provided";
    return aadhaar.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const hasExtraFields = worker.extraFields && Object.keys(worker.extraFields).length > 0;
  const hasBankDetails = worker.bank?.accountNumber || worker.bank?.ifsc;
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  return (
    <tr className="bg-gray-50 border-t border-gray-200">
      <td colSpan="9" className="px-4 py-3">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Worker Details - {worker.name}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <div>
              <h5 className="text-xs font-semibold text-blue-600 mb-2">Personal Information</h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium">{worker.experience || 0} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aadhaar Number:</span>
                  <span className="font-mono">{formatAadhaar(worker.aadhaar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee ID:</span>
                  <span className="font-mono text-xs">{worker._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Joined Date:</span>
                  <span>{new Date(worker.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {/* Bank Details */}
            <div>
              <h5 className="text-xs font-semibold text-green-600 mb-2">Bank Details</h5>
              <div className="space-y-1 text-xs">
                {hasBankDetails ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-mono">{worker.bank?.accountNumber || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IFSC Code:</span>
                      <span className="font-mono">{worker.bank?.ifsc || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">UPI ID:</span>
                      <span>{worker.upi?.id || "Not provided"}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400">No bank details available</p>
                )}
              </div>
            </div>
            
            {/* Salary Details */}
            <div>
              <h5 className="text-xs font-semibold text-orange-600 mb-2">Salary Details</h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Salary:</span>
                  <span className="font-semibold text-green-600">₹{formatNumber(worker.wages?.monthly)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Calculation Days:</span>
                  <span>{worker.wages?.calculationDays || 30} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Rate:</span>
                  <span>₹{formatNumber(worker.wages?.monthly / (worker.wages?.calculationDays || 30))}</span>
                </div>
              </div>
            </div>
            
            {/* Documents */}
            <div>
              <h5 className="text-xs font-semibold text-purple-600 mb-2">Documents</h5>
              <div className="space-y-2">
                {worker.aadhaarPhoto && (
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-500">Aadhaar Card:</span>
                    <button
                      onClick={() => window.open(worker.aadhaarPhoto, '_blank')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      📄 View Aadhaar
                    </button>
                  </div>
                )}
                {worker.profilePhoto && (
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-500">Profile Photo:</span>
                    <button
                      onClick={() => window.open(worker.profilePhoto, '_blank')}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    >
                      🖼️ View Photo
                    </button>
                  </div>
                )}
                {!worker.aadhaarPhoto && !worker.profilePhoto && (
                  <p className="text-gray-400 text-xs">No documents uploaded</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Extra Fields */}
          {hasExtraFields && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h5 className="text-xs font-semibold text-gray-600 mb-2">Additional Information</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(worker.extraFields).map(([key, value]) => {
                  const suggestion = extraFieldSuggestions.find(s => s.key === key);
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs font-semibold text-gray-600 capitalize">
                        {suggestion?.label || key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-gray-800 break-all">{value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr >
  );
}