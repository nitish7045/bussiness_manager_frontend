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

    // WhatsApp Settings
    whatsappNumber: "",
    whatsappApiKey: ""
  });

  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState("");

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

      setMessage({
        type: "success",
        text: "Logo uploaded successfully!"
      });

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error uploading logo:", err);
      alert("Error uploading logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete the company logo?"
      )
    )
      return;

    try {
      await API.delete("/auth/delete-logo");

      setCompanyDetails({
        ...companyDetails,
        logo: null
      });

      setMessage({
        type: "success",
        text: "Logo deleted successfully!"
      });

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting logo:", err);
      alert("Error deleting logo");
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { logo, ...detailsToSave } = companyDetails;

      await API.put("/auth/company-details", {
        companyDetails: detailsToSave
      });

      setMessage({
        type: "success",
        text: "Company details updated successfully!"
      });

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage({
        type: "error",
        text: "Error updating company details"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticateWhatsApp = () => {
    window.open(
      "https://api.whatsapp.com/send?phone=34684783347&text=I%20allow%20callmebot%20to%20send%20me%20messages",
      "_blank"
    );
  };

  const handleTestMessage = async () => {
    try {
      if (
        !companyDetails.whatsappNumber ||
        !companyDetails.whatsappApiKey
      ) {
        alert("Enter WhatsApp number and API key first");
        return;
      }

      await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${companyDetails.whatsappNumber}&text=${encodeURIComponent(
          "WhatsApp notifications connected successfully ✅"
        )}&apikey=${companyDetails.whatsappApiKey}`
      );

      alert("Test message sent successfully");
    } catch (err) {
      console.error(err);
      alert("Error sending test message");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
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

            {/* Message */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

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
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
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
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  placeholder="Enter company name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
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
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  placeholder="Enter phone number"
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
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
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
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
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
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  placeholder="Enter business address"
                />
              </div>
            </div>

            {/* WhatsApp Section */}
            <div className="mt-10 border-t border-gray-200 pt-8">

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    📲
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      WhatsApp Notifications
                    </h3>

                    <p className="text-sm text-gray-500">
                      Connect CallMeBot for login alerts and OTP messages
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-white border border-green-100 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Setup Instructions
                  </p>

                  <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Click Authenticate WhatsApp</li>
                    <li>Send message on WhatsApp</li>
                    <li>Receive API Key from CallMeBot</li>
                    <li>Paste API Key below</li>
                    <li>Save settings</li>
                  </ol>
                </div>

                {/* Number */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>

                  <input
                    type="text"
                    value={companyDetails.whatsappNumber || ""}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        whatsappNumber: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    placeholder="919876543210"
                  />
                </div>

                {/* API KEY */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CallMeBot API Key
                  </label>

                  <input
                    type="text"
                    value={companyDetails.whatsappApiKey || ""}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        whatsappApiKey: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    placeholder="Paste API Key"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">

                  <button
                    type="button"
                    onClick={handleAuthenticateWhatsApp}
                    className="bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-green-700 transition-all"
                  >
                    🔐 Authenticate WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={handleTestMessage}
                    className="bg-white border border-green-300 text-green-700 px-5 py-3 rounded-xl text-sm font-medium hover:bg-green-50 transition-all"
                  >
                    📩 Send Test Message
                  </button>

                </div>
              </div>
            </div>

            {/* Save */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                {loading ? "Saving..." : "Save Company Details"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}