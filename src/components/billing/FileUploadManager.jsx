import React, { useState, useEffect } from "react";
import { billingAPI } from "../../api/api";

export default function FileUploadManager() {
  const [signatureFiles, setSignatureFiles] = useState([]);
  const [templateFiles, setTemplateFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cached, setCached] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("signatures");
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("billingUser");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await billingAPI.get("/billing/uploads/list");
      setSignatureFiles(res.data.signatures || []);
      setTemplateFiles(res.data.templates || []);
      setCached(res.data.cached || false);
    } catch (err) {
      console.error("Error fetching files:", err);
      alert("Error fetching files");
    } finally {
      setLoading(false);
    }
  };

  const refreshCache = async () => {
    setLoading(true);
    try {
      await billingAPI.post("/billing/uploads/refresh-cache");
      await fetchFiles();
      alert("Cache refreshed successfully!");
    } catch (err) {
      console.error("Error refreshing cache:", err);
      alert("Error refreshing cache");
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 3 * 1024 * 1024) {
      alert("Signature image must be under 3 MB");
      return;
    }
    
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/bmp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only image files are allowed (PNG, JPG, JPEG, BMP, GIF)");
      return;
    }
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append("signature", file);
    
    try {
      const res = await billingAPI.post("/billing/uploads/signature", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      alert(res.data.message);
      fetchFiles();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Error uploading file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleTemplateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedExts = [".docx", ".xlsx", ".xls"];
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExts.includes(`.${ext}`)) {
      alert("Only .docx, .xlsx, .xls files are allowed");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert("Template file must be under 10 MB");
      return;
    }
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append("template", file);
    
    try {
      const res = await billingAPI.post("/billing/uploads/template", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      alert(res.data.message);
      fetchFiles();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Error uploading file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (filename, type) => {
    if (window.confirm(`Delete file "${filename}"? This action cannot be undone.`)) {
      try {
        await billingAPI.delete(`/billing/uploads/${type}/${filename}`);
        alert("File deleted successfully");
        fetchFiles();
        if (previewFile === filename) setPreviewFile(null);
      } catch (err) {
        console.error("Error deleting file:", err);
        alert(err.response?.data?.message || "Error deleting file");
      }
    }
  };

  const handleView = (fileUrl, filename) => {
    if (fileUrl) {
      setPreviewFile(filename);
      window.open(fileUrl, "_blank");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">📤 File Upload Manager</h2>
            <p className="text-sm text-gray-500 mt-1">Manage signatures and templates for billing</p>
          </div>
          <button
            onClick={refreshCache}
            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2"
            title="Refresh cache"
          >
            🔄 Refresh Cache
            {cached && <span className="text-xs text-green-300">(Cached)</span>}
          </button>
        </div>
      </div>

      {/* Company Info */}
      {user && (
        <div className="mx-6 mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">🏢</span>
            <span className="text-gray-600">Files are stored securely in cloud for:</span>
            <strong className="text-gray-800">{user.companyName}</strong>
          </div>
          <p className="text-xs text-gray-400 mt-1">Files are cached for quick access during billing</p>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-4 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("signatures")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "signatures"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🖼️ Signatures ({signatureFiles.length})
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "templates"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📄 Templates ({templateFiles.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Upload Section */}
        <div className="mb-6">
          {activeTab === "signatures" ? (
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                <span>🖊️</span>
                {uploading ? "Uploading..." : "Upload Signature Image"}
              </div>
            </label>
          ) : (
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                accept=".docx,.xlsx,.xls"
                onChange={handleTemplateUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                <span>📄</span>
                {uploading ? "Uploading..." : "Upload Template File"}
              </div>
            </label>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {activeTab === "signatures" 
              ? "Allowed formats: PNG, JPG, JPEG, BMP, GIF (Max 3MB)"
              : "Allowed formats: DOCX, XLSX, XLS (Max 10MB)"}
          </p>
        </div>

        {/* Uploading Progress */}
        {uploading && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Uploading to cloud...</p>
          </div>
        )}

        {/* Files List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading files...</p>
          </div>
        ) : (
          <>
            {/* Signatures List */}
            {activeTab === "signatures" && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🖼️ Signature Images</span>
                  <span className="text-xs text-gray-400">({signatureFiles.length} files)</span>
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  {signatureFiles.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No signature images uploaded
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {signatureFiles.map((file, idx) => (
                        <div key={idx} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                          <div className="bg-gray-50 p-2 border-b">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                              <span className="text-xs text-gray-500">{formatDate(file.createdAt)}</span>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="bg-gray-100 rounded-lg p-2 mb-2 flex items-center justify-center h-32">
                              <img 
                                src={file.url} 
                                alt={file.name}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/150?text=No+Image";
                                }}
                              />
                            </div>
                            <p className="text-sm font-mono truncate" title={file.name}>{file.name}</p>
                          </div>
                          <div className="bg-gray-50 p-2 flex justify-end gap-2">
                            <button
                              onClick={() => handleView(file.url, file.name)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="View"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleDelete(file.name, "signatures")}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Templates List */}
            {activeTab === "templates" && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>📄 Templates</span>
                  <span className="text-xs text-gray-400">({templateFiles.length} files)</span>
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  {templateFiles.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No template files uploaded
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">File Name</th>
                          <th className="px-4 py-3 text-left">Size</th>
                          <th className="px-4 py-3 text-left">Uploaded</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templateFiles.map((file, idx) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">📄</span>
                                <span className="font-mono text-sm">{file.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {formatDate(file.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleView(file.url, file.name)}
                                className="text-blue-600 hover:text-blue-800 mr-3 p-1"
                                title="Download"
                              >
                                📥
                              </button>
                              <button
                                onClick={() => handleDelete(file.name, "templates")}
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
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-400 text-center">
          Files are stored securely in cloud and cached for quick access during billing
        </p>
      </div>
    </div>
  );
}