// src/components/payment/PaymentHeader.jsx
import React from "react";

export default function PaymentHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-800">Payment Management</h1>
      <p className="text-sm text-gray-500 mt-1">Manage received payments and bills</p>
    </div>
  );
}