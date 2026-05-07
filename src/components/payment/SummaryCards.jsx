// src/components/payment/SummaryCards.jsx
import React from "react";

export default function SummaryCards({ totalReceived, totalBills, balance }) {
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
        <p className="text-xs text-green-600">Total Received</p>
        <p className="text-2xl font-bold text-green-700">₹{formatNumber(totalReceived)}</p>
      </div>
      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
        <p className="text-xs text-red-600">Total Bills</p>
        <p className="text-2xl font-bold text-red-700">₹{formatNumber(totalBills)}</p>
      </div>
      <div className={`bg-gradient-to-r rounded-xl p-4 border ${balance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
        <p className="text-xs text-gray-600">Balance</p>
        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
          ₹{formatNumber(Math.abs(balance))} {balance >= 0 ? '(Surplus)' : '(Shortfall)'}
        </p>
      </div>
    </div>
  );
}