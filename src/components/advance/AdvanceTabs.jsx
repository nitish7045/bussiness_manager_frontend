import React from "react";

export default function AdvanceTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "monthly", label: "Monthly Advance" },
    { id: "loan", label: "Loan" },
    { id: "history", label: "Transaction History" }
  ];

  return (
    <div className="mb-6">
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}