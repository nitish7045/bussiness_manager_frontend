import React from "react";

export default function BillTypeSelector({ billType, setBillType, challanType, setChallanType }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Bill Type</label>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="normal"
            checked={billType === "normal"}
            onChange={(e) => setBillType(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-sm">Normal Bill</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="tax"
            checked={billType === "tax"}
            onChange={(e) => setBillType(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-sm">Tax Invoice (GST)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="corecutting"
            checked={billType === "corecutting"}
            onChange={(e) => setBillType(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-sm">Core Cutting</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="challan"
            checked={billType === "challan"}
            onChange={(e) => setBillType(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-sm">Challan</span>
        </label>
      </div>

      {/* Challan Type Sub-options */}
      {billType === "challan" && (
        <div className="mt-3 ml-6 p-3 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Challan Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="normal"
                checked={challanType === "normal"}
                onChange={(e) => setChallanType(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm">Normal Challan</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="tax"
                checked={challanType === "tax"}
                onChange={(e) => setChallanType(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm">GST Challan</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}