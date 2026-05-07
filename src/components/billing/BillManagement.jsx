import React, { useState, useEffect } from "react";
import { billingAPI } from "../../api/api";

export default function BillManagement() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await billingAPI.get("/billing/invoices");
      setInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">🧾 Bill Management</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Invoice #</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8">No invoices found</td></tr>
            ) : (
              invoices.map(invoice => (
                <tr key={invoice._id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{invoice.invoiceNumber}</td>
                  <td className="px-3 py-2">{invoice.customerName}</td>
                  <td className="px-3 py-2">{formatDate(invoice.invoiceDate)}</td>
                  <td className="px-3 py-2 text-right">₹{formatNumber(invoice.totalAmount)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      invoice.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                      invoice.paymentStatus === "partial" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button className="text-blue-600 hover:text-blue-800">👁️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}