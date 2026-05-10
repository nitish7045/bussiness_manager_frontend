// src/pages/SalaryManagement.js
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import API from "../api/api";
import SalaryHeader from "../components/salary/SalaryHeader";
import PeriodSelector from "../components/salary/PeriodSelector";
import WorkerSelector from "../components/salary/WorkerSelector";
import SalaryReviewTable from "../components/salary/SalaryReviewTable";
import SalaryHistoryTable from "../components/salary/SalaryHistoryTable";
import SalaryHistoryModal from "../components/salary/SalaryHistoryModal";
import SalarySlip from "../components/salary/SalarySlip";
import BulkSalaryDownload from "../components/salary/BulkSalaryDownload";
import whatsappService from "../services/whatsappService";

export default function SalaryManagement() {
  const location = useLocation();
  
  // Check if we're in edit mode from navigation state
  const editMode = location.state?.editMode || false;
  const editSalaryData = location.state?.salary || null;
  const editMonth = location.state?.month || new Date().getMonth() + 1;
  const editYear = location.state?.year || new Date().getFullYear();
  const editWorkerId = location.state?.workerId || null;

  // State declarations
  const [workers, setWorkers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(editMonth);
  const [selectedYear, setSelectedYear] = useState(editYear);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [salaryData, setSalaryData] = useState([]);
  const [showReview, setShowReview] = useState(editMode);
  const [processedSalaries, setProcessedSalaries] = useState([]);
  const [activeTab, setActiveTab] = useState(editMode ? "calculate" : "calculate");
  const [selectedWorkerForHistory, setSelectedWorkerForHistory] = useState(null);
  const [workerHistory, setWorkerHistory] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState(editWorkerId ? [editWorkerId] : []);
  const [selectAll, setSelectAll] = useState(false);
  
  // Salary slip states
  const [showSalarySlip, setShowSalarySlip] = useState(false);
  const [selectedSalaryForSlip, setSelectedSalaryForSlip] = useState(null);
  const [selectedWorkerForSlip, setSelectedWorkerForSlip] = useState(null);
  
  // Bulk download states
  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [companyDetails, setCompanyDetails] = useState({});
  
  // WhatsApp bulk send states
  const [showWhatsAppSender, setShowWhatsAppSender] = useState(false);
  const [whatsAppItems, setWhatsAppItems] = useState([]);
  const [whatsAppType, setWhatsAppType] = useState("full_text");
  
  // Loader states
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, workerName: "" });

  // ==================== Helper Functions ====================
  
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  const getMonthName = (month) => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[month - 1];
  };

  const numberToWords = (num) => {
    if (num === 0 || num === null || num === undefined) return "Zero Rupees Only";
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const numToWords = (n) => {
      if (n < 20) return ones[n];
      const digit = n % 10;
      return tens[Math.floor(n / 10)] + (digit ? " " + ones[digit] : "");
    };
    
    const getLakhsCrores = (n) => {
      let str = "";
      const crore = Math.floor(n / 10000000);
      if (crore > 0) {
        str += numToWords(crore) + " Crore ";
        n %= 10000000;
      }
      const lakh = Math.floor(n / 100000);
      if (lakh > 0) {
        str += numToWords(lakh) + " Lakh ";
        n %= 100000;
      }
      const thousand = Math.floor(n / 1000);
      if (thousand > 0) {
        str += numToWords(thousand) + " Thousand ";
        n %= 1000;
      }
      const hundred = Math.floor(n / 100);
      if (hundred > 0) {
        str += numToWords(hundred) + " Hundred ";
        n %= 100;
      }
      if (n > 0) {
        str += numToWords(n);
      }
      return str.trim();
    };
    
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    
    let result = "";
    if (rupees > 0) {
      result += getLakhsCrores(rupees) + " Rupees";
    }
    if (paise > 0) {
      result += (rupees > 0 ? " and " : "") + numToWords(paise) + " Paise";
    }
    return result + " Only";
  };

  // Generate HTML that matches SalarySlip exactly for PDF
  const generateSalarySlipHTML = (salary, worker) => {
    const monthName = getMonthName(salary.month);
    const basePay = worker.wages?.monthly || worker.monthlySalary || 0;
    const dailySalary = salary.dailySalary || (basePay / 30);
    const hourlySalary = dailySalary / 8;
    const totalDaysInMonth = new Date(salary.year, salary.month, 0).getDate();
    const totalPresentDays = (salary.attendance?.weekdayPresent || 0) + (salary.attendance?.sundayPresent || 0);
    const leaveDays = totalDaysInMonth - totalPresentDays - (salary.attendance?.halfDays || 0);
    const netSalaryInWords = numberToWords(salary.netSalary || 0);
    
    const formatNum = (num) => {
      if (num === undefined || num === null) return "0";
      return num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };
    
    const formatNumDec = (num) => {
      if (num === undefined || num === null) return "0";
      return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    // Generate earnings rows
    let earningsRows = `
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px; width: 70%;">
              <div style="color: #4b5563;">Weekday Present</div>
              <div style="font-size: 11px; color: #9ca3af;">${salary.attendance?.weekdayPresent || 0} × ₹${formatNumDec(dailySalary)}</div>
            </td>
            <td style="padding: 12px 16px; text-align: right; width: 30%; font-weight: 600;">₹${formatNumDec(salary.earnings?.weekdayPay)}</td>
          </tr>
    `;
    
    if (salary.attendance?.weekdayHalf > 0) {
      earningsRows += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px;">
              <div style="color: #4b5563;">Weekday Half Day</div>
              <div style="font-size: 11px; color: #9ca3af;">${salary.attendance?.weekdayHalf} × ₹${formatNumDec(dailySalary * 0.5)}</div>
            </td>
            <td style="padding: 12px 16px; text-align: right;">₹${formatNumDec(salary.earnings?.weekdayHalfPay)}</td>
          </tr>
      `;
    }
    
    if (salary.attendance?.sundayPresent > 0) {
      earningsRows += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px;">
              <div style="color: #4b5563;">Sunday Present (Double Pay)</div>
              <div style="font-size: 11px; color: #9ca3af;">${salary.attendance?.sundayPresent} × ₹${formatNumDec(dailySalary * 2)}</div>
            </td>
            <td style="padding: 12px 16px; text-align: right;">₹${formatNumDec(salary.earnings?.sundayPresentPay)}</td>
          </tr>
      `;
    }
    
    if (salary.attendance?.sundayHalf > 0) {
      earningsRows += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px;">
              <div style="color: #4b5563;">Sunday Half Day (1.5x)</div>
              <div style="font-size: 11px; color: #9ca3af;">${salary.attendance?.sundayHalf} × ₹${formatNumDec(dailySalary * 1.5)}</div>
            </td>
            <td style="padding: 12px 16px; text-align: right;">₹${formatNumDec(salary.earnings?.sundayHalfPay)}</td>
          </tr>
      `;
    }
    
    if (salary.attendance?.sundayHoliday > 0) {
      earningsRows += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px;">
              <div style="color: #4b5563;">Sunday Holiday</div>
              <div style="font-size: 11px; color: #9ca3af;">${salary.attendance?.sundayHoliday} × ₹${formatNumDec(dailySalary)}</div>
            </td>
            <td style="padding: 12px 16px; text-align: right;">₹${formatNumDec(salary.earnings?.sundayHolidayPay)}</td>
          </tr>
      `;
    }
    
    if (salary.attendance?.otherHolidays > 0) {
      earningsRows += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px;">
              <div style="color: #4b5563;">Other Holidays</div>
              <div style="font-size: 11px; color: #9ca3af;">${salary.attendance?.otherHolidays} × ₹${formatNumDec(dailySalary)}</div>
            </td>
            <td style="padding: 12px 16px; text-align: right;">₹${formatNumDec(salary.earnings?.otherHolidayPay)}</td>
          </tr>
      `;
    }
    
    if (salary.attendance?.overtimeHours > 0) {
      earningsRows += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px;">
              <div style="color: #4b5563;">Overtime</div>
              <div style="font-size: 11px; color: #9ca3af;">${salary.attendance?.overtimeHours} hrs × ₹${formatNumDec(hourlySalary)}</div>
            </td>
            <td style="padding: 12px 16px; text-align: right;">₹${formatNumDec(salary.earnings?.overtimePay)}</td>
          </tr>
      `;
    }
    
    earningsRows += `
          <tr style="background-color: #f0fdf4;">
            <td style="padding: 12px 16px; font-weight: 600; color: #1f2937;">Total Earnings</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #16a34a;">₹${formatNumDec(salary.earnings?.totalEarnings)}</td>
          </tr>
        </tbody>
      </table>
    `;
    
    // Generate deductions rows
    let deductionsRows = `
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
    `;
    
    if (salary.deductions?.monthlyAdvanceDeducted > 0) {
      deductionsRows += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px; color: #4b5563; width: 70%;">Monthly Advance Deduction</td>
            <td style="padding: 12px 16px; text-align: right; color: #dc2626; width: 30%;">-₹${formatNum(salary.deductions?.monthlyAdvanceDeducted)}</td>
          </tr>
      `;
    }
    
    if (salary.deductions?.loanDeducted > 0) {
      deductionsRows += `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 16px; color: #4b5563;">Loan Deduction</td>
            <td style="padding: 12px 16px; text-align: right; color: #dc2626;">-₹${formatNum(salary.deductions?.loanDeducted)}</td>
          </td>
      `;
    }
    
    deductionsRows += `
          <tr style="background-color: #fef2f2;">
            <td style="padding: 12px 16px; font-weight: 600; color: #1f2937;">Total Deductions</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #dc2626;">-₹${formatNum(salary.deductions?.totalDeductions)}</td>
          </tr>
        </tbody>
      </table>
    `;
    
    // Carry forward section
    let carryForwardSection = "";
    if (salary.carryForwardToNext?.monthlyAdvance > 0 || salary.carryForwardToNext?.loan > 0) {
      carryForwardSection = `
        <div style="margin-bottom: 24px; padding: 16px; background: #fff7ed; border-radius: 12px; border: 1px solid #fed7aa;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 18px;">⏩</span>
            <h4 style="font-size: 14px; font-weight: 600; color: #c2410c;">Carry Forward to Next Month</h4>
          </div>
          <div style="display: flex; gap: 24px; font-size: 13px;">
            ${salary.carryForwardToNext?.monthlyAdvance > 0 ? `<div><span style="color: #6b7280;">Monthly Advance:</span> <span style="font-weight: 600; color: #ea580c; margin-left: 8px;">₹${formatNum(salary.carryForwardToNext.monthlyAdvance)}</span></div>` : ''}
            ${salary.carryForwardToNext?.loan > 0 ? `<div><span style="color: #6b7280;">Loan:</span> <span style="font-weight: 600; color: #ea580c; margin-left: 8px;">₹${formatNum(salary.carryForwardToNext.loan)}</span></div>` : ''}
          </div>
        </div>
      `;
    }
    
    // Payment details section
    let paymentDetailsSection = "";
    if (salary.paymentDetails?.paidAt) {
      paymentDetailsSection = `
        <div style="margin-bottom: 24px; padding: 16px; background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 18px;">💳</span>
            <h4 style="font-size: 14px; font-weight: 600; color: #1d4ed8;">Payment Details</h4>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; font-size: 13px;">
            <div><span style="color: #6b7280;">Payment Date:</span> <span style="font-weight: 500; margin-left: 8px;">${new Date(salary.paymentDetails.paidAt).toLocaleDateString('en-IN')}</span></div>
            <div><span style="color: #6b7280;">Payment Method:</span> <span style="font-weight: 500; margin-left: 8px; text-transform: capitalize;">${salary.paymentDetails.paymentMethod}</span></div>
            ${salary.paymentDetails.paymentNotes ? `<div><span style="color: #6b7280;">Notes:</span> <span style="font-weight: 500; margin-left: 8px;">${salary.paymentDetails.paymentNotes}</span></div>` : ''}
          </div>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Salary Slip - ${worker.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: white; padding: 20px; }
          .salary-slip { max-width: 1000px; margin: 0 auto; background: white; border-radius: 16px; padding: 24px; }
          .text-center { text-align: center; }
          .border-bottom { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
          .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
          .bg-gray-50 { background: #f9fafb; }
          .bg-blue-50 { background: #eff6ff; }
          .bg-green-50 { background: #f0fdf4; }
          .bg-red-50 { background: #fef2f2; }
          .bg-purple-50 { background: #faf5ff; }
          .rounded-xl { border-radius: 12px; }
          .border { border: 1px solid #e5e7eb; }
          .border-l-4 { border-left-width: 4px; }
          .border-blue-500 { border-left-color: #3b82f6; }
          .border-green-500 { border-left-color: #22c55e; }
          .p-6 { padding: 24px; }
          .p-4 { padding: 16px; }
          .mb-6 { margin-bottom: 24px; }
          .mb-8 { margin-bottom: 32px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-3 { margin-top: 12px; }
          .text-xs { font-size: 11px; }
          .text-sm { font-size: 13px; }
          .text-base { font-size: 14px; }
          .text-lg { font-size: 16px; }
          .text-xl { font-size: 18px; }
          .text-2xl { font-size: 20px; }
          .text-3xl { font-size: 24px; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }
          .text-blue-600 { color: #2563eb; }
          .text-blue-700 { color: #1d4ed8; }
          .text-green-600 { color: #16a34a; }
          .text-green-700 { color: #15803d; }
          .text-red-600 { color: #dc2626; }
          .text-red-700 { color: #b91c1c; }
          .text-purple-600 { color: #9333ea; }
          .text-purple-700 { color: #7e22ce; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-700 { color: #374151; }
          .text-gray-800 { color: #1f2937; }
        </style>
      </head>
      <body>
        <div class="salary-slip">
          <!-- Company Header -->
          <div class="text-center border-bottom">
            ${companyDetails.logo ? `<img src="${companyDetails.logo}" style="height: 60px; object-fit: contain; margin: 0 auto 12px auto;" />` : ''}
            <h1 class="text-2xl font-bold text-gray-800 mb-2">${companyDetails.name || "Business Manager"}</h1>
            <div class="flex justify-center gap-6 text-sm text-gray-600 mt-2">
              ${companyDetails.phone ? `<span>📞 ${companyDetails.phone}</span>` : ''}
              ${companyDetails.email ? `<span>✉️ ${companyDetails.email}</span>` : ''}
            </div>
            ${companyDetails.address ? `<p class="text-sm text-gray-500 mt-1">📍 ${companyDetails.address}</p>` : ''}
            ${companyDetails.gst ? `<p class="text-xs text-gray-400 mt-1">GST: ${companyDetails.gst}</p>` : ''}
            <div class="mt-4">
              <p class="text-xl font-semibold text-blue-600">Salary Slip</p>
              <p class="text-sm text-gray-500">${monthName} ${salary.year}</p>
            </div>
          </div>

          <!-- Employee Details -->
          <div class="bg-gray-50 rounded-xl p-6 mb-8 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-700 mb-4 border-l-4 border-blue-500 pl-3">Employee Details</h3>
            <div class="grid-4">
              <div><p class="text-xs text-gray-500 mb-1">Employee Name</p><p class="text-base font-semibold text-gray-800">${worker.name}</p></div>
              <div><p class="text-xs text-gray-500 mb-1">Designation</p><p class="text-base font-semibold text-gray-800">${worker.designation || "N/A"}</p></div>
              <div><p class="text-xs text-gray-500 mb-1">Employee ID</p><p class="text-base font-mono text-gray-700">${worker._id?.slice(-8) || "N/A"}</p></div>
              <div><p class="text-xs text-gray-500 mb-1">Phone Number</p><p class="text-base text-gray-800">${worker.phone || "Not provided"}</p></div>
            </div>
          </div>

          <!-- Salary Summary Cards -->
          <div class="grid-4">
            <div class="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p class="text-xs text-blue-600 mb-1">Monthly Base Salary</p>
              <p class="text-2xl font-bold text-blue-700">₹${formatNum(basePay)}</p>
              <p class="text-xs text-gray-500 mt-1">Daily Rate: ₹${formatNum(dailySalary)}</p>
            </div>
            <div class="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <p class="text-xs text-green-600 mb-1">Total Earnings</p>
              <p class="text-2xl font-bold text-green-700">₹${formatNum(salary.earnings?.totalEarnings)}</p>
            </div>
            <div class="bg-red-50 rounded-xl p-4 text-center border border-red-100">
              <p class="text-xs text-red-600 mb-1">Total Deductions</p>
              <p class="text-2xl font-bold text-red-700">-₹${formatNum(salary.deductions?.totalDeductions)}</p>
            </div>
            <div class="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
              <p class="text-xs text-purple-600 mb-1">Net Salary Payable</p>
              <p class="text-2xl font-bold text-purple-700">₹${formatNum(salary.netSalary)}</p>
            </div>
          </div>

          <!-- Attendance Summary -->
          <div class="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 class="text-lg font-semibold text-gray-700 mb-4 border-l-4 border-green-500 pl-3">Attendance Summary</h3>
            <div class="grid-5">
              <div class="text-center"><div class="text-2xl font-bold text-green-600">${totalPresentDays}</div><div class="text-xs text-gray-500">Present Days</div></div>
              <div class="text-center"><div class="text-2xl font-bold text-orange-600">${salary.attendance?.weekdayHalf || 0}</div><div class="text-xs text-gray-500">Half Days</div></div>
              <div class="text-center"><div class="text-2xl font-bold text-red-600">${leaveDays}</div><div class="text-xs text-gray-500">Leave Days</div></div>
              <div class="text-center"><div class="text-2xl font-bold text-blue-600">${salary.attendance?.overtimeHours || 0}</div><div class="text-xs text-gray-500">Overtime Hours</div></div>
              <div class="text-center"><div class="text-2xl font-bold text-purple-600">${totalDaysInMonth}</div><div class="text-xs text-gray-500">Total Days</div></div>
            </div>
          </div>

          <!-- Earnings and Deductions Tables -->
          <div class="grid-2">
            <div class="border rounded-xl overflow-hidden">
              <div class="bg-green-50 px-4 py-3 border-b border-gray-200">
                <h3 class="text-md font-semibold text-green-700">Earnings</h3>
              </div>
              ${earningsRows}
            </div>

            <div class="border rounded-xl overflow-hidden">
              <div class="bg-red-50 px-4 py-3 border-b border-gray-200">
                <h3 class="text-md font-semibold text-red-700">Deductions</h3>
              </div>
              ${deductionsRows}
            </div>
          </div>

          <!-- Net Salary Section -->
          <div class="mb-6 p-6 bg-purple-50 rounded-xl border border-purple-200">
            <div class="text-center">
              <p class="text-sm font-semibold text-purple-700 mb-2">Net Salary Payable</p>
              <p class="text-3xl font-bold text-purple-700">₹${formatNum(salary.netSalary)}</p>
              <div class="mt-3 pt-3 border-t border-purple-200">
                <p class="text-xs text-purple-600 mb-1">Amount in Words</p>
                <p class="text-base font-medium text-purple-800 tracking-wide">${netSalaryInWords}</p>
              </div>
            </div>
          </div>

          ${carryForwardSection}
          ${paymentDetailsSection}

          <!-- Footer -->
          <div class="mt-6 pt-3 border-t border-gray-200 text-center">
            <p class="text-xs text-gray-400">This is a computer-generated document. No signature required.</p>
            <p class="text-xs text-gray-400 mt-1">Generated on: ${new Date().toLocaleString('en-IN')}</p>
            <div class="mt-3 flex justify-center gap-6 text-xs text-gray-400">
              <span>Thank you for your contribution!</span>
              <span>For any queries, contact HR</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Optimized PDF generation with loader
  // Generate PDF from HTML - FIXED version
const generatePDFFromSalarySlip = async (salary, worker) => {
  setIsGeneratingPDF(true);
  setPdfProgress({ current: 1, total: 1, workerName: worker.name });
  
  return new Promise(async (resolve, reject) => {
    try {
      const html = generateSalarySlipHTML(salary, worker);
      
      // Create an iframe for isolated rendering (better than div)
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '1000px';
      iframe.style.height = '800px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
      
      // Write HTML to iframe
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
      
      // Wait for images and fonts to load
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get the element from iframe
      const element = iframe.contentDocument.querySelector('.salary-slip');
      if (!element) {
        throw new Error('Salary slip element not found');
      }
      
      // Capture with html2canvas inside iframe
      const canvas = await html2canvas(element, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: 1000,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc, element) => {
          // Ensure all styles are applied
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: white; }
            .salary-slip { max-width: 1000px; margin: 0 auto; background: white; padding: 24px; }
            .text-center { text-align: center; }
            .border-bottom { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
            .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
            .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
            .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
            .bg-gray-50 { background: #f9fafb; }
            .bg-blue-50 { background: #eff6ff; }
            .bg-green-50 { background: #f0fdf4; }
            .bg-red-50 { background: #fef2f2; }
            .bg-purple-50 { background: #faf5ff; }
            .rounded-xl { border-radius: 12px; }
            .border { border: 1px solid #e5e7eb; }
            .p-6 { padding: 24px; }
            .p-4 { padding: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-8 { margin-bottom: 32px; }
            .text-xs { font-size: 11px; }
            .text-sm { font-size: 13px; }
            .text-base { font-size: 14px; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 18px; }
            .text-2xl { font-size: 20px; }
            .text-3xl { font-size: 24px; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .text-blue-600 { color: #2563eb; }
            .text-green-600 { color: #16a34a; }
            .text-red-600 { color: #dc2626; }
            .text-purple-600 { color: #9333ea; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
            .text-right { text-align: right; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight, undefined, 'FAST');
      
      // Clean up
      document.body.removeChild(iframe);
      
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress({ current: 0, total: 0, workerName: "" });
    }
  });
};
  // ==================== API Calls ====================
  
  const fetchWorkers = async () => {
    try {
      const res = await API.get("/employees");
      const activeWorkers = res.data.filter(w => w.status === "active");
      setWorkers(activeWorkers);
      
      if (editMode && editWorkerId && activeWorkers.length > 0) {
        const worker = activeWorkers.find(w => w._id === editWorkerId);
        if (worker) {
          setTimeout(() => {
            calculateSingleSalary(worker, editSalaryData);
          }, 500);
        }
      }
    } catch (err) {
      console.error("Error fetching workers:", err);
      alert("Error fetching workers");
    }
  };

  const fetchCompanyDetails = async () => {
    try {
      const res = await API.get("/auth/company-details");
      setCompanyDetails(res.data.companyDetails || {});
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  const fetchProcessedSalaries = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/salary/monthly?month=${selectedMonth}&year=${selectedYear}`);
      setProcessedSalaries(res.data);
    } catch (err) {
      console.error("Error fetching processed salaries:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerHistory = async (workerId) => {
    setLoading(true);
    try {
      const res = await API.get(`/salary/worker/${workerId}/history`);
      setWorkerHistory(res.data);
      const worker = workers.find(w => w._id === workerId);
      setSelectedWorkerForHistory(worker);
    } catch (err) {
      console.error("Error fetching worker history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSalary = async (salaryId, shouldRestore = false) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) return;
    
    setLoading(true);
    try {
      const url = shouldRestore 
        ? `/salary/${salaryId}?restoreAmounts=true` 
        : `/salary/${salaryId}`;
      
      const res = await API.delete(url);
      alert(res.data.msg);
      await fetchProcessedSalaries();
    } catch (error) {
      console.error("Error deleting salary:", error);
      alert(error.response?.data?.msg || "Failed to delete salary record");
    } finally {
      setLoading(false);
    }
  };

  // ==================== Salary Calculation Functions ====================
  
  const calculateSingleSalary = async (worker, existingSalary = null) => {
    setCalculating(true);
    try {
      const res = await API.post(`/salary/calculate/${worker._id}`, {
        month: selectedMonth,
        year: selectedYear
      });
      
      let ownerEdits = {
        monthlyAdvance: res.data.deductions?.defaultMonthlyDeduction || 0,
        loan: res.data.deductions?.defaultLoanDeduction || 0,
        notes: ""
      };
      
      if (existingSalary) {
        ownerEdits = {
          monthlyAdvance: existingSalary.ownerEdits?.monthlyAdvanceDeduction || existingSalary.deductions?.monthlyAdvanceDeducted || 0,
          loan: existingSalary.ownerEdits?.loanDeduction || existingSalary.deductions?.loanDeducted || 0,
          notes: existingSalary.ownerEdits?.notes || ""
        };
      }
      
      setSalaryData([{
        ...res.data,
        workerId: worker._id,
        ownerEdits
      }]);
      setShowReview(true);
    } catch (err) {
      console.error(`Error calculating salary for ${worker.name}:`, err);
      alert("Error calculating salary");
    } finally {
      setCalculating(false);
    }
  };

  const calculateAllSalaries = async () => {
    if (!window.confirm(`Calculate salaries for ${workers.length} workers?`)) return;

    setCalculating(true);
    setSalaryData([]);
    
    const results = [];
    
    for (const worker of workers) {
      try {
        const res = await API.post(`/salary/calculate/${worker._id}`, {
          month: selectedMonth,
          year: selectedYear
        });
        
        results.push({
          ...res.data,
          workerId: worker._id,
          ownerEdits: {
            monthlyAdvance: res.data.deductions?.defaultMonthlyDeduction || 0,
            loan: res.data.deductions?.defaultLoanDeduction || 0,
            notes: ""
          }
        });
      } catch (err) {
        console.error(`Error calculating salary for ${worker.name}:`, err);
        results.push({
          worker: { _id: worker._id, name: worker.name, designation: worker.designation },
          error: true,
          message: err.response?.data?.msg || "Calculation failed"
        });
      }
    }
    
    setSalaryData(results);
    setShowReview(true);
    setCalculating(false);
  };

  const calculateSelectedSalaries = async () => {
    if (!window.confirm(`Calculate salaries for ${selectedWorkers.length} selected workers?`)) return;

    setCalculating(true);
    setSalaryData([]);
    
    const results = [];
    const selectedWorkersList = workers.filter(w => selectedWorkers.includes(w._id));
    
    for (const worker of selectedWorkersList) {
      try {
        const res = await API.post(`/salary/calculate/${worker._id}`, {
          month: selectedMonth,
          year: selectedYear
        });
        
        results.push({
          ...res.data,
          workerId: worker._id,
          ownerEdits: {
            monthlyAdvance: res.data.deductions?.defaultMonthlyDeduction || 0,
            loan: res.data.deductions?.defaultLoanDeduction || 0,
            notes: ""
          }
        });
      } catch (err) {
        console.error(`Error calculating salary for ${worker.name}:`, err);
        results.push({
          worker: { _id: worker._id, name: worker.name, designation: worker.designation },
          error: true,
          message: err.response?.data?.msg || "Calculation failed"
        });
      }
    }
    
    setSalaryData(results);
    setShowReview(true);
    setCalculating(false);
  };

  const updateDeduction = (index, type, value) => {
    const updated = [...salaryData];
    if (type === 'notes') {
      updated[index].ownerEdits.notes = value;
    } else {
      updated[index].ownerEdits[type] = value;
    
      const earnings = updated[index].earnings.totalEarnings;
      const totalDeductions = updated[index].ownerEdits.monthlyAdvance + updated[index].ownerEdits.loan;
      let netSalary = earnings - totalDeductions;
      let monthlyRemaining = 0;
      let loanRemaining = 0;
      
      if (netSalary < 0) {
        const excess = Math.abs(netSalary);
        if (updated[index].ownerEdits.monthlyAdvance > 0 && updated[index].ownerEdits.loan > 0) {
          const ratio = updated[index].ownerEdits.monthlyAdvance / totalDeductions;
          monthlyRemaining = excess * ratio;
          loanRemaining = excess - monthlyRemaining;
        } else if (updated[index].ownerEdits.monthlyAdvance > 0) {
          monthlyRemaining = excess;
        } else if (updated[index].ownerEdits.loan > 0) {
          loanRemaining = excess;
        }
        netSalary = 0;
      }
      
      updated[index].calculatedNetSalary = netSalary;
      updated[index].calculatedRemaining = {
        monthlyAdvance: monthlyRemaining,
        loan: loanRemaining
      };
    }
    setSalaryData(updated);
  };

  const saveAllSalaries = async () => {
    if (!window.confirm(`Save ${salaryData.length} salary record(s)?`)) return;

    setLoading(true);
    
    try {
      const salariesToSave = salaryData.map(data => ({
        workerId: data.workerId,
        month: selectedMonth,
        year: selectedYear,
        attendance: data.attendance,
        rates: data.rates,
        earnings: data.earnings,
        deductions: data.ownerEdits,
        notes: data.ownerEdits.notes
      }));
      
      const res = await API.post("/salary/save", { salaries: salariesToSave });
      alert(res.data.msg);
      setShowReview(false);
      setSalaryData([]);
      if (activeTab === "history") fetchProcessedSalaries();
    } catch (err) {
      console.error("Error saving salaries:", err);
      alert("Error saving salaries");
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // WHATSAPP FUNCTIONS
  // =============================================
  
  // Prepare WhatsApp items for bulk sending with progress
  // Prepare WhatsApp items for bulk sending with progress
const prepareWhatsAppItems = async (type) => {
  if (processedSalaries.length === 0) {
    alert("No salary records found for this month");
    return;
  }

  setWhatsAppType(type);
  const items = [];

  for (let i = 0; i < processedSalaries.length; i++) {
    const salary = processedSalaries[i];
    const worker = workers.find(w => w._id === salary.workerId._id);
    
    if (!worker || !worker.phone) {
      console.log(`No phone number for ${worker?.name}`);
      continue;
    }

    let pdfBlob = null;
    if (type === "full_pdf") {
      setPdfProgress({ current: i + 1, total: processedSalaries.length, workerName: worker.name });
      try {
        pdfBlob = await generatePDFFromSalarySlip(salary, worker);
      } catch (error) {
        console.error(`Failed to generate PDF for ${worker.name}:`, error);
        alert(`Failed to generate PDF for ${worker.name}. Please try again.`);
        continue;
      }
    }
    
    items.push({
      worker: worker,
      salary: salary,
      pdfBlob: pdfBlob,
      month: selectedMonth,
      year: selectedYear,
      companyDetails: companyDetails
    });
  }

  if (items.length === 0) {
    alert("No workers with phone numbers found or PDF generation failed");
    return;
  }

  setWhatsAppItems(items);
  setShowWhatsAppSender(true);
  setPdfProgress({ current: 0, total: 0, workerName: "" });
};

  // =============================================
// WHATSAPP FUNCTIONS - UPDATED
// =============================================

// Handle WhatsApp send with better error handling
const handleWhatsAppSend = async () => {
  setShowWhatsAppSender(false);
  setLoading(true);
  
  let successCount = 0;
  let failCount = 0;
  const failedWorkers = [];
  const errors = [];

  for (let i = 0; i < whatsAppItems.length; i++) {
    const item = whatsAppItems[i];
    setPdfProgress({ 
      current: i + 1, 
      total: whatsAppItems.length, 
      workerName: item.worker.name 
    });
    
    try {
      // Validate phone number
      if (!item.worker.phone) {
        throw new Error(`No phone number found for ${item.worker.name}`);
      }
      
      // Format phone number
      let formattedPhone = item.worker.phone.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`;
      }
      
      // Call whatsapp service with proper parameters
      const result = await whatsappService.sendFullSalarySlip(
        {
          ...item.worker,
          phone: formattedPhone
        },
        item.salary,
        item.companyDetails,
        item.month,
        item.year,
        item.pdfBlob
      );
      
      if (result && result.success !== false) {
        successCount++;
      } else {
        throw new Error(result?.message || "Failed to send");
      }
      
    } catch (error) {
      failCount++;
      failedWorkers.push(item.worker.name);
      errors.push({
        worker: item.worker.name,
        error: error.message
      });
      console.error(`Failed to send to ${item.worker.name}:`, error);
    }
    
    // Small delay between messages to avoid rate limiting
    if (i < whatsAppItems.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Show detailed result
  let message = `✅ WhatsApp messages sent!\n\n`;
  message += `📊 Total: ${whatsAppItems.length}\n`;
  message += `✅ Successful: ${successCount}\n`;
  message += `❌ Failed: ${failCount}`;
  
  if (failedWorkers.length > 0) {
    message += `\n\n❌ Failed Workers:\n${failedWorkers.join("\n")}`;
  }
  
  if (errors.length > 0) {
    console.error("Detailed errors:", errors);
  }
  
  alert(message);
  
  setLoading(false);
  setPdfProgress({ current: 0, total: 0, workerName: "" });
  
  // Refresh history after sending
  fetchProcessedSalaries();
};

  // ==================== Action Handlers ====================
  
  const markAsPaid = async (salaryId) => {
    if (!window.confirm("Mark this salary as paid?")) return;
    setLoading(true);
    try {
      await API.patch(`/salary/${salaryId}/paid`);
      await fetchProcessedSalaries();
      alert("Salary marked as paid");
    } catch (err) {
      console.error("Error marking as paid:", err);
      alert("Error updating salary");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSlip = (salary) => {
    const worker = workers.find(w => w._id === salary.workerId._id);
    setSelectedSalaryForSlip(salary);
    setSelectedWorkerForSlip(worker);
    setShowSalarySlip(true);
  };

  const handleEditSalary = (salary) => {
    setSelectedMonth(salary.month);
    setSelectedYear(salary.year);
    setSelectedWorkers([salary.workerId._id]);
    setActiveTab("calculate");
    setShowReview(false);
    setSalaryData([]);
    
    setTimeout(() => {
      const worker = workers.find(w => w._id === salary.workerId._id);
      if (worker) {
        calculateSingleSalary(worker, salary);
      }
    }, 100);
  };

  const handleRemoveWorker = (index) => {
    const updatedData = [...salaryData];
    updatedData.splice(index, 1);
    setSalaryData(updatedData);
  };

  // ==================== Worker Selection Handlers ====================
  
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(workers.map(w => w._id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectWorker = (workerId) => {
    if (selectedWorkers.includes(workerId)) {
      setSelectedWorkers(selectedWorkers.filter(id => id !== workerId));
    } else {
      setSelectedWorkers([...selectedWorkers, workerId]);
    }
  };

  // ==================== Effects ====================
  
  useEffect(() => {
    fetchWorkers();
    fetchCompanyDetails();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchProcessedSalaries();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  // ==================== Render ====================
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Global Loading Overlay */}
      {(loading || calculating || isGeneratingPDF) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl min-w-[280px]">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-800 font-semibold text-center">
              {isGeneratingPDF ? "Generating PDF..." : 
               calculating ? "Calculating Salaries..." : 
               "Processing..."}
            </p>
            {pdfProgress.total > 0 && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(pdfProgress.current / pdfProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {pdfProgress.current} of {pdfProgress.total} • {pdfProgress.workerName}
                </p>
              </>
            )}
            <p className="text-xs text-gray-400">Please wait, don't close this window</p>
          </div>
        </div>
      )}

      <div className="w-full">
        <SalaryHeader />
        
        {/* Tabs */}
        <div className="mb-5">
          <div className="flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("calculate")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "calculate"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Calculate Salary
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Salary History
            </button>
          </div>
        </div>

        {/* Calculate Tab */}
        {activeTab === "calculate" && !showReview && (
          <>
            <PeriodSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
            
            <WorkerSelector
              workers={workers}
              selectedWorkers={selectedWorkers}
              selectAll={selectAll}
              onToggleSelectAll={toggleSelectAll}
              onToggleWorker={toggleSelectWorker}
            />
            
            <div className="flex gap-3">
              <button
                onClick={calculateAllSalaries}
                disabled={calculating || workers.length === 0}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {calculating ? "Calculating..." : "Calculate All Workers"}
              </button>
              <button
                onClick={calculateSelectedSalaries}
                disabled={calculating || selectedWorkers.length === 0}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
              >
                {calculating ? "Calculating..." : `Calculate Selected (${selectedWorkers.length})`}
              </button>
            </div>
          </>
        )}

        {/* Review Screen */}
        {showReview && (
          <SalaryReviewTable
            salaryData={salaryData}
            onUpdateDeduction={updateDeduction}
            onSave={saveAllSalaries}
            onRemoveWorker={handleRemoveWorker}
            onBack={() => {
              setShowReview(false);
              setSalaryData([]);
            }}
            loading={loading}
            month={selectedMonth}
            year={selectedYear}
          />
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-5">
            <PeriodSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-gray-700">Salary Records</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (processedSalaries.length > 0) {
                        setShowBulkDownload(true);
                      } else {
                        alert("No salary records found for this month");
                      }
                    }}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-purple-700 transition flex items-center gap-1"
                  >
                    📦 Bulk Download All
                  </button>
                  
                  <button
                    onClick={() => prepareWhatsAppItems("full_text")}
                    disabled={processedSalaries.length === 0 || loading}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-50"
                    title="Send full salary details as text message (no PDF)"
                  >
                    💬 Full Details (Text)
                  </button>
                  
                  <button
                    onClick={() => prepareWhatsAppItems("full_pdf")}
                    disabled={processedSalaries.length === 0 || loading}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-50"
                    title="Send full salary details with PDF attachment"
                  >
                    📄 Full Details + PDF
                  </button>
                </div>
              </div>
              <SalaryHistoryTable
                salaries={processedSalaries}
                loading={loading}
                onViewHistory={fetchWorkerHistory}
                onMarkPaid={markAsPaid}
                onViewSlip={handleViewSlip}
                onEditSalary={handleEditSalary}
                onDeleteSalary={handleDeleteSalary}
                workers={workers}
              />
            </div>
          </div>
        )}

        {/* History Modal */}
        {selectedWorkerForHistory && workerHistory.length > 0 && (
          <SalaryHistoryModal
            worker={selectedWorkerForHistory}
            history={workerHistory}
            onClose={() => {
              setSelectedWorkerForHistory(null);
              setWorkerHistory([]);
            }}
          />
        )}

        {/* Salary Slip Modal */}
        {showSalarySlip && selectedSalaryForSlip && selectedWorkerForSlip && (
          <SalarySlip
            salary={selectedSalaryForSlip}
            worker={selectedWorkerForSlip}
            onClose={() => {
              setShowSalarySlip(false);
              setSelectedSalaryForSlip(null);
              setSelectedWorkerForSlip(null);
            }}
            onSend={async (email) => {
              try {
                await API.post("/email/send-salary-slip", {
                  email,
                  salaryId: selectedSalaryForSlip._id
                });
                alert(`Salary slip sent to ${email}`);
              } catch (err) {
                console.error("Error sending email:", err);
                alert("Error sending email. Please try again.");
              }
            }}
          />
        )}

        {/* Bulk Download Modal */}
        {showBulkDownload && (
          <BulkSalaryDownload
            salaries={processedSalaries}
            month={selectedMonth}
            year={selectedYear}
            companyDetails={companyDetails}
            onClose={() => setShowBulkDownload(false)}
          />
        )}

        {/* WhatsApp Bulk Sender Modal */}
        {showWhatsAppSender && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  Send {whatsAppType === "full_pdf" ? "Salary Slips (PDF)" : "Salary Details"}
                </h2>
                <button onClick={() => setShowWhatsAppSender(false)} className="text-white hover:text-gray-200 text-xl">
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="bg-green-50 rounded-xl p-4 mb-4">
                    <p className="text-3xl font-bold text-green-600">{whatsAppItems.length}</p>
                    <p className="text-sm text-gray-600">Messages to send</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    You are about to send WhatsApp messages to <strong>{whatsAppItems.length}</strong> recipient(s)
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {whatsAppType === "full_pdf" 
                      ? "📎 PDF salary slips will be attached" 
                      : "📝 Full salary details will be sent as text"}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleWhatsAppSend}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all"
                  >
                    📱 Send Now
                  </button>
                  <button
                    onClick={() => setShowWhatsAppSender(false)}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}