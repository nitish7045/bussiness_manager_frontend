import React from "react";

export default function CompanyManager({
  companies,
  selectedCompany,
  setSelectedCompany,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
  loading,
  billType,
  challanType
}) {
  const getActualBillType = () => {
    if (billType === "challan") {
      return challanType === "tax" ? "gst_challan" : "normal_challan";
    }
    return billType;
  };

  const actualBillType = getActualBillType();
  
  const formatCompanyDisplay = (company) => {
    return company.name;
  };

  // Determine which columns to show based on bill type
  const getTableColumns = () => {
    switch(actualBillType) {
      case "normal":
        return { showAddress: false, showGST: false, showBank: false };
      case "corecutting":
        return { showAddress: false, showGST: false, showBank: false };
      case "tax":
        return { showAddress: true, showGST: true, showBank: true };
      case "gst_challan":
        return { showAddress: false, showGST: true, showBank: true };
      case "normal_challan":
        return { showAddress: true, showGST: false, showBank: false };
      default:
        return { showAddress: false, showGST: false, showBank: false };
    }
  };

  const { showAddress, showGST, showBank } = getTableColumns();

  if (loading) {
    return (
      <div className="mb-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Company Selection Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Company</label>
        <div className="flex gap-3">
          <select
            value={selectedCompany?._id || ""}
            onChange={(e) => {
              const company = companies.find(c => c._id === e.target.value);
              setSelectedCompany(company);
            }}
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a company --</option>
            {companies.map(company => (
              <option key={company._id} value={company._id}>
                {formatCompanyDisplay(company)}
              </option>
            ))}
          </select>
          <button
            onClick={onAddCompany}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 whitespace-nowrap"
          >
            ➕ Add Company
          </button>
        </div>
      </div>

      {/* Companies Table */}
      {companies.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold text-gray-700">
              Companies List ({getBillTypeDisplayName()})
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Company Name</th>
                  {showAddress && <th className="px-3 py-2 text-left">Address</th>}
                  {showGST && <th className="px-3 py-2 text-left">GST No</th>}
                  {showBank && <th className="px-3 py-2 text-left">Bank Details</th>}
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, idx) => (
                  <tr key={company._id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">{company.name}</td>
                    
                    {showAddress && (
                      <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">
                        {company.address || "-"}
                      </td>
                    )}
                    
                    {showGST && (
                      <td className="px-3 py-2 text-xs font-mono">
                        {company.gstNo || "-"}
                      </td>
                    )}
                    
                    {showBank && (
                      <td className="px-3 py-2 text-xs text-gray-600">
                        <div>
                          <div><span className="font-medium">Bank:</span> {company.bankName || "-"}</div>
                          <div><span className="font-medium">A/C:</span> {company.accountNo || "-"}</div>
                          <div><span className="font-medium">IFSC:</span> {company.ifscCode || "-"}</div>
                        </div>
                      </td>
                    )}
                    
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => onEditCompany(company)}
                        className="text-blue-600 hover:text-blue-800 mr-2 p-1"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteCompany(company)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {companies.length === 0 && !loading && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">No companies found for {getBillTypeDisplayName()}. Click "Add Company" to create one.</p>
        </div>
      )}
    </div>
  );

  // Helper function to get display name for bill type
  function getBillTypeDisplayName() {
    switch(actualBillType) {
      case "normal":
        return "Normal Bill";
      case "tax":
        return "Tax Invoice";
      case "corecutting":
        return "Core Cutting";
      case "gst_challan":
        return "GST Challan";
      case "normal_challan":
        return "Normal Challan";
      default:
        return "Bill";
    }
  }
}