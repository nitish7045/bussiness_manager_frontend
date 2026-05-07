// src/components/reports/WorkerReport.jsx
import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function WorkerReport({ data, totalActive, totalInactive, avgSalary }) {
  const [expandedRows, setExpandedRows] = useState({});
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedWorkersForDownload, setSelectedWorkersForDownload] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [downloadType, setDownloadType] = useState("full"); // full, aadhaar, profile, both
  
  // Get all unique extra field keys from all workers
  const [allExtraFields, setAllExtraFields] = useState([]);
  const [extraFieldSearch, setExtraFieldSearch] = useState("");
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    worker: true,
    designation: true,
    salary: true,
    phone: true,
    status: true,
    photo: true,
    experience: false,
    aadhaar: false,
    employeeId: false,
    joinedDate: false,
    bankAccount: false,
    ifsc: false,
    upi: false,
    dailyRate: false
  });
  
  // Dynamic extra fields visibility
  const [extraFieldsVisibility, setExtraFieldsVisibility] = useState({});

  useEffect(() => {
    // Extract all unique extra field keys from workers
    const extraKeys = new Set();
    data.forEach(worker => {
      if (worker.extraFields && typeof worker.extraFields === 'object') {
        Object.keys(worker.extraFields).forEach(key => {
          extraKeys.add(key);
        });
      }
    });
    const keysArray = Array.from(extraKeys);
    setAllExtraFields(keysArray);
    
    // Initialize visibility for extra fields (default false)
    const initialVisibility = {};
    keysArray.forEach(key => {
      initialVisibility[key] = false;
    });
    setExtraFieldsVisibility(initialVisibility);
  }, [data]);

  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const viewPhoto = (photoUrl) => {
    setSelectedPhoto(photoUrl);
    setShowPhotoModal(true);
  };

  const formatAadhaar = (aadhaar) => {
    if (!aadhaar) return "Not provided";
    return aadhaar.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const toggleExtraField = (fieldName) => {
    setExtraFieldsVisibility(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const getExtraFieldValue = (worker, fieldName) => {
    if (!worker.extraFields) return "-";
    return worker.extraFields[fieldName] || "-";
  };

  const filteredExtraFields = allExtraFields.filter(field => 
    field.toLowerCase().includes(extraFieldSearch.toLowerCase())
  );

  // Download Aadhaar cards as ZIP
  const downloadAadhaarCards = async () => {
    const workersToDownload = selectAll ? data : data.filter(w => selectedWorkersForDownload.includes(w._id));
    const workersWithAadhaar = workersToDownload.filter(w => w.aadhaarPhoto);
    
    if (workersWithAadhaar.length === 0) {
      alert("No Aadhaar cards found for selected workers");
      return;
    }
    
    setDownloading(true);
    setDownloadProgress(0);
    
    const zip = new JSZip();
    
    for (let i = 0; i < workersWithAadhaar.length; i++) {
      const worker = workersWithAadhaar[i];
      setDownloadProgress(((i + 1) / workersWithAadhaar.length) * 100);
      
      // Convert base64 image to blob
      const response = await fetch(worker.aadhaarPhoto);
      const blob = await response.blob();
      const fileName = `${worker.name}_AadhaarCard.jpg`;
      zip.file(fileName, blob);
    }
    
    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
    saveAs(zipBlob, `Aadhaar_Cards_${new Date().toLocaleDateString()}.zip`);
    
    setDownloading(false);
    setDownloadProgress(0);
  };

  // Download Profile Photos as ZIP
  const downloadProfilePhotos = async () => {
    const workersToDownload = selectAll ? data : data.filter(w => selectedWorkersForDownload.includes(w._id));
    const workersWithPhoto = workersToDownload.filter(w => w.profilePhoto);
    
    if (workersWithPhoto.length === 0) {
      alert("No profile photos found for selected workers");
      return;
    }
    
    setDownloading(true);
    setDownloadProgress(0);
    
    const zip = new JSZip();
    
    for (let i = 0; i < workersWithPhoto.length; i++) {
      const worker = workersWithPhoto[i];
      setDownloadProgress(((i + 1) / workersWithPhoto.length) * 100);
      
      const response = await fetch(worker.profilePhoto);
      const blob = await response.blob();
      const fileName = `${worker.name}_ProfilePhoto.jpg`;
      zip.file(fileName, blob);
    }
    
    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
    saveAs(zipBlob, `Profile_Photos_${new Date().toLocaleDateString()}.zip`);
    
    setDownloading(false);
    setDownloadProgress(0);
  };

  // Download Both Documents as ZIP
  const downloadBothDocuments = async () => {
    const workersToDownload = selectAll ? data : data.filter(w => selectedWorkersForDownload.includes(w._id));
    const workersWithDocs = workersToDownload.filter(w => w.profilePhoto || w.aadhaarPhoto);
    
    if (workersWithDocs.length === 0) {
      alert("No documents found for selected workers");
      return;
    }
    
    setDownloading(true);
    setDownloadProgress(0);
    
    const zip = new JSZip();
    let processedCount = 0;
    const totalFiles = workersWithDocs.reduce((sum, w) => sum + (w.profilePhoto ? 1 : 0) + (w.aadhaarPhoto ? 1 : 0), 0);
    
    for (const worker of workersWithDocs) {
      if (worker.profilePhoto) {
        const response = await fetch(worker.profilePhoto);
        const blob = await response.blob();
        zip.file(`${worker.name}/ProfilePhoto.jpg`, blob);
        processedCount++;
        setDownloadProgress((processedCount / totalFiles) * 100);
      }
      
      if (worker.aadhaarPhoto) {
        const response = await fetch(worker.aadhaarPhoto);
        const blob = await response.blob();
        zip.file(`${worker.name}/AadhaarCard.jpg`, blob);
        processedCount++;
        setDownloadProgress((processedCount / totalFiles) * 100);
      }
    }
    
    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
    saveAs(zipBlob, `Worker_Documents_${new Date().toLocaleDateString()}.zip`);
    
    setDownloading(false);
    setDownloadProgress(0);
  };

  // Download full worker report as PDF
  const downloadFullReport = async () => {
    const workersToDownload = selectAll ? data : data.filter(w => selectedWorkersForDownload.includes(w._id));
    
    if (workersToDownload.length === 0) {
      alert("Please select at least one worker to download");
      return;
    }
    
    setDownloading(true);
    setDownloadProgress(0);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    for (let i = 0; i < workersToDownload.length; i++) {
      const worker = workersToDownload[i];
      setDownloadProgress(((i + 1) / workersToDownload.length) * 100);
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateWorkerPDFHTML(worker);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: 800
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight, undefined, 'FAST');
      
      document.body.removeChild(tempDiv);
    }
    
    pdf.save(`Worker_Reports_${new Date().toLocaleDateString()}.pdf`);
    setDownloading(false);
    setDownloadProgress(0);
    setSelectedWorkersForDownload([]);
    setSelectAll(false);
  };

  const generateWorkerPDFHTML = (worker) => {
    const dailyRate = (worker.wages?.monthly / (worker.wages?.calculationDays || 30)).toFixed(2);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: white; }
          .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #1e40af; }
          .subtitle { font-size: 12px; color: #6b7280; margin-top: 5px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; color: #374151; border-left: 3px solid #3b82f6; padding-left: 10px; margin-bottom: 10px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-card { background: #f3f4f6; padding: 12px; border-radius: 8px; }
          .info-label { font-size: 10px; color: #6b7280; }
          .info-value { font-size: 12px; font-weight: 500; color: #1f2937; margin-top: 4px; }
          .photo-section { margin: 15px 0; }
          .photo-container { display: flex; gap: 20px; justify-content: center; }
          .photo-box { text-align: center; }
          .photo-img { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; }
          .photo-label { font-size: 10px; margin-top: 5px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          th { background: #f9fafb; font-weight: 600; }
          .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">Worker Details Report</div>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="grid-2">
              <div class="info-card">
                <div class="info-label">Full Name</div>
                <div class="info-value">${worker.name}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Designation</div>
                <div class="info-value">${worker.designation}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Phone Number</div>
                <div class="info-value">${worker.phone || "Not provided"}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Status</div>
                <div class="info-value">${worker.status === "active" ? "Active" : "Inactive"}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Experience</div>
                <div class="info-value">${worker.experience || 0} years</div>
              </div>
              <div class="info-card">
                <div class="info-label">Aadhaar Number</div>
                <div class="info-value">${formatAadhaar(worker.aadhaar)}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Salary Details</div>
            <div class="grid-2">
              <div class="info-card">
                <div class="info-label">Monthly Salary</div>
                <div class="info-value">₹${formatNumber(worker.wages?.monthly)}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Calculation Days</div>
                <div class="info-value">${worker.wages?.calculationDays || 30} days</div>
              </div>
              <div class="info-card">
                <div class="info-label">Daily Rate</div>
                <div class="info-value">₹${dailyRate}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Joined Date</div>
                <div class="info-value">${new Date(worker.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Bank Details</div>
            <div class="grid-2">
              <div class="info-card">
                <div class="info-label">Account Number</div>
                <div class="info-value">${worker.bank?.accountNumber || "Not provided"}</div>
              </div>
              <div class="info-card">
                <div class="info-label">IFSC Code</div>
                <div class="info-value">${worker.bank?.ifsc || "Not provided"}</div>
              </div>
              <div class="info-card">
                <div class="info-label">UPI ID</div>
                <div class="info-value">${worker.upi?.id || "Not provided"}</div>
              </div>
            </div>
          </div>
          
          ${worker.extraFields && Object.keys(worker.extraFields).length > 0 ? `
          <div class="section">
            <div class="section-title">Additional Information</div>
            <table>
              <thead><tr><th>Field</th><th>Value</th></tr></thead>
              <tbody>
                ${Object.entries(worker.extraFields).map(([key, value]) => `
                  <tr><td>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td><td>${value}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <div class="photo-section">
            <div class="section-title">Documents</div>
            <div class="photo-container">
              ${worker.profilePhoto ? `
              <div class="photo-box">
                <img src="${worker.profilePhoto}" class="photo-img" />
                <div class="photo-label">Profile Photo</div>
              </div>
              ` : ''}
              ${worker.aadhaarPhoto ? `
              <div class="photo-box">
                <img src="${worker.aadhaarPhoto}" class="photo-img" />
                <div class="photo-label">Aadhaar Card</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="footer">
            <p>This is a computer-generated document. For any queries, contact administration.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = () => {
    switch(downloadType) {
      case "aadhaar":
        downloadAadhaarCards();
        break;
      case "profile":
        downloadProfilePhotos();
        break;
      case "both":
        downloadBothDocuments();
        break;
      case "full":
      default:
        downloadFullReport();
        break;
    }
  };

  const toggleSelectWorker = (workerId) => {
    setSelectedWorkersForDownload(prev => {
      if (prev.includes(workerId)) {
        return prev.filter(id => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
  };

  const toggleSelectAllWorkers = () => {
    if (selectAll) {
      setSelectedWorkersForDownload([]);
    } else {
      setSelectedWorkersForDownload(data.map(w => w._id));
    }
    setSelectAll(!selectAll);
  };

  const exportToCSV = () => {
    const headers = [];
    if (visibleColumns.worker) headers.push("Worker Name");
    if (visibleColumns.designation) headers.push("Designation");
    if (visibleColumns.salary) headers.push("Monthly Salary");
    if (visibleColumns.phone) headers.push("Phone");
    if (visibleColumns.status) headers.push("Status");
    if (visibleColumns.experience) headers.push("Experience (Years)");
    if (visibleColumns.aadhaar) headers.push("Aadhaar Number");
    if (visibleColumns.employeeId) headers.push("Employee ID");
    if (visibleColumns.joinedDate) headers.push("Joined Date");
    if (visibleColumns.bankAccount) headers.push("Bank Account");
    if (visibleColumns.ifsc) headers.push("IFSC Code");
    if (visibleColumns.upi) headers.push("UPI ID");
    if (visibleColumns.dailyRate) headers.push("Daily Rate");
    
    allExtraFields.forEach(field => {
      if (extraFieldsVisibility[field]) {
        headers.push(field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    });
    
    const rows = data.map(worker => {
      const row = [];
      if (visibleColumns.worker) row.push(`"${worker.name}"`);
      if (visibleColumns.designation) row.push(`"${worker.designation}"`);
      if (visibleColumns.salary) row.push(worker.wages?.monthly || 0);
      if (visibleColumns.phone) row.push(`"${worker.phone || ""}"`);
      if (visibleColumns.status) row.push(worker.status);
      if (visibleColumns.experience) row.push(worker.experience || 0);
      if (visibleColumns.aadhaar) row.push(`"${worker.aadhaar || ""}"`);
      if (visibleColumns.employeeId) row.push(`"${worker._id || ""}"`);
      if (visibleColumns.joinedDate) row.push(new Date(worker.createdAt).toLocaleDateString());
      if (visibleColumns.bankAccount) row.push(`"${worker.bank?.accountNumber || ""}"`);
      if (visibleColumns.ifsc) row.push(`"${worker.bank?.ifsc || ""}"`);
      if (visibleColumns.upi) row.push(`"${worker.upi?.id || ""}"`);
      if (visibleColumns.dailyRate) row.push((worker.wages?.monthly / (worker.wages?.calculationDays || 30)).toFixed(2));
      
      allExtraFields.forEach(field => {
        if (extraFieldsVisibility[field]) {
          row.push(`"${getExtraFieldValue(worker, field)}"`);
        }
      });
      return row.join(",");
    });
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "worker_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getVisibleColumnsCount = () => {
    let count = Object.values(visibleColumns).filter(v => v === true).length;
    count += Object.values(extraFieldsVisibility).filter(v => v === true).length;
    return count;
  };

  const getSelectedCount = () => {
    if (selectAll) return data.length;
    return selectedWorkersForDownload.length;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Worker Summary</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Columns ({getVisibleColumnsCount()})
              </button>
              <button
                onClick={exportToCSV}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center gap-1"
              >
                📥 Export CSV
              </button>
            </div>
          </div>
          
          {/* Column Selector Dropdown */}
          {showColumnSelector && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm max-h-96 overflow-y-auto">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Select Columns to Display</h4>
              
              {/* Basic Columns */}
              <div className="mb-3">
                <h5 className="text-xs font-medium text-gray-600 mb-1">Basic Information</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.worker} onChange={() => toggleColumn("worker")} /><span>Worker Name</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.designation} onChange={() => toggleColumn("designation")} /><span>Designation</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.salary} onChange={() => toggleColumn("salary")} /><span>Salary</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.phone} onChange={() => toggleColumn("phone")} /><span>Phone</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.status} onChange={() => toggleColumn("status")} /><span>Status</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.photo} onChange={() => toggleColumn("photo")} /><span>Photo</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.experience} onChange={() => toggleColumn("experience")} /><span>Experience</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.aadhaar} onChange={() => toggleColumn("aadhaar")} /><span>Aadhaar</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.employeeId} onChange={() => toggleColumn("employeeId")} /><span>Employee ID</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.joinedDate} onChange={() => toggleColumn("joinedDate")} /><span>Joined Date</span></label>
                </div>
              </div>
              
              {/* Financial Columns */}
              <div className="mb-3">
                <h5 className="text-xs font-medium text-gray-600 mb-1">Financial Details</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.bankAccount} onChange={() => toggleColumn("bankAccount")} /><span>Bank Account</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.ifsc} onChange={() => toggleColumn("ifsc")} /><span>IFSC Code</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.upi} onChange={() => toggleColumn("upi")} /><span>UPI ID</span></label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visibleColumns.dailyRate} onChange={() => toggleColumn("dailyRate")} /><span>Daily Rate</span></label>
                </div>
              </div>
              
              {/* Extra Fields */}
              {allExtraFields.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-1">Additional Fields</h5>
                  <div className="mb-2">
                    <input type="text" placeholder="Search fields..." value={extraFieldSearch} onChange={(e) => setExtraFieldSearch(e.target.value)} className="w-full border border-gray-300 rounded-md p-1 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {filteredExtraFields.map(field => (
                      <label key={field} className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={extraFieldsVisibility[field] || false} onChange={() => toggleExtraField(field)} />
                        <span>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-2 text-center border border-gray-100"><p className="text-xs text-gray-500">Total Workers</p><p className="text-lg font-bold text-gray-800">{data.length}</p></div>
            <div className="bg-white rounded-lg p-2 text-center border border-gray-100"><p className="text-xs text-gray-500">Active Workers</p><p className="text-lg font-bold text-green-600">{totalActive}</p></div>
            <div className="bg-white rounded-lg p-2 text-center border border-gray-100"><p className="text-xs text-gray-500">Inactive Workers</p><p className="text-lg font-bold text-red-600">{totalInactive}</p></div>
            {/* <div className="bg-white rounded-lg p-2 text-center border border-gray-100"><p className="text-xs text-gray-500">Average Salary</p><p className="text-lg font-bold text-blue-600">₹{formatNumber(avgSalary)}</p></div> */}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 text-center"><p className="text-xs text-blue-600">Total Monthly Salary</p><p className="text-xl font-bold text-blue-700">₹{formatNumber(data.reduce((sum, w) => sum + (w.wages?.monthly || 0), 0))}</p></div> */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 text-center"><p className="text-xs text-green-600">Workers with Bank Account</p><p className="text-xl font-bold text-green-700">{data.filter(w => w.bank?.accountNumber).length}</p></div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 text-center"><p className="text-xs text-purple-600">Workers with UPI</p><p className="text-xl font-bold text-purple-700">{data.filter(w => w.upi?.id).length}</p></div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 text-center"><p className="text-xs text-orange-600">Workers with Aadhaar</p><p className="text-xl font-bold text-orange-700">{data.filter(w => w.aadhaar).length}</p></div>
        </div>
        
        {/* Download Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAllWorkers} className="rounded" />
                <span className="text-xs font-medium">Select All</span>
              </label>
              <span className="text-xs text-gray-500">{getSelectedCount()} worker(s) selected</span>
            </div>
            
            <div className="flex gap-2">
              <select
                value={downloadType}
                onChange={(e) => setDownloadType(e.target.value)}
                className="border border-gray-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="full">📄 Full Report (PDF)</option>
                <option value="aadhaar">🆔 Aadhaar Cards Only (ZIP)</option>
                <option value="profile">🖼️ Profile Photos Only (ZIP)</option>
                <option value="both">📦 Both Documents (ZIP)</option>
              </select>
              <button
                onClick={handleDownload}
                disabled={downloading || getSelectedCount() === 0}
                className="bg-purple-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {Math.round(downloadProgress)}%
                  </>
                ) : (
                  "📥 Download"
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Workers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-8">
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAllWorkers} className="rounded" />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-8"></th>
                {visibleColumns.worker && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Worker</th>}
                {visibleColumns.designation && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Designation</th>}
                {visibleColumns.salary && <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Salary</th>}
                {visibleColumns.phone && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phone</th>}
                {visibleColumns.status && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>}
                {visibleColumns.photo && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Photo</th>}
                {visibleColumns.experience && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Experience</th>}
                {visibleColumns.aadhaar && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Aadhaar</th>}
                {visibleColumns.employeeId && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Employee ID</th>}
                {visibleColumns.joinedDate && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Joined Date</th>}
                {visibleColumns.bankAccount && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Bank Account</th>}
                {visibleColumns.ifsc && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">IFSC</th>}
                {visibleColumns.upi && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">UPI ID</th>}
                {visibleColumns.dailyRate && <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Daily Rate</th>}
                {allExtraFields.map(field => extraFieldsVisibility[field] && (
                  <th key={field} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </th>
                ))}</tr>
               </thead>
            <tbody>
              {data.map(worker => {
                const isExpanded = expandedRows[worker._id];
                const hasExtraFields = worker.extraFields && Object.keys(worker.extraFields).length > 0;
                const hasBankDetails = worker.bank?.accountNumber || worker.bank?.ifsc;
                const hasUPI = worker.upi?.id;
                const hasAadhaar = worker.aadhaar;
                const hasPhotos = worker.profilePhoto || worker.aadhaarPhoto;

                return (
                  <React.Fragment key={worker._id}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={selectedWorkersForDownload.includes(worker._id)} onChange={() => toggleSelectWorker(worker._id)} className="rounded" />
                        </td>
                      <td className="px-3 py-2">
                        {(hasExtraFields || hasBankDetails || hasUPI || hasAadhaar || hasPhotos) && (
                          <button onClick={() => toggleExpand(worker._id)} className="text-gray-500 hover:text-gray-700">
                            {isExpanded ? '▼' : '▶'}
                          </button>
                        )}
                        </td>
                      {visibleColumns.worker && <td className="px-3 py-2 text-xs font-medium">{worker.name}</td>}
                      {visibleColumns.designation && <td className="px-3 py-2 text-xs">{worker.designation}</td>}
                      {visibleColumns.salary && <td className="px-3 py-2 text-xs text-right text-green-600">₹{formatNumber(worker.wages?.monthly)}</td>}
                      {visibleColumns.phone && <td className="px-3 py-2 text-xs">{worker.phone}</td>}
                      {visibleColumns.status && (
                        <td className="px-3 py-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${worker.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {worker.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                      )}
                      {visibleColumns.photo && (
                        <td className="px-3 py-2 text-xs">
                          {worker.profilePhoto ? (
                            <button onClick={() => viewPhoto(worker.profilePhoto)} className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 hover:border-blue-500 transition">
                              <img src={worker.profilePhoto} alt={worker.name} className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                              {worker.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.experience && <td className="px-3 py-2 text-xs">{worker.experience || 0} yrs</td>}
                      {visibleColumns.aadhaar && <td className="px-3 py-2 text-xs font-mono">{formatAadhaar(worker.aadhaar)}</td>}
                      {visibleColumns.employeeId && <td className="px-3 py-2 text-xs font-mono">{worker._id?.slice(-8)}</td>}
                      {visibleColumns.joinedDate && <td className="px-3 py-2 text-xs">{new Date(worker.createdAt).toLocaleDateString()}</td>}
                      {visibleColumns.bankAccount && <td className="px-3 py-2 text-xs font-mono">{worker.bank?.accountNumber || "-"}</td>}
                      {visibleColumns.ifsc && <td className="px-3 py-2 text-xs">{worker.bank?.ifsc || "-"}</td>}
                      {visibleColumns.upi && <td className="px-3 py-2 text-xs">{worker.upi?.id || "-"}</td>}
                      {visibleColumns.dailyRate && <td className="px-3 py-2 text-xs text-right">₹{formatNumber((worker.wages?.monthly / (worker.wages?.calculationDays || 30)).toFixed(2))}</td>}
                      {allExtraFields.map(field => extraFieldsVisibility[field] && (
                        <td key={field} className="px-3 py-2 text-xs">{getExtraFieldValue(worker, field)}</td>
                      ))}
                    </tr>
                    
                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={getVisibleColumnsCount() + 2} className="px-4 py-3">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Worker Details - {worker.name}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-xs font-semibold text-blue-600 mb-2">Personal Information</h5>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between"><span className="text-gray-600">Experience:</span><span className="font-medium">{worker.experience || 0} years</span></div>
                                  <div className="flex justify-between"><span className="text-gray-600">Aadhaar Number:</span><span className="font-mono">{formatAadhaar(worker.aadhaar)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-600">Employee ID:</span><span className="font-mono">{worker._id}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-600">Joined Date:</span><span>{new Date(worker.createdAt).toLocaleDateString()}</span></div>
                                </div>
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-green-600 mb-2">Bank Details</h5>
                                <div className="space-y-1 text-xs">
                                  {hasBankDetails ? (
                                    <>
                                      <div className="flex justify-between"><span className="text-gray-600">Account Number:</span><span className="font-mono">{worker.bank?.accountNumber || "Not provided"}</span></div>
                                      <div className="flex justify-between"><span className="text-gray-600">IFSC Code:</span><span className="font-mono">{worker.bank?.ifsc || "Not provided"}</span></div>
                                      <div className="flex justify-between"><span className="text-gray-600">UPI ID:</span><span>{worker.upi?.id || "Not provided"}</span></div>
                                    </>
                                  ) : <p className="text-gray-400">No bank details available</p>}
                                </div>
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-orange-600 mb-2">Salary Details</h5>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between"><span className="text-gray-600">Monthly Salary:</span><span className="font-semibold text-green-600">₹{formatNumber(worker.wages?.monthly)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-600">Calculation Days:</span><span>{worker.wages?.calculationDays || 30} days</span></div>
                                  <div className="flex justify-between"><span className="text-gray-600">Daily Rate:</span><span>₹{formatNumber((worker.wages?.monthly / (worker.wages?.calculationDays || 30)).toFixed(2))}</span></div>
                                </div>
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-purple-600 mb-2">Documents</h5>
                                <div className="flex flex-wrap gap-2">
                                  {worker.profilePhoto && <button onClick={() => viewPhoto(worker.profilePhoto)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">🖼️ View Profile Photo</button>}
                                  {worker.aadhaarPhoto && <button onClick={() => viewPhoto(worker.aadhaarPhoto)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">📄 View Aadhaar Card</button>}
                                  {!worker.profilePhoto && !worker.aadhaarPhoto && <p className="text-gray-400 text-xs">No documents uploaded</p>}
                                </div>
                              </div>
                            </div>
                            {hasExtraFields && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <h5 className="text-xs font-semibold text-gray-600 mb-2">Additional Information</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {Object.entries(worker.extraFields).map(([key, value]) => (
                                    <div key={key} className="bg-gray-50 rounded-lg p-2">
                                      <p className="text-xs font-semibold text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                      <p className="text-sm text-gray-800 break-words">{value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <button onClick={() => window.location.href = `/salary?workerId=${worker._id}`} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">📊 View Salary History</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPhotoModal(false)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 z-10">✕</button>
            <img src={selectedPhoto} alt="Document" className="max-w-full max-h-[85vh] object-contain" />
            <div className="p-2 bg-gray-100 text-center text-xs text-gray-700">Worker Document</div>
          </div>
        </div>
      )}
    </>
  );
}