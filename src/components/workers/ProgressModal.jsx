// src/components/workers/ProgressModal.jsx
import React from "react";

export default function ProgressModal({ show, progress }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80">
        <div className="text-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800">Uploading Photo</h3>
          <p className="text-sm text-gray-600 mt-1">Please wait...</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}