import React, { useState, useEffect } from "react";
import { billingAPI } from "../../api/api";
import BillTypeSelector from "./BillTypeSelector";
import CompanyManager from "./CompanyManager";
import NormalBill from "./NormalBill";
import TaxBill from "./TaxBill";
import CoreCuttingBill from "./CoreCuttingBill";
import ChallanBill from "./ChallanBill";

export default function NewBill() {
  const [billType, setBillType] = useState("normal");
  const [challanType, setChallanType] = useState("normal");
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBillScreen, setShowBillScreen] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Company form data based on bill type
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    gstNo: "",
    bankName: "",
    accountNo: "",
    ifscCode: ""
  });

  // Auto-clear messages
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

  // Fetch companies when bill type changes
  useEffect(() => {
    fetchCompanies();
  }, [billType, challanType]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get the actual bill type for API call
      let actualBillType = billType;
      if (billType === "challan") {
        actualBillType = challanType === "tax" ? "gst_challan" : "normal_challan";
      }
      
      const res = await billingAPI.get(`/billing/companies?type=${actualBillType}&status=active`);
      if (res.data.success) {
        setCompanies(res.data.companies);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError("Failed to fetch companies");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const resetCompanyForm = () => {
    setCompanyFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      gstNo: "",
      bankName: "",
      accountNo: "",
      ifscCode: ""
    });
    setEditingCompany(null);
  };

  const handleAddCompany = () => {
    resetCompanyForm();
    setShowCompanyForm(true);
    setError(null);
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setCompanyFormData({
      name: company.name || "",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      gstNo: company.gstNo || "",
      bankName: company.bankName || "",
      accountNo: company.accountNo || "",
      ifscCode: company.ifscCode || ""
    });
    setShowCompanyForm(true);
    setError(null);
  };

  const handleDeleteCompany = async (company) => {
    if (window.confirm(`Delete company "${company.name}"? This will move it to trash.`)) {
      setLoading(true);
      try {
        await billingAPI.delete(`/billing/companies/${company._id}`);
        setSuccessMsg(`Company "${company.name}" deleted successfully`);
        await fetchCompanies();
        if (selectedCompany?._id === company._id) {
          setSelectedCompany(null);
        }
      } catch (err) {
        console.error("Error deleting company:", err);
        setError(err.response?.data?.message || "Error deleting company");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!companyFormData.name.trim()) {
      setError("Company name is required");
      return;
    }

    // Determine actual bill type for saving
    let actualBillType = billType;
    if (billType === "challan") {
      actualBillType = challanType === "tax" ? "gst_challan" : "normal_challan";
    }

    setLoading(true);
    try {
      const companyData = {
        name: companyFormData.name,
        billType: actualBillType
      };

      // Add optional fields based on bill type
      if (actualBillType === "tax" || actualBillType === "corecutting") {
        companyData.address = companyFormData.address || "";
        companyData.phone = companyFormData.phone || "";
        companyData.email = companyFormData.email || "";
        companyData.gstNo = companyFormData.gstNo || "";
        companyData.bankName = companyFormData.bankName || "";
        companyData.accountNo = companyFormData.accountNo || "";
        companyData.ifscCode = companyFormData.ifscCode || "";
      } else if (actualBillType === "gst_challan") {
        // GST Challan - needs address, GST, Bank details
        companyData.address = companyFormData.address || "";
        companyData.gstNo = companyFormData.gstNo || "";
        companyData.bankName = companyFormData.bankName || "";
        companyData.accountNo = companyFormData.accountNo || "";
        companyData.ifscCode = companyFormData.ifscCode || "";
      } else if (actualBillType === "normal_challan") {
        // Normal Challan - needs only address
        companyData.address = companyFormData.address || "";
      }
      // For normal and corecutting bill, only name is sent

      if (editingCompany) {
        const response = await billingAPI.put(`/billing/companies/${editingCompany._id}`, companyData);
        if (response.data.success) {
          setSuccessMsg("Company updated successfully");
        }
      } else {
        const response = await billingAPI.post("/billing/companies", companyData);
        if (response.data.success) {
          let typeDisplay = "";
          if (actualBillType === "normal") typeDisplay = "Normal Bill";
          else if (actualBillType === "tax") typeDisplay = "Tax Invoice";
          else if (actualBillType === "corecutting") typeDisplay = "Core Cutting";
          else if (actualBillType === "gst_challan") typeDisplay = "GST Challan";
          else if (actualBillType === "normal_challan") typeDisplay = "Normal Challan";
          
          setSuccessMsg(`Company "${companyFormData.name}" added successfully for ${typeDisplay}`);
        }
      }
      setShowCompanyForm(false);
      resetCompanyForm();
      await fetchCompanies();
    } catch (err) {
      console.error("Error saving company:", err);
      const errorMsg = err.response?.data?.message || "Error saving company";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!selectedCompany) {
      setError("Please select a company");
      return;
    }
    setShowBillScreen(true);
  };

  const handleBack = () => {
    setShowBillScreen(false);
  };

  // Get the actual bill type for form display
  const getActualBillType = () => {
    if (billType === "challan") {
      return challanType === "tax" ? "gst_challan" : "normal_challan";
    }
    return billType;
  };

  const actualBillType = getActualBillType();

  // Determine which fields to show based on bill type
  const shouldShowAddress = () => {
    return actualBillType === "tax" || actualBillType === "corecutting" || 
           actualBillType === "gst_challan" || actualBillType === "normal_challan";
  };

  const shouldShowPhoneEmail = () => {
    return actualBillType === "tax" || actualBillType === "corecutting";
  };

  const shouldShowGST = () => {
    return actualBillType === "tax" || actualBillType === "corecutting" || actualBillType === "gst_challan";
  };

  const shouldShowBank = () => {
    return actualBillType === "tax" || actualBillType === "corecutting" || actualBillType === "gst_challan";
  };

  // Get display name for bill type
  const getBillTypeDisplay = () => {
    const typeNames = {
      normal: "Normal Bill",
      tax: "Tax Invoice",
      corecutting: "Core Cutting",
      gst_challan: "GST Challan",
      normal_challan: "Normal Challan"
    };
    return typeNames[actualBillType] || "Bill";
  };

  // Render Bill Screen based on type
  const renderBillScreen = () => {
    const billProps = {
      company: selectedCompany,
      onBack: handleBack,
      billType: actualBillType
    };

    switch(actualBillType) {
      case "tax":
        return <TaxBill {...billProps} />;
      case "corecutting":
        return <CoreCuttingBill {...billProps} />;
      case "gst_challan":
      case "normal_challan":
        return <ChallanBill {...billProps} />;
      default:
        return <NormalBill {...billProps} />;
    }
  };

  if (showBillScreen) {
    return renderBillScreen();
  }

  // Get form title
  const getFormTitle = () => {
    return `${editingCompany ? "Edit" : "Add"} Company for ${getBillTypeDisplay()}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🧾 Create New Bill</h2>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm">{successMsg}</p>
        </div>
      )}

      {/* Bill Type Selection */}
      <BillTypeSelector
        billType={billType}
        setBillType={setBillType}
        challanType={challanType}
        setChallanType={setChallanType}
      />

      {/* Company Management */}
      <CompanyManager
        companies={companies}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        onAddCompany={handleAddCompany}
        onEditCompany={handleEditCompany}
        onDeleteCompany={handleDeleteCompany}
        loading={loading}
        billType={billType}
        challanType={challanType}
      />

      {/* Proceed Button */}
      <div className="mt-6">
        <button
          onClick={handleProceed}
          disabled={!selectedCompany || loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          ➡️ Proceed to {getBillTypeDisplay()}
        </button>
      </div>

      {/* Add/Edit Company Modal - Dynamic Fields based on Bill Type */}
      {showCompanyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">{getFormTitle()}</h2>
              <button
                onClick={() => setShowCompanyForm(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveCompany} className="p-6">
              <div className="space-y-4">
                {/* Company Name - Always required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyFormData.name}
                    onChange={(e) => setCompanyFormData({...companyFormData, name: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company name"
                  />
                </div>

                {/* For Normal Bill - Only Name field */}
                {actualBillType === "normal" && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    Only company name is required for Normal Bill.
                  </div>
                )}

                {/* For Core Cutting - Name only */}
                {actualBillType === "corecutting" && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    Only company name is required for Core Cutting Bill.
                  </div>
                )}

                {/* Address - Show for Tax, GST Challan, Normal Challan */}
                {shouldShowAddress() && actualBillType !== "corecutting" && actualBillType !== "normal" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      value={companyFormData.address}
                      onChange={(e) => setCompanyFormData({...companyFormData, address: e.target.value})}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter company address (optional)"
                    />
                  </div>
                )}

                {/* Phone & Email - Show only for Tax */}
                {shouldShowPhoneEmail() && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={companyFormData.phone}
                        onChange={(e) => setCompanyFormData({...companyFormData, phone: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={companyFormData.email}
                        onChange={(e) => setCompanyFormData({...companyFormData, email: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Email address"
                      />
                    </div>
                  </div>
                )}

                {/* GST Details - Show for Tax, Core Cutting, and GST Challan */}
                {shouldShowGST() && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      GST Details
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GST Number
                      </label>
                      <input
                        type="text"
                        value={companyFormData.gstNo}
                        onChange={(e) => setCompanyFormData({...companyFormData, gstNo: e.target.value.toUpperCase()})}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 uppercase"
                        placeholder="Enter GST number"
                      />
                      {(actualBillType === "tax" || actualBillType === "corecutting" || actualBillType === "gst_challan") && (
                        <p className="text-xs text-gray-400 mt-1">GST number is required for {getBillTypeDisplay()}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank Details - Show for Tax and GST Challan */}
                {shouldShowBank() && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Bank Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={companyFormData.bankName}
                          onChange={(e) => setCompanyFormData({...companyFormData, bankName: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter bank name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={companyFormData.accountNo}
                          onChange={(e) => setCompanyFormData({...companyFormData, accountNo: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter account number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={companyFormData.ifscCode}
                          onChange={(e) => setCompanyFormData({...companyFormData, ifscCode: e.target.value.toUpperCase()})}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 uppercase"
                          placeholder="Enter IFSC code"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : (editingCompany ? "Update Company" : "Save Company")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompanyForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}