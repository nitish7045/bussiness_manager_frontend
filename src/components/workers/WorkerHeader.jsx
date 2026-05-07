// src/components/workers/WorkerHeader.jsx
import React from "react";

export default function WorkerHeader({ showForm, onToggleForm, onResetForm, onScrollToForm }) {
  const handleClick = () => {
    onResetForm();
    onToggleForm(!showForm);
    if (!showForm) {
      onScrollToForm();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Workers Management</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your workforce details</p>
      </div>
      <button
        onClick={handleClick}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md flex items-center gap-2 text-sm"
      >
        <span className="text-xl">{showForm ? "✕" : "+"}</span>
        {showForm ? "Close Form" : "Add New Worker"}
      </button>
    </div>
  );
}