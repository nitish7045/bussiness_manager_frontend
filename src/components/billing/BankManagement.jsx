import React, { useState, useEffect } from "react";
import { billingAPI } from "../../api/api";

export default function BankManagement() {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    accountHolderName: "",
    upiId: ""
  });

  // Fetch banks from database on component mount
  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await billingAPI.get("/billing/banks");
      setBanks(res.data);
    } catch (err) {
      console.error("Error fetching banks:", err);
      alert("Error fetching bank details");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branch: "",
      accountHolderName: "",
      upiId: ""
    });
    setEditingId(null);
    setSelectedBank(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.bankName || !formData.accountNumber || !formData.ifscCode || !formData.branch) {
      alert("Please fill all required fields");
      return;
    }

    // Validate IFSC code format (11 characters)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(formData.ifscCode.toUpperCase())) {
      alert("Please enter a valid IFSC code (e.g., HDFC0001234)");
      return;
    }

    setLoading(true);
    
    try {
      if (editingId) {
        // Update existing bank
        await billingAPI.put(`/billing/banks/${editingId}`, formData);
        alert("Bank updated successfully!");
      } else {
        // Add new bank
        await billingAPI.post("/billing/banks", formData);
        alert("Bank added successfully!");
      }
      
      resetForm();
      fetchBanks(); // Refresh the list
    } catch (err) {
      console.error("Error saving bank:", err);
      alert(err.response?.data?.msg || "Error saving bank");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bank) => {
    setEditingId(bank._id);
    setFormData({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      ifscCode: bank.ifscCode,
      branch: bank.branch,
      accountHolderName: bank.accountHolderName || "",
      upiId: bank.upiId || ""
    });
    setSelectedBank(bank);
    setShowForm(true);
  };

  const handleDelete = async (bank) => {
    if (window.confirm(`Delete bank "${bank.bankName}"? This action cannot be undone.`)) {
      setLoading(true);
      try {
        await billingAPI.delete(`/billing/banks/${bank._id}`);
        alert("Bank deleted successfully");
        fetchBanks();
        if (selectedBank?._id === bank._id) {
          resetForm();
        }
      } catch (err) {
        console.error("Error deleting bank:", err);
        alert(err.response?.data?.msg || "Error deleting bank");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatAccountNumber = (accNo) => {
    if (!accNo) return "";
    if (accNo.length > 8) {
      return "XXXX" + accNo.slice(-4);
    }
    return accNo;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">🏦 Bank Details Manager</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            ➕ Add Bank
          </button>
        )}
      </div>
      
      {/* Inline Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-semibold text-gray-700">
              {editingId ? "✏️ Edit Bank" : "➕ Add New Bank"}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Cancel
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., HDFC Bank, ICICI Bank"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter account number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 uppercase"
                  placeholder="e.g., HDFC0001234"
                />
                <p className="text-xs text-gray-400 mt-1">11 characters: First 4 letters, 5th is 0, last 6 alphanumeric</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter branch name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Name on the account"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., username@okhdfcbank"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : (editingId ? "Update Bank" : "Save Bank")}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Banks Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bank Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Account No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">IFSC Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Branch</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && banks.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading banks...</p>
                </td>
                </tr>
            ) : banks.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No banks found. Click "Add Bank" to add your first bank.
                  </td>
                </tr>
            ) : (
              banks.map((bank, index) => (
                <tr 
                  key={bank._id} 
                  className={`border-t hover:bg-gray-50 cursor-pointer ${
                    selectedBank?._id === bank._id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedBank(bank)}
                >
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {bank.bankName}
                    {bank.accountHolderName && (
                      <div className="text-xs text-gray-500">{bank.accountHolderName}</div>
                    )}
                   </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatAccountNumber(bank.accountNumber)}
                    {bank.upiId && <div className="text-xs text-gray-400">{bank.upiId}</div>}
                   </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {bank.ifscCode}
                   </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {bank.branch}
                   </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(bank);
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(bank);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      🗑️
                    </button>
                    </td>
                  </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Selected Bank Details */}
      {selectedBank && !showForm && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Selected Bank Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Bank Name:</span>
                  <span className="ml-2 font-medium">{selectedBank.bankName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Account Number:</span>
                  <span className="ml-2 font-mono">{selectedBank.accountNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Account Holder:</span>
                  <span className="ml-2">{selectedBank.accountHolderName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-600">IFSC Code:</span>
                  <span className="ml-2 font-mono">{selectedBank.ifscCode}</span>
                </div>
                <div>
                  <span className="text-gray-600">Branch:</span>
                  <span className="ml-2">{selectedBank.branch}</span>
                </div>
                <div>
                  <span className="text-gray-600">UPI ID:</span>
                  <span className="ml-2">{selectedBank.upiId || "N/A"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedBank(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}