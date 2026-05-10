// src/pages/CompanySettings.jsx

import React, { useState, useEffect } from "react";
import API from "../api/api";

export default function CompanySettings() {
  const [companyDetails, setCompanyDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gst: "",
    logo: null,
    whatsappNumber: ""
  });

  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const res = await API.get("/auth/company-details");
      setCompanyDetails(res.data.companyDetails || {});
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setShowToast(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo size should be less than 2MB");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload JPG, PNG, GIF, or WEBP image");
      return;
    }

    setUploadingLogo(true);

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await API.post("/auth/upload-logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setCompanyDetails({
        ...companyDetails,
        logo: res.data.logo
      });

      showMessage("success", "Logo uploaded successfully!");
    } catch (err) {
      console.error("Error uploading logo:", err);
      showMessage("error", "Error uploading logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm("Are you sure you want to delete the company logo?"))
      return;

    try {
      await API.delete("/auth/delete-logo");

      setCompanyDetails({
        ...companyDetails,
        logo: null
      });

      showMessage("success", "Logo deleted successfully!");
    } catch (err) {
      console.error("Error deleting logo:", err);
      showMessage("error", "Error deleting logo");
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { logo, ...detailsToSave } = companyDetails;

      await API.put("/auth/company-details", {
        companyDetails: detailsToSave
      });

      showMessage("success", "✅ Company details updated successfully!");
      
      // Optional: Change button text temporarily
      setTimeout(() => {
        setLoading(false);
      }, 500);
      
    } catch (err) {
      showMessage("error", "❌ Error updating company details");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 relative">
      
      {/* Toast Notification - Appears at bottom right */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-green-500 text-white" 
              : "bg-red-500 text-white"
          }`}>
            {message.type === "success" ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      <div className="w-full">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800">
            Company Settings
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Manage your business profile and notifications
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">
              Business Profile
            </h2>
          </div>

          <div className="p-6 md:p-8">

            {/* Logo */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Company Logo
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

                <div className="relative">
                  {companyDetails.logo ? (
                    <div className="relative">
                      <div className="w-28 h-28 bg-gray-100 rounded-2xl overflow-hidden border">
                        <img
                          src={companyDetails.logo}
                          alt="Company Logo"
                          className="w-full h-full object-contain p-2"
                        />
                      </div>

                      <button
                        onClick={handleDeleteLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">
                        No Logo
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-all">
                    {uploadingLogo ? "Uploading..." : "📸 Upload Logo"}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>

                <input
                  type="text"
                  value={companyDetails.name || ""}
                  onChange={(e) =>
                    setCompanyDetails({
                      ...companyDetails,
                      name: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                />
              </div>

              {/* Phone (for billing) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (for billing)
                </label>

                <input
                  type="text"
                  value={companyDetails.phone || ""}
                  onChange={(e) =>
                    setCompanyDetails({
                      ...companyDetails,
                      phone: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number for bills"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={companyDetails.email || ""}
                  onChange={(e) =>
                    setCompanyDetails({
                      ...companyDetails,
                      email: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>

              {/* GST */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number
                </label>

                <input
                  type="text"
                  value={companyDetails.gst || ""}
                  onChange={(e) =>
                    setCompanyDetails({
                      ...companyDetails,
                      gst: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter GST"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>

                <textarea
                  value={companyDetails.address || ""}
                  onChange={(e) =>
                    setCompanyDetails({
                      ...companyDetails,
                      address: e.target.value
                    })
                  }
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter business address"
                />
              </div>
            </div>

            {/* WhatsApp Section */}
            <div className="mt-10 border-t border-gray-200 pt-8">

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                    📲
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      WhatsApp Notifications
                    </h3>

                    <p className="text-sm text-gray-500">
                      Receive login alerts, OTPs, and password reset notifications
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    📌 Your WhatsApp number will be used to receive:
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Login success/failure alerts</li>
                    <li>Password reset OTPs</li>
                    <li>Security notifications</li>
                    <li>Account activity updates</li>
                  </ul>
                </div>

                {/* WhatsApp Number Input */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number for Notifications
                  </label>

                  <input
                    type="tel"
                    value={companyDetails.whatsappNumber || ""}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        whatsappNumber: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="919876543210"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter with country code (e.g., 91 for India)
                  </p>
                </div>

              </div>
            </div>

            {/* Save Button with Loading State */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={loading}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  loading 
                    ? "bg-gray-400 text-white cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  "💾 Save Company Details"
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Add this CSS to your global CSS file or use Tailwind */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}