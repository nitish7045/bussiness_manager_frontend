// ChallanBill.jsx
import React, { useState } from "react";
import { billingAPI } from "../../api/api";

export default function ChallanBill({ company, onBack }) {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    customerName: "",
    date: new Date().toISOString().split('T')[0],
    itemName: "",
    quantity: 1,
    unit: "NOS"
  });
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    if (!formData.itemName || formData.quantity <= 0) {
      alert("Please fill item name and quantity");
      return;
    }

    setItems([...items, {
      name: formData.itemName,
      quantity: formData.quantity,
      unit: formData.unit
    }]);

    setFormData({
      ...formData,
      itemName: "",
      quantity: 1
    });
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const saveBill = async () => {
    if (!formData.customerName) {
      alert("Please enter customer name");
      return;
    }
    if (items.length === 0) {
      alert("Please add items to the challan");
      return;
    }

    setLoading(true);
    try {
      const billData = {
        companyId: company._id,
        customerName: formData.customerName,
        date: formData.date,
        items: items,
        billType: "challan"
      };

      await billingAPI.post("/billing/bills/challan", billData);
      alert("Challan saved successfully!");
      
      setItems([]);
      setFormData({
        ...formData,
        customerName: "",
        itemName: "",
        quantity: 1
      });
    } catch (err) {
      console.error("Error saving challan:", err);
      alert("Error saving challan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">📋 Challan</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← Back</button>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <p className="text-sm"><strong>Company:</strong> {company.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
          <input type="text" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">Add Item</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <input type="text" placeholder="Item Name" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
          </div>
          <div>
            <input type="number" placeholder="Qty" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
          </div>
          <div>
            <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm">
              <option value="NOS">NOS</option><option value="MTR">MTR</option><option value="KG">KG</option><option value="LTR">LTR</option>
            </select>
          </div>
          <button onClick={addItem} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">Add</button>
        </div>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-center">Qty</th><th className="px-3 py-2 text-center">Unit</th><th className="px-3 py-2 text-center"></th></tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan="4" className="text-center py-4 text-gray-500">No items added</td></tr> :
              items.map((item, idx) => (
                <tr key={idx} className="border-t"><td className="px-3 py-2">{item.name}</td><td className="px-3 py-2 text-center">{item.quantity}</td><td className="px-3 py-2 text-center">{item.unit}</td><td className="px-3 py-2 text-center"><button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800">🗑️</button></td></tr>
              ))}
          </tbody>
        </table>
      </div>

      <button onClick={saveBill} disabled={loading || items.length === 0} className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
        {loading ? "Saving..." : "💾 Save Challan"}
      </button>
    </div>
  );
}