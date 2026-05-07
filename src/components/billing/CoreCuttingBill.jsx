// CoreCuttingBill.jsx
import React, { useState } from "react";
import { billingAPI } from "../../api/api";

export default function CoreCuttingBill({ company, onBack }) {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    customerName: "",
    date: new Date().toISOString().split('T')[0],
    diameter: "",
    depth: "",
    quantity: 1,
    rate: 0
  });
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    if (!formData.diameter || formData.quantity <= 0 || formData.rate <= 0) {
      alert("Please fill diameter, quantity and rate");
      return;
    }

    const amount = formData.quantity * formData.rate;
    setItems([...items, {
      diameter: formData.diameter,
      depth: formData.depth || "-",
      quantity: formData.quantity,
      rate: formData.rate,
      amount: amount
    }]);

    setFormData({
      ...formData,
      diameter: "",
      depth: "",
      quantity: 1,
      rate: 0
    });
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
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
        customerName: formData.customerName,
        date: formData.date,
        items: items,
        total: calculateTotal(),
        billType: "corecutting"
      };

      await billingAPI.post("/billing/bills/corecutting", billData);
      alert("Core Cutting Bill saved successfully!");
      
      setItems([]);
      setFormData({
        ...formData,
        customerName: "",
        diameter: "",
        depth: "",
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
        <h2 className="text-xl font-bold text-gray-800">🔨 Core Cutting Bill</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <p className="text-sm"><strong>Company:</strong> {company.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-2"
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

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">Add Core Cutting Item</h3>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <input
              type="text"
              placeholder="Diameter (inch)"
              value={formData.diameter}
              onChange={(e) => setFormData({...formData, diameter: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Depth (mm)"
              value={formData.depth}
              onChange={(e) => setFormData({...formData, depth: e.target.value})}
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
            <input
              type="number"
              placeholder="Rate"
              value={formData.rate}
              onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value) || 0})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <button
            onClick={addItem}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Diameter</th>
              <th className="px-3 py-2 text-left">Depth</th>
              <th className="px-3 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">No items added</td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{item.diameter}"</td>
                  <td className="px-3 py-2">{item.depth} mm</td>
                  <td className="px-3 py-2 text-center">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">₹{formatNumber(item.rate)}</td>
                  <td className="px-3 py-2 text-right">₹{formatNumber(item.amount)}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="4" className="px-3 py-2 text-right font-bold">Total:</td>
              <td className="px-3 py-2 text-right font-bold text-blue-600">₹{formatNumber(calculateTotal())}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        onClick={saveBill}
        disabled={loading || items.length === 0}
        className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "💾 Save Core Cutting Bill"}
      </button>
    </div>
  );
}