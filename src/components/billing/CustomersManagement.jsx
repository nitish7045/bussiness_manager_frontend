import React, { useState, useEffect, useRef } from "react";
import { billingAPI } from "../../api/api";

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [deletedCustomers, setDeletedCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [formData, setFormData] = useState({
    toAddress: "",
    site: ""
  });

  // Refs for scrolling
  const formRef = useRef(null);
  const tableRef = useRef(null);

  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
    fetchDeletedCustomers();
  }, []);

  // Filter customers when search term or view changes
  useEffect(() => {
    const customersToFilter = showDeleted ? deletedCustomers : customers;
    if (searchTerm.trim() === "") {
      setFilteredCustomers(customersToFilter);
    } else {
      const filtered = customersToFilter.filter(customer =>
        customer.toAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.site?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
    // Reset selection when filter changes
    setSelectedRows([]);
    setSelectAll(false);
  }, [searchTerm, customers, deletedCustomers, showDeleted]);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedRows(filteredCustomers.map(c => c._id));
    } else {
      setSelectedRows([]);
    }
  }, [selectAll, filteredCustomers]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingAPI.get("/billing/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(err.response?.data?.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedCustomers = async () => {
    try {
      const res = await billingAPI.get("/billing/customers/deleted");
      setDeletedCustomers(res.data);
    } catch (err) {
      console.error("Error fetching deleted customers:", err);
      setDeletedCustomers([]);
    }
  };

  const resetForm = () => {
    setFormData({
      toAddress: "",
      site: ""
    });
    setIsEditing(false);
    setSelectedCustomer(null);
    setSelectedId(null);
    setShowForm(false);
    setError(null);
  };

  const scrollToForm = () => {
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.toAddress.trim() && !formData.site.trim()) {
      setError("Please enter either 'To Address' or 'Site'");
      return;
    }

    setLoading(true);
    
    try {
      if (isEditing && selectedId) {
        const response = await billingAPI.put(`/billing/customers/${selectedId}`, {
          toAddress: formData.toAddress.trim(),
          site: formData.site.trim()
        });
        setSuccessMsg(response.data.message || "Customer updated successfully!");
      } else {
        const response = await billingAPI.post("/billing/customers", {
          toAddress: formData.toAddress.trim(),
          site: formData.site.trim()
        });
        setSuccessMsg(response.data.message || "Customer added successfully!");
        if (response.data.customer?.customerCode) {
          setSuccessMsg(`Customer added! Code: ${response.data.customer.customerCode}`);
        }
      }
      
      resetForm();
      await fetchCustomers();
      await fetchDeletedCustomers();
    } catch (err) {
      console.error("Error saving customer:", err);
      setError(err.response?.data?.message || "Error saving customer");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setSelectedId(customer._id);
    setFormData({
      toAddress: customer.toAddress || "",
      site: customer.site || ""
    });
    setIsEditing(true);
    setShowForm(true);
    setError(null);
    scrollToForm();
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    setError(null);
    scrollToForm();
  };

  const handleRowSelect = (customerId) => {
    setSelectedRows(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSoftDelete = async (customer, e) => {
    e.stopPropagation();
    if (window.confirm(`Move "${customer.site || customer.customerCode}" to trash?`)) {
      setLoading(true);
      setError(null);
      try {
        await billingAPI.delete(`/billing/customers/${customer._id}`);
        setSuccessMsg("Customer moved to trash.");
        await fetchCustomers();
        await fetchDeletedCustomers();
        if (selectedId === customer._id) {
          resetForm();
        }
      } catch (err) {
        console.error("Error deleting customer:", err);
        setError(err.response?.data?.message || "Error deleting customer");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkSoftDelete = async () => {
    if (selectedRows.length === 0) {
      setError("Please select at least one customer");
      return;
    }
    
    if (window.confirm(`Move ${selectedRows.length} customer(s) to trash?`)) {
      setLoading(true);
      setError(null);
      let successCount = 0;
      
      for (const id of selectedRows) {
        try {
          await billingAPI.delete(`/billing/customers/${id}`);
          successCount++;
        } catch (err) {
          console.error("Error deleting customer:", id, err);
        }
      }
      
      setSuccessMsg(`${successCount} customer(s) moved to trash.`);
      await fetchCustomers();
      await fetchDeletedCustomers();
      setSelectedRows([]);
      setSelectAll(false);
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (customer, e) => {
    e.stopPropagation();
    if (window.confirm(`PERMANENTLY DELETE "${customer.site || customer.customerCode}"? This action cannot be undone!`)) {
      setLoading(true);
      setError(null);
      try {
        await billingAPI.delete(`/billing/customers/${customer._id}/permanent`);
        setSuccessMsg("Customer permanently deleted.");
        await fetchCustomers();
        await fetchDeletedCustomers();
        if (selectedId === customer._id) {
          resetForm();
        }
      } catch (err) {
        console.error("Error permanently deleting customer:", err);
        setError(err.response?.data?.message || "Error permanently deleting customer");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedRows.length === 0) {
      setError("Please select at least one customer");
      return;
    }
    
    if (window.confirm(`PERMANENTLY DELETE ${selectedRows.length} customer(s)? This action cannot be undone!`)) {
      setLoading(true);
      setError(null);
      let successCount = 0;
      
      for (const id of selectedRows) {
        try {
          await billingAPI.delete(`/billing/customers/${id}/permanent`);
          successCount++;
        } catch (err) {
          console.error("Error permanently deleting customer:", id, err);
        }
      }
      
      setSuccessMsg(`${successCount} customer(s) permanently deleted.`);
      await fetchCustomers();
      await fetchDeletedCustomers();
      setSelectedRows([]);
      setSelectAll(false);
      setLoading(false);
    }
  };

  const handleRecoverCustomer = async (customer, e) => {
    e.stopPropagation();
    if (window.confirm(`Recover "${customer.site || customer.customerCode}"?`)) {
      setLoading(true);
      setError(null);
      try {
        await billingAPI.post(`/billing/customers/${customer._id}/recover`);
        setSuccessMsg("Customer recovered successfully.");
        await fetchCustomers();
        await fetchDeletedCustomers();
      } catch (err) {
        console.error("Error recovering customer:", err);
        setError(err.response?.data?.message || "Error recovering customer");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkRecover = async () => {
    if (selectedRows.length === 0) {
      setError("Please select at least one customer");
      return;
    }
    
    if (window.confirm(`Recover ${selectedRows.length} customer(s)?`)) {
      setLoading(true);
      setError(null);
      let successCount = 0;
      
      for (const id of selectedRows) {
        try {
          await billingAPI.post(`/billing/customers/${id}/recover`);
          successCount++;
        } catch (err) {
          console.error("Error recovering customer:", id, err);
        }
      }
      
      setSuccessMsg(`${successCount} customer(s) recovered.`);
      await fetchCustomers();
      await fetchDeletedCustomers();
      setSelectedRows([]);
      setSelectAll(false);
      setLoading(false);
    }
  };

  const clearFields = () => {
    resetForm();
  };

  const toggleShowDeleted = () => {
    setShowDeleted(!showDeleted);
    setSearchTerm("");
    setSelectedCustomer(null);
    setSelectedRows([]);
    setSelectAll(false);
  };

  // Wrap text for table display
  const wrapText = (text, maxChars = 50) => {
    if (!text) return "";
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines.map((line, idx) => <div key={idx} className="text-sm">{line}</div>);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2">
        <h2 className="text-xl font-bold text-gray-800">👥 Customers Management</h2>
        {!showForm && !showDeleted && (
          <button
            onClick={handleAddNew}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            ➕ Add Customer
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-16 bg-white z-10 pb-2">
        <div className="mb-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 Search by name, address or site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 pl-8 focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <button
              onClick={fetchCustomers}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              Refresh
            </button>
            <button
              onClick={toggleShowDeleted}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                showDeleted 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "bg-gray-500 text-white hover:bg-gray-600"
              }`}
            >
              🗑️ {showDeleted ? "Hide Deleted" : "Show Deleted"}
              {deletedCustomers.length > 0 && !showDeleted && (
                <span className="ml-1 bg-red-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {deletedCustomers.length}
                </span>
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Showing {filteredCustomers.length} of {(showDeleted ? deletedCustomers.length : customers.length)} customers
            {showDeleted && <span className="ml-2 text-orange-600">(Showing deleted customers)</span>}
          </div>
        </div>
      </div>

      {/* Bulk Action Buttons */}
      {filteredCustomers.length > 0 && (
        <div className="mb-4 flex gap-2">
          {!showDeleted ? (
            <button
              onClick={handleBulkSoftDelete}
              disabled={selectedRows.length === 0 || loading}
              className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
            >
              🗑️ Move to Trash ({selectedRows.length})
            </button>
          ) : (
            <>
              <button
                onClick={handleBulkRecover}
                disabled={selectedRows.length === 0 || loading}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                ↩️ Recover ({selectedRows.length})
              </button>
              <button
                onClick={handleBulkPermanentDelete}
                disabled={selectedRows.length === 0 || loading}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
              >
                💀 Permanently Delete ({selectedRows.length})
              </button>
            </>
          )}
          {selectedRows.length > 0 && (
            <button
              onClick={() => {
                setSelectedRows([]);
                setSelectAll(false);
              }}
              className="bg-gray-400 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-500"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">{successMsg}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Customer Form (Inline) - Only show when not in deleted view */}
      {showForm && !showDeleted && (
        <div ref={formRef} className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200 scroll-mt-20">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-semibold text-gray-700">
              {isEditing ? "✏️ Edit Customer" : "➕ Add New Customer"}
            </h3>
            <button onClick={clearFields} className="text-gray-500 hover:text-gray-700">
              ✕ Cancel
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Address (Multiline)
                </label>
                <textarea
                  value={formData.toAddress}
                  onChange={(e) => setFormData({...formData, toAddress: e.target.value})}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer address..."
                />
                <p className="text-xs text-gray-400 mt-1">Either 'To Address' or 'Site' must be filled</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site
                </label>
                <input
                  type="text"
                  value={formData.site}
                  onChange={(e) => setFormData({...formData, site: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter site name"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : (isEditing ? "Update Customer" : "Save Customer")}
              </button>
              <button
                type="button"
                onClick={clearFields}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers Table */}
      <div className="overflow-x-auto" ref={tableRef}>
        <div className="max-h-[450px] overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 w-10">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => setSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-16">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">To Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Site</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading customers...</p>
                   </td>
                  </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    {searchTerm ? "No customers match your search" : showDeleted ? "No deleted customers" : "No customers found. Click 'Add Customer' to add one."}
                   </td>
                  </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr 
                    key={customer._id} 
                    className={`border-t hover:bg-gray-50 ${
                      selectedId === customer._id ? "bg-blue-50" : ""
                    } ${!customer.isActive ? "bg-red-50 opacity-80" : ""}`}
                  >
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(customer._id)}
                        onChange={() => handleRowSelect(customer._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm align-top">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 align-top">
                      <span className="font-semibold text-blue-600">{customer.customerCode}</span>
                      <div className="text-xs text-gray-400">ID: {customer.customerId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 align-top">
                      <div className="whitespace-pre-wrap max-w-md">
                        {wrapText(customer.toAddress, 50)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 align-top">
                      {customer.site || "-"}
                    </td>
                    <td className="px-4 py-3 text-center align-top">
                      {!showDeleted ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(customer);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => handleSoftDelete(customer, e)}
                            className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded"
                            title="Move to Trash"
                          >
                            🗑️
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => handleRecoverCustomer(customer, e)}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            title="Recover"
                          >
                            ↩️
                          </button>
                          <button
                            onClick={(e) => handlePermanentDelete(customer, e)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Permanently Delete"
                          >
                            💀
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Customer Details */}
      {selectedCustomer && !showForm && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Selected Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Customer Code:</span>
                  <span className="ml-2 font-mono font-bold text-blue-600">{selectedCustomer.customerCode}</span>
                </div>
                <div>
                  <span className="text-gray-600">Customer ID:</span>
                  <span className="ml-2">{selectedCustomer.customerId}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">To Address:</span>
                  <div className="ml-2 mt-1 whitespace-pre-wrap text-gray-700">
                    {selectedCustomer.toAddress || "-"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Site:</span>
                  <span className="ml-2">{selectedCustomer.site || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 ${selectedCustomer.isActive ? "text-green-600" : "text-red-600"}`}>
                    {selectedCustomer.isActive ? "Active" : "Deleted"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
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