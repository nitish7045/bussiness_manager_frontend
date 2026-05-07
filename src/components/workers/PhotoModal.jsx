// src/components/workers/PhotoModal.jsx
import React from "react";

export default function PhotoModal({ show, photoUrl, photoType, onClose }) {
  if (!show || !photoUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 z-10"
        >
          ✕
        </button>
        <img
          src={photoUrl}
          alt={photoType === "profile" ? "Profile Photo" : "Aadhaar Photo"}
          className="max-w-full max-h-[85vh] object-contain"
        />
        <div className="p-3 bg-gray-100 text-center text-sm font-medium text-gray-700">
          {photoType === "profile" ? "Profile Photo" : "Aadhaar Card Photo"}
        </div>
      </div>
    </div>
  );
}