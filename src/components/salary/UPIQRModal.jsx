// src/components/salary/UPIQRModal.jsx
import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function UPIQRModal({ worker, amount, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("upi"); // upi or cash
  const [cashNotes, setCashNotes] = useState("");

  const generateUPIString = () => {
    const upiId = worker.upi?.id;
    if (!upiId) return null;
    
    const params = new URLSearchParams({
      pa: upiId,
      pn: worker.name,
      am: amount,
      cu: "INR",
      tn: `Salary payment for ${worker.name}`
    });
    
    return `upi://pay?${params.toString()}`;
  };

  // In the handleCashPayment and UPI payment success, update the onSuccess call:
const handleCashPayment = () => {
  if (!cashNotes.trim()) {
    alert("Please enter payment notes (e.g., Cash received, Cheque no., etc.)");
    return;
  }
  
  if (window.confirm(`Mark payment as PAID with notes: "${cashNotes}"?`)) {
    onSuccess("cash", cashNotes); // Pass method and notes
  }
};

// For UPI payment:
<button
  onClick={() => {
    if (window.confirm("Have you received the UPI payment? Click OK to mark as paid.")) {
      onSuccess("upi", "UPI Payment received");
    }
  }}
  className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition"
>
  ✓ Mark as Paid (UPI)
</button>

  const upiString = generateUPIString();
  const hasUPI = !!worker.upi?.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-t-lg flex justify-between items-center">
          <h2 className="text-sm font-semibold text-white">
            Payment for {worker.name}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Worker:</span>
              <span className="font-medium text-gray-800">{worker.name}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-green-600 text-lg">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Date:</span>
              <span className="text-gray-700">{new Date().toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setPaymentMethod("upi")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                paymentMethod === "upi"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📱 UPI Payment
            </button>
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                paymentMethod === "cash"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              💰 Cash / Other
            </button>
          </div>

          {/* UPI Payment Section */}
          {paymentMethod === "upi" && (
            <>
              {hasUPI ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">UPI ID:</span>
                      <span className="font-mono text-xs text-gray-700">{worker.upi?.id}</span>
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                      <QRCodeSVG
                        value={upiString}
                        size={200}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"L"}
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-center text-gray-500 mb-4">
                    Scan this QR code with Google Pay, PhonePe, or any UPI app to pay
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    <a
                      href={`upi://pay?pa=${worker.upi?.id}&pn=${worker.name}&am=${amount}&cu=INR`}
                      className="text-center bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 transition"
                    >
                      📱 Open UPI App
                    </a>
                    <button
                      onClick={() => {
                        if (window.confirm("Have you received the UPI payment? Click OK to mark as paid.")) {
                          onSuccess("UPI Payment");
                        }
                      }}
                      className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition"
                    >
                      ✓ Mark as Paid (UPI)
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-red-500 text-5xl mb-3">⚠️</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No UPI ID Found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {worker.name} does not have a UPI ID configured.
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Please use Cash/Other payment method or add UPI ID in worker profile.
                  </p>
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Switch to Cash Payment
                  </button>
                </div>
              )}
            </>
          )}

          {/* Cash / Other Payment Section */}
          {paymentMethod === "cash" && (
            <div className="space-y-4">
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-600 text-lg">💡</span>
                  <span className="text-xs font-medium text-yellow-800">Payment Instructions</span>
                </div>
                <p className="text-xs text-yellow-700">
                  Please enter payment details below before marking as paid. This will be recorded in the transaction history.
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Enter payment details (e.g., Cash received, Cheque No: 123456, Bank Transfer, etc.)"
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-2">Example Notes:</div>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Cash received from worker</li>
                  <li>• Cheque No: 123456, Bank: SBI</li>
                  <li>• Bank Transfer - UTR: ABC123XYZ</li>
                  <li>• Paid via PhonePe - Transaction ID: 987654321</li>
                </ul>
              </div>
              
              <button
                onClick={handleCashPayment}
                className="w-full bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition"
              >
                ✓ Mark as Paid (Cash/Other)
              </button>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full mt-4 bg-gray-500 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}