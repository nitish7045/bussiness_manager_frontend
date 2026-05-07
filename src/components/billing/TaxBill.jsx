import React, { useState } from "react";
import { billingAPI } from "../../api/api";

export default function TaxBill({ company, onBack }) {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerGST: "",
    date: new Date().toISOString().split('T')[0],
    itemName: "",
    quantity: 1,
    unit: "NOS",
    rate: 0,
    gstRate: 18
  });
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    if (!formData.itemName || formData.quantity <= 0 || formData.rate <= 0) {
      alert("Please fill item name, quantity and rate");
      return;
    }

    const amount = formData.quantity * formData.rate;
    const gstAmount = (amount * formData.gstRate) / 100;
    const totalAmount = amount + gstAmount;

    setItems([...items, {
      name: formData.itemName,
      quantity: formData.quantity,
      unit: formData.unit,
      rate: formData.rate,
      gstRate: formData.gstRate,
      amount: amount,
      gstAmount: gstAmount,
      total: totalAmount
    }]);

    setFormData({
      ...formData,
      itemName: "",
      quantity: 1,
      rate: 0
    });
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTotalGST = () => {
    return items.reduce((sum, item) => sum + item.gstAmount, 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  const saveBill = async () => {
    if (!formData.customerName) {
      alert("Please enter customer name");
      return;
    }
    if (items.length === 0) {
      alert("Please add items to the bill");
      return;
    }

    setLoading(true);
    try {
      const billData = {
        companyId: company._id,
        companyGST: company.gstNo,
        customerName: formData.customerName,
        customerGST: formData.customerGST,
        date: formData.date,
        items: items,
        subtotal: calculateSubtotal(),
        totalGST: calculateTotalGST(),
        total: calculateTotal(),
        billType: "tax"
      };

      await billingAPI.post("/billing/bills/tax", billData);
      alert("Tax Invoice saved successfully!");
      
      setItems([]);
      setFormData({
        ...formData,
        customerName: "",
        customerGST: "",
        itemName: "",
        quantity: 1,
        rate: 0
      });
    } catch (err) {
      console.error("Error saving bill:", err);
      alert("Error saving bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">📄 Tax Invoice (GST)</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
      </div>

      {/* Company Info */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <p className="text-sm"><strong>Company:</strong> {company.name}</p>
        <p className="text-sm"><strong>GST:</strong> {company.gstNo}</p>
      </div>

      {/* Bill Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-2"
            placeholder="Enter customer name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer GST (Optional)</label>
          <input
            type="text"
            value={formData.customerGST}
            onChange={(e) => setFormData({...formData, customerGST: e.target.value.toUpperCase()})}
            className="w-full border border-gray-300 rounded-lg p-2 uppercase"
            placeholder="Enter customer GST"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
      </div>

      {/* Add Item Form */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">Add Item</h3>
        <div className="grid grid-cols-6 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              placeholder="Item Name"
              value={formData.itemName}
              onChange={(e) => setFormData({...formData, itemName: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Qty"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="NOS">NOS</option>
              <option value="MTR">MTR</option>
              <option value="KG">KG</option>
              <option value="LTR">LTR</option>
            </select>
          </div>
          <div>
            <input
              type="number"
              placeholder="Rate"
              value={formData.rate}
              onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value) || 0})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <select
              value={formData.gstRate}
              onChange={(e) => setFormData({...formData, gstRate: parseInt(e.target.value)})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="0">0% GST</option>
              <option value="5">5% GST</option>
              <option value="12">12% GST</option>
              <option value="18">18% GST</option>
              <option value="28">28% GST</option>
            </select>
          </div>
          <button
            onClick={addItem}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-center">Unit</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-center">GST%</th>
              <th className="px-3 py-2 text-right">GST Amt</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  No items added
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-center">{item.quantity}</td>
                  <td className="px-3 py-2 text-center">{item.unit}</td>
                  <td className="px-3 py-2 text-right">₹{formatNumber(item.rate)}</td>
                  <td className="px-3 py-2 text-right">₹{formatNumber(item.amount)}</td>
                  <td className="px-3 py-2 text-center">{item.gstRate}%</td>
                  <td className="px-3 py-2 text-right">₹{formatNumber(item.gstAmount)}</td>
                  <td className="px-3 py-2 text-right">₹{formatNumber(item.total)}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="4" className="px-3 py-2 text-right font-bold">Subtotal:</td>
              <td className="px-3 py-2 text-right font-bold">₹{formatNumber(calculateSubtotal())}</td>
              <td></td>
              <td className="px-3 py-2 text-right font-bold">GST Total:</td>
              <td className="px-3 py-2 text-right font-bold text-orange-600">₹{formatNumber(calculateTotalGST())}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan="7" className="px-3 py-2 text-right font-bold text-lg">Grand Total:</td>
              <td className="px-3 py-2 text-right font-bold text-blue-600 text-lg">
                ₹{formatNumber(calculateTotal())}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Save Button */}
      <button
        onClick={saveBill}
        disabled={loading || items.length === 0}
        className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "💾 Save Tax Invoice"}
      </button>
    </div>
  );
}