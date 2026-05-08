import React, { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import API from "../api/api";
import ReportControls from "../components/reports/ReportControls";
import SalaryReport from "../components/reports/SalaryReport";
import AdvanceReport from "../components/reports/AdvanceReport";
import AttendanceReport from "../components/reports/AttendanceReport";
import WorkerReport from "../components/reports/WorkerReport";

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [companyDetails, setCompanyDetails] = useState({});
  const [workers, setWorkers] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState("portrait");
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWorker, setFilterWorker] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  
  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Report type options
  const reportOptions = [
    {
      id: "salary",
      title: "Salary Report",
      description: "View monthly salary details, deductions, and net payments",
      icon: "💰",
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700"
    },
    {
      id: "advance",
      title: "Advance & Loan Report",
      description: "Track monthly advances, loans, and repayment history",
      icon: "📊",
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700"
    },
    {
      id: "attendance",
      title: "Attendance Report",
      description: "View worker attendance, presents, holidays, and overtime",
      icon: "📅",
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700"
    },
    {
      id: "worker",
      title: "Worker Report",
      description: "Complete worker directory with contact and wage details",
      icon: "👥",
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCompanyDetails();
    fetchWorkers();
  }, []);

  // Generate report only when shouldGenerate is true
  useEffect(() => {
    if (reportType && workers.length > 0 && shouldGenerate) {
      generateReport();
      setShouldGenerate(false);
    }
  }, [reportType, selectedMonth, selectedYear, filterStatus, filterWorker, filterType, debouncedSearchTerm, workers, shouldGenerate]);

  const fetchCompanyDetails = async () => {
    try {
      const res = await API.get("/auth/company-details");
      setCompanyDetails(res.data.companyDetails || {});
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await API.get("/employees");
      setWorkers(res.data);
    } catch (err) {
      console.error("Error fetching workers:", err);
    }
  };

  const fetchSalaryReport = useCallback(async () => {
    setLoading(true);
    setReportData(null);
    try {
      const res = await API.get(`/salary/monthly?month=${selectedMonth}&year=${selectedYear}`);
      let data = res.data;
      
      if (filterWorker !== "all") {
        data = data.filter(s => s.workerId?._id === filterWorker);
      }
      if (filterStatus !== "all") {
        data = data.filter(s => s.status === filterStatus);
      }
      if (debouncedSearchTerm) {
        data = data.filter(s => 
          s.workerId?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          s.workerId?.designation?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
      }
      
      setReportData({
        type: "salary",
        month: selectedMonth,
        year: selectedYear,
        data: data,
        filters: { status: filterStatus, worker: filterWorker, searchTerm: debouncedSearchTerm }
      });
    } catch (err) {
      console.error("Error fetching salary report:", err);
      alert("Error fetching salary report");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, filterWorker, filterStatus, debouncedSearchTerm]);

  const fetchAdvanceReport = useCallback(async () => {
    setLoading(true);
    setReportData(null);
    try {
      let results = [];
      let workersToProcess = workers;
      
      if (filterWorker !== "all") {
        workersToProcess = workers.filter(w => w._id === filterWorker);
      }
      if (debouncedSearchTerm) {
        workersToProcess = workersToProcess.filter(w => 
          w.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          w.designation.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
      }
      
      for (const worker of workersToProcess) {
        const res = await API.get(`/advance/worker/${worker._id}`);
        let advances = res.data || [];
        
        if (filterType !== "all") {
          advances = advances.filter(a => a.type === filterType);
        }
        
        if (advances.length > 0) {
          results.push({
            worker: worker,
            advances: advances
          });
        }
      }
      
      setReportData({
        type: "advance",
        data: results,
        filters: { type: filterType, worker: filterWorker, searchTerm: debouncedSearchTerm }
      });
    } catch (err) {
      console.error("Error fetching advance report:", err);
      alert("Error fetching advance report");
    } finally {
      setLoading(false);
    }
  }, [workers, filterWorker, filterType, debouncedSearchTerm]);

  const fetchAttendanceReport = useCallback(async () => {
    setLoading(true);
    setReportData(null);
    try {
      const results = [];
      let workersToProcess = workers;
      
      if (filterWorker !== "all") {
        workersToProcess = workers.filter(w => w._id === filterWorker);
      }
      if (debouncedSearchTerm) {
        workersToProcess = workersToProcess.filter(w => 
          w.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          w.designation.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
      }
      
      for (const worker of workersToProcess) {
        const res = await API.get(
          `/attendance?workerId=${worker._id}&month=${selectedMonth}&year=${selectedYear}`
        );
        const attendanceData = res.data.data || res.data || [];
        const finalAttendance = Array.isArray(attendanceData) ? attendanceData : [];

        if (finalAttendance.length > 0) {
          results.push({
            worker: worker,
            attendance: finalAttendance
          });
        }
      }
      
      setReportData({
        type: "attendance",
        month: selectedMonth,
        year: selectedYear,
        data: results,
        filters: { worker: filterWorker, searchTerm: debouncedSearchTerm }
      });
    } catch (err) {
      console.error("Error fetching attendance report:", err);
      alert("Error fetching attendance report");
    } finally {
      setLoading(false);
    }
  }, [workers, selectedMonth, selectedYear, filterWorker, debouncedSearchTerm]);

  const fetchWorkerReport = useCallback(async () => {
    setLoading(true);
    setReportData(null);
    try {
      let filteredWorkers = workers;
      
      if (filterStatus !== "all") {
        filteredWorkers = filteredWorkers.filter(w => w.status === filterStatus);
      }
      if (filterWorker !== "all") {
        filteredWorkers = filteredWorkers.filter(w => w._id === filterWorker);
      }
      if (debouncedSearchTerm) {
        filteredWorkers = filteredWorkers.filter(w => 
          w.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          w.designation.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
      }
      
      setReportData({
        type: "worker",
        data: filteredWorkers,
        totalActive: filteredWorkers.filter(w => w.status === "active").length,
        totalInactive: filteredWorkers.filter(w => w.status === "inactive").length,
        totalSalary: filteredWorkers.reduce((sum, w) => sum + (w.wages?.monthly || 0), 0),
        avgSalary: filteredWorkers.length > 0 ? filteredWorkers.reduce((sum, w) => sum + (w.wages?.monthly || 0), 0) / filteredWorkers.length : 0,
        filters: { status: filterStatus, worker: filterWorker, searchTerm: debouncedSearchTerm }
      });
    } catch (err) {
      console.error("Error fetching worker report:", err);
      alert("Error fetching worker report");
    } finally {
      setLoading(false);
    }
  }, [workers, filterStatus, filterWorker, debouncedSearchTerm]);

  const generateReport = useCallback(() => {
    switch(reportType) {
      case "salary":
        fetchSalaryReport();
        break;
      case "advance":
        fetchAdvanceReport();
        break;
      case "attendance":
        fetchAttendanceReport();
        break;
      case "worker":
        fetchWorkerReport();
        break;
      default:
        break;
    }
  }, [reportType, fetchSalaryReport, fetchAdvanceReport, fetchAttendanceReport, fetchWorkerReport]);

  const handleReportTypeSelect = (type) => {
    setReportType(type);
    setReportData(null);
    setShouldGenerate(false);
    setFilterStatus("all");
    setFilterWorker("all");
    setFilterType("all");
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  const handleGenerateReport = () => {
    if (!reportType) {
      alert("Please select a report type first");
      return;
    }
    setReportData(null);
    setShouldGenerate(true);
  };

  const handleBackToSelection = () => {
    setReportType(null);
    setReportData(null);
    setShouldGenerate(false);
    setFilterStatus("all");
    setFilterWorker("all");
    setFilterType("all");
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  const downloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    setDownloading(true);
    setDownloadProgress(10);
    
    try {
      const originalWidth = element.scrollWidth;
      const originalHeight = element.scrollHeight;
      
      setDownloadProgress(20);
      
      const isLandscape = pdfOrientation === "landscape";
      const pdfWidth = isLandscape ? 297 : 210;
      const pdfHeight = isLandscape ? 210 : 297;
      
      const scale = (pdfWidth - 20) / originalWidth;
      const contentHeight = originalHeight * scale;
      
      setDownloadProgress(30);
      
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: originalWidth,
        windowHeight: originalHeight,
        onclone: (clonedDoc, element) => {
          element.style.overflow = 'visible';
        }
      });
      
      setDownloadProgress(60);
      const imgData = canvas.toDataURL('image/png');
      
      setDownloadProgress(70);
      
      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: 'mm',
        format: 'a4',
        compress: true,
        hotfixes: ['px_scaling']
      });
      
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let position = 0;
      let pageHeight = pdfHeight - 20;
      let heightLeft = imgHeight;
      
      pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      
      let pageNum = 1;
      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
        pageNum++;
      }
      
      setDownloadProgress(90);
      const filterText = getFilterText();
      pdf.save(`${reportData?.type?.toUpperCase() || 'REPORT'}_Report_${filterText}_${new Date().toLocaleDateString()}.pdf`);
      
      setDownloadProgress(100);
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Please try again.");
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handlePrint = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const originalOverflow = document.body.style.overflow;
    const originalPadding = document.body.style.padding;
    
    document.body.style.overflow = 'auto';
    document.body.style.padding = '0';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print");
      return;
    }
    
    const content = element.cloneNode(true);
    
    const styles = `
      <style>
        @media print {
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          table {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-page-break {
            page-break-before: always;
            break-before: page;
          }
          * {
            overflow: visible !important;
          }
          .table-container {
            overflow: visible !important;
          }
        }
        @page {
          size: ${pdfOrientation === "landscape" ? "landscape" : "portrait"};
          margin: 15mm;
        }
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
      </style>
    `;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${getTitle()}</title>
        ${styles}
      </head>
      <body>
        ${content.outerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
        document.body.style.overflow = originalOverflow;
        document.body.style.padding = originalPadding;
      };
    };
  };

  const getFilterText = () => {
    const parts = [];
    if (filterStatus !== "all") parts.push(filterStatus);
    if (filterWorker !== "all") {
      const worker = workers.find(w => w._id === filterWorker);
      parts.push(worker?.name || "selected");
    }
    if (filterType !== "all") parts.push(filterType);
    if (searchTerm) parts.push(searchTerm);
    if (selectedMonth && (reportType === "salary" || reportType === "attendance")) {
      parts.push(getMonthName(selectedMonth));
      parts.push(selectedYear);
    }
    return parts.length ? parts.join('_') : "full";
  };

  const getMonthName = (month) => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[month - 1];
  };

  const getTitle = () => {
    if (!reportData) return "";
    const filterInfo = getFilterText();
    switch(reportData.type) {
      case "salary": return `Salary Report${filterInfo !== "full" ? ` - ${filterInfo}` : ""} - ${getMonthName(reportData.month)} ${reportData.year}`;
      case "advance": return `Advance Report${filterInfo !== "full" ? ` - ${filterInfo}` : ""}`;
      case "attendance": return `Attendance Report${filterInfo !== "full" ? ` - ${filterInfo}` : ""} - ${getMonthName(reportData.month)} ${reportData.year}`;
      case "worker": return `Worker Report${filterInfo !== "full" ? ` - ${filterInfo}` : ""}`;
      default: return "Report";
    }
  };

  const resetFilters = () => {
    setFilterStatus("all");
    setFilterWorker("all");
    setFilterType("all");
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  const renderFilterSection = () => {
    if (!reportType) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleBackToSelection}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              ← Change Report Type
            </button>
            {(filterStatus !== "all" || filterWorker !== "all" || filterType !== "all" || searchTerm) && (
              <button
                onClick={resetFilters}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {showFilters && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Worker</label>
              <select
                value={filterWorker}
                onChange={(e) => setFilterWorker(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Workers</option>
                {workers.map(worker => (
                  <option key={worker._id} value={worker._id}>{worker.name}</option>
                ))}
              </select>
            </div>
            
            {(reportType === "worker" || reportType === "salary") && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  {reportType === "salary" && (
                    <>
                      <option value="paid">Paid</option>
                      <option value="processed">Processed</option>
                    </>
                  )}
                </select>
              </div>
            )}
            
            {reportType === "advance" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Advance Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="monthly">Monthly Advance</option>
                  <option value="loan">Loan</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderReportTypeCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {reportOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => handleReportTypeSelect(option.id)}
            className={`${option.bgColor} border ${option.borderColor} rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 transform`}
          >
            <div className={`w-16 h-16 ${option.bgColor} rounded-full flex items-center justify-center mb-4 mx-auto border-2 ${option.borderColor}`}>
              <span className="text-3xl">{option.icon}</span>
            </div>
            <h3 className={`text-lg font-bold ${option.textColor} text-center mb-2`}>{option.title}</h3>
            <p className="text-xs text-gray-500 text-center">{option.description}</p>
            <div className={`mt-4 text-center text-xs font-medium ${option.textColor} opacity-75`}>
              Click to select →
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch(reportData.type) {
      case "salary":
        return <SalaryReport data={reportData.data} filters={reportData.filters} />;
      case "advance":
        return <AdvanceReport data={reportData.data} filters={reportData.filters} />;
      case "attendance":
        return (
          <AttendanceReport
            data={reportData.data}
            month={reportData.month}
            year={reportData.year}
            isLoading={loading}
          />
        );
      case "worker":
        return <WorkerReport 
          data={reportData.data} 
          totalActive={reportData.totalActive}
          totalInactive={reportData.totalInactive}
          avgSalary={reportData.avgSalary}
          filters={reportData.filters}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Reports Dashboard</h1>
          <p className="text-sm text-gray-500">Select a report type, set filters, and click Generate to view report</p>
        </div>

        {/* Report Type Selection Cards */}
        {!reportType && renderReportTypeCards()}

        {/* Report Controls - Only show when report type is selected */}
        {reportType && (
          <div className="mb-4">
            <ReportControls
              reportType={reportType}
              onReportTypeChange={(type) => {
                handleReportTypeSelect(type);
              }}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              loading={loading}
            />
            
            {/* Generate Button */}
            <div className="mt-3 flex justify-start">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Report 
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Filter Section - Only show when report type is selected */}
        {renderFilterSection()}

        {/* Loading Indicator */}
        {loading && !reportData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-4">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Generating report... Please wait</p>
            </div>
          </div>
        )}

        {/* Report Content */}
        {reportData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">{getTitle()}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Last updated: {new Date().toLocaleTimeString('en-IN')}</p>
              </div>
              <div className="flex gap-2">
                {/* Orientation Selector */}
                <select
                  value={pdfOrientation}
                  onChange={(e) => setPdfOrientation(e.target.value)}
                  className="bg-gray-100 border border-gray-300 rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
                  disabled={downloading}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
                
                {/* Print Button */}
                <button
                  onClick={handlePrint}
                  disabled={downloading}
                  className="bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-700 transition flex items-center gap-1 disabled:opacity-50"
                >
                  🖨️ Print
                </button>
                
                {/* Download PDF Button */}
                <button
                  onClick={downloadPDF}
                  disabled={downloading}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {downloadProgress}%
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PDF
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Download Progress Bar */}
            {downloading && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{Math.round(downloadProgress)}%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center">Generating PDF with multiple pages...</p>
              </div>
            )}
            
            <div id="report-content" className="p-4" style={{ overflow: 'visible' }}>
              {/* Company Header */}
              <div className="text-center mb-6 pb-4 border-b border-gray-200">
                {companyDetails.logo && (
                  <img src={companyDetails.logo} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
                )}
                <h1 className="text-xl font-bold text-gray-800">{companyDetails.name || "Business Manager"}</h1>
                <div className="text-xs text-gray-500 mt-1">
                  {companyDetails.phone && <span>📞 {companyDetails.phone}</span>}
                  {companyDetails.phone && companyDetails.email && <span className="mx-2">|</span>}
                  {companyDetails.email && <span>✉️ {companyDetails.email}</span>}
                </div>
                {companyDetails.address && (
                  <p className="text-xs text-gray-500 mt-1">📍 {companyDetails.address}</p>
                )}
                {companyDetails.gst && (
                  <p className="text-xs text-gray-400 mt-1">GST: {companyDetails.gst}</p>
                )}
                <div className="mt-3">
                  <h2 className="text-base font-semibold text-blue-600">{getTitle()}</h2>
                  {(filterStatus !== "all" || filterWorker !== "all" || filterType !== "all" || searchTerm) && (
                    <div className="mt-2 flex flex-wrap gap-2 justify-center">
                      {filterStatus !== "all" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          Status: {filterStatus}
                        </span>
                      )}
                      {filterWorker !== "all" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          Worker: {workers.find(w => w._id === filterWorker)?.name}
                        </span>
                      )}
                      {filterType !== "all" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                          Type: {filterType === "monthly" ? "Monthly Advance" : "Loan"}
                        </span>
                      )}
                      {searchTerm && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                          Search: {searchTerm}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {renderReportContent()}
              
              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>This is a computer-generated report. For any queries, contact administration.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty State - No Report Selected */}
        {!reportType && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Choose a Report Type</h3>
            <p className="text-sm text-gray-500">Click on any card above to select a report type, then click Generate Report</p>
          </div>
        )}
      </div>
    </div>
  );
}