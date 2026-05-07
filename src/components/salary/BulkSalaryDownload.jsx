// src/components/salary/BulkSalaryDownload.jsx
import React, { useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function BulkSalaryDownload({ salaries, month, year, companyDetails, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentWorker, setCurrentWorker] = useState("");

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const formatNumberWithDecimals = (num) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

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

  // Generate HTML that matches the SalarySlip component UI
  const generateSalarySlipHTML = (salary, worker) => {
    const basePay = worker.wages?.monthly || worker.monthlySalary || 0;
    const dailySalary = salary.dailySalary || (basePay / 30);
    const hourlySalary = dailySalary / 8;
    const totalDaysInMonth = new Date(salary.year, salary.month, 0).getDate();
    const totalPresentDays = (salary.attendance?.weekdayPresent || 0) + (salary.attendance?.sundayPresent || 0);
    const leaveDays = totalDaysInMonth - totalPresentDays - (salary.attendance?.halfDays || 0);
    const netSalaryInWords = numberToWords(salary.netSalary || 0);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Salary Slip - ${worker.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: white;
            padding: 20px;
          }
          .salary-slip {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .text-center { text-align: center; }
          .border-bottom-2 { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-6 { margin-bottom: 24px; }
          .mt-2 { margin-top: 8px; }
          .mt-3 { margin-top: 12px; }
          .grid-cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          .bg-gray-50 { background: #f9fafb; }
          .bg-blue-50 { background: #eff6ff; }
          .bg-green-50 { background: #f0fdf4; }
          .bg-red-50 { background: #fef2f2; }
          .bg-purple-50 { background: #faf5ff; }
          .bg-orange-50 { background: #fff7ed; }
          .rounded-xl { border-radius: 12px; }
          .border { border: 1px solid #e5e7eb; }
          .border-l-4 { border-left-width: 4px; }
          .border-blue-500 { border-color: #3b82f6; }
          .border-green-500 { border-color: #22c55e; }
          .border-purple-200 { border-color: #e9d5ff; }
          .border-orange-200 { border-color: #fed7aa; }
          .border-blue-200 { border-color: #bfdbfe; }
          .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
          .p-2 { padding: 8px; }
          .p-3 { padding: 12px; }
          .p-4 { padding: 16px; }
          .p-6 { padding: 20px; }
          .px-3 { padding-left: 12px; padding-right: 12px; }
          .py-2 { padding-top: 8px; padding-bottom: 8px; }
          .pl-3 { padding-left: 12px; }
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
          .text-orange-600 { color: #ea580c; }
          .text-orange-700 { color: #c2410c; }
          .text-gray-400 { color: #9ca3af; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-700 { color: #374151; }
          .text-gray-800 { color: #1f2937; }
          .tracking-wide { letter-spacing: 0.025em; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
          .text-right { text-align: right; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .gap-2 { gap: 8px; }
          .gap-3 { gap: 12px; }
          .gap-4 { gap: 16px; }
          .gap-6 { gap: 20px; }
          .grid-cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
          .bg-gradient-to-r { background: linear-gradient(to right, #faf5ff, #eef2ff); }
          .from-purple-50 { --tw-gradient-from: #faf5ff; }
          .to-indigo-50 { --tw-gradient-to: #eef2ff; }
        </style>
      </head>
      <body>
        <div class="salary-slip">
          <!-- Company Header -->
          <div class="text-center border-bottom-2">
            ${companyDetails.logo ? `<img src="${companyDetails.logo}" style="height: 60px; object-fit: contain; margin: 0 auto 12px auto;" />` : ''}
            <h1 class="text-2xl font-bold text-gray-800 mb-1">${companyDetails.name || "Business Manager"}</h1>
            <div class="flex justify-center gap-4 text-sm text-gray-600 mt-2">
              ${companyDetails.phone ? `<span>📞 ${companyDetails.phone}</span>` : ''}
              ${companyDetails.email ? `<span>✉️ ${companyDetails.email}</span>` : ''}
            </div>
            ${companyDetails.address ? `<p class="text-sm text-gray-500 mt-1">📍 ${companyDetails.address}</p>` : ''}
            ${companyDetails.gst ? `<p class="text-xs text-gray-400 mt-1">GST: ${companyDetails.gst}</p>` : ''}
            <div class="mt-4">
              <p class="text-xl font-semibold text-blue-600">Salary Slip</p>
              <p class="text-sm text-gray-500">${getMonthName(month)} ${year}</p>
            </div>
          </div>

          <!-- Employee Details Card -->
          <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 shadow-sm">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-1">Employee Name</p>
                <p class="text-base font-semibold text-gray-800">${worker.name}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Designation</p>
                <p class="text-base font-semibold text-gray-800">${worker.designation}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Employee ID</p>
                <p class="text-base font-mono text-gray-700">${worker._id?.slice(-8)}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Phone Number</p>
                <p class="text-base text-gray-800">${worker.phone || "Not provided"}</p>
              </div>
            </div>
          </div>

          <!-- Salary Summary Cards -->
          <div class="grid-cols-4">
            <div class="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p class="text-xs text-blue-600 mb-1">Monthly Base Salary</p>
              <p class="text-2xl font-bold text-blue-700">₹${formatNumber(basePay)}</p>
              <p class="text-xs text-gray-500 mt-1">Daily Rate: ₹${formatNumber(dailySalary)}</p>
            </div>
            <div class="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <p class="text-xs text-green-600 mb-1">Total Earnings</p>
              <p class="text-2xl font-bold text-green-700">₹${formatNumber(salary.earnings?.totalEarnings)}</p>
            </div>
            <div class="bg-red-50 rounded-xl p-4 text-center border border-red-100">
              <p class="text-xs text-red-600 mb-1">Total Deductions</p>
              <p class="text-2xl font-bold text-red-700">-₹${formatNumber(salary.deductions?.totalDeductions)}</p>
            </div>
            <div class="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
              <p class="text-xs text-purple-600 mb-1">Net Salary Payable</p>
              <p class="text-2xl font-bold text-purple-700">₹${formatNumber(salary.netSalary)}</p>
            </div>
          </div>

          <!-- Attendance Summary -->
          <div class="bg-gray-50 rounded-xl p-4 mb-6">
            <div class="grid grid-cols-5 gap-3 text-center">
              <div>
                <div class="text-2xl font-bold text-green-600">${totalPresentDays}</div>
                <div class="text-xs text-gray-500">Present Days</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-orange-600">${salary.attendance?.weekdayHalf || 0}</div>
                <div class="text-xs text-gray-500">Half Days</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-red-600">${leaveDays}</div>
                <div class="text-xs text-gray-500">Leave Days</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-blue-600">${salary.attendance?.overtimeHours || 0}</div>
                <div class="text-xs text-gray-500">Overtime Hours</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-purple-600">${totalDaysInMonth}</div>
                <div class="text-xs text-gray-500">Total Days</div>
              </div>
            </div>
          </div>

          <!-- Earnings and Deductions Tables -->
          <div class="grid-cols-2">
            <!-- Earnings Table -->
            <div class="border rounded-xl overflow-hidden">
              <div class="bg-green-50 px-4 py-2 border-b border-gray-200">
                <h3 class="text-md font-semibold text-green-700">Earnings</h3>
              </div>
              <table class="w-full text-sm">
                <tbody>
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-2">
                      <div class="text-gray-600">Weekday Present</div>
                      <div class="text-xs text-gray-400">${salary.attendance?.weekdayPresent || 0} × ₹${formatNumberWithDecimals(dailySalary)}</div>
                    </td>
                    <td class="px-4 py-2 text-right font-semibold">₹${formatNumberWithDecimals(salary.earnings?.weekdayPay)}</td>
                  </tr>
                  ${salary.attendance?.weekdayHalf > 0 ? `
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-2">
                      <div class="text-gray-600">Weekday Half Day</div>
                      <div class="text-xs text-gray-400">${salary.attendance?.weekdayHalf} × ₹${formatNumberWithDecimals(dailySalary * 0.5)}</div>
                    </td>
                    <td class="px-4 py-2 text-right">₹${formatNumberWithDecimals(salary.earnings?.weekdayHalfPay)}</td>
                  </tr>
                  ` : ''}
                  ${salary.attendance?.sundayPresent > 0 ? `
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-2">
                      <div class="text-gray-600">Sunday Present (Double Pay)</div>
                      <div class="text-xs text-gray-400">${salary.attendance?.sundayPresent} × ₹${formatNumberWithDecimals(dailySalary * 2)}</div>
                    </td>
                    <td class="px-4 py-2 text-right">₹${formatNumberWithDecimals(salary.earnings?.sundayPresentPay)}</td>
                  </tr>
                  ` : ''}
                  ${salary.attendance?.sundayHalf > 0 ? `
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-2">
                      <div class="text-gray-600">Sunday Half Day (1.5x)</div>
                      <div class="text-xs text-gray-400">${salary.attendance?.sundayHalf} × ₹${formatNumberWithDecimals(dailySalary * 1.5)}</div>
                    </td>
                    <td class="px-4 py-2 text-right">₹${formatNumberWithDecimals(salary.earnings?.sundayHalfPay)}</td>
                  </tr>
                  ` : ''}
                  ${salary.attendance?.sundayHoliday > 0 ? `
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-2">
                      <div class="text-gray-600">Sunday Holiday</div>
                      <div class="text-xs text-gray-400">${salary.attendance?.sundayHoliday} × ₹${formatNumberWithDecimals(dailySalary)}</div>
                    </td>
                    <td class="px-4 py-2 text-right">₹${formatNumberWithDecimals(salary.earnings?.sundayHolidayPay)}</td>
                  </tr>
                  ` : ''}
                  ${salary.attendance?.otherHolidays > 0 ? `
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-2">
                      <div class="text-gray-600">Other Holidays</div>
                      <div class="text-xs text-gray-400">${salary.attendance?.otherHolidays} × ₹${formatNumberWithDecimals(dailySalary)}</div>
                    </td>
                    <td class="px-4 py-2 text-right">₹${formatNumberWithDecimals(salary.earnings?.otherHolidayPay)}</td>
                  </tr>
                  ` : ''}
                  ${salary.attendance?.overtimeHours > 0 ? `
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-2">
                      <div class="text-gray-600">Overtime</div>
                      <div class="text-xs text-gray-400">${salary.attendance?.overtimeHours} hrs × ₹${formatNumberWithDecimals(hourlySalary)}</div>
                    </td>
                    <td class="px-4 py-2 text-right">₹${formatNumberWithDecimals(salary.earnings?.overtimePay)}</td>
                  </tr>
                  ` : ''}
                  <tr class="bg-green-50 font-semibold">
                    <td class="px-4 py-2 text-gray-800">Total Earnings</td>
                    <td class="px-4 py-2 text-right font-bold text-green-700">₹${formatNumberWithDecimals(salary.earnings?.totalEarnings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Deductions Table -->
            <div class="border rounded-xl overflow-hidden">
              <div class="bg-red-50 px-4 py-2 border-b border-gray-200">
                <h3 class="text-md font-semibold text-red-700">Deductions</h3>
              </div>
              <table class="w-full">
                <tbody>
                  ${salary.deductions?.monthlyAdvanceDeducted > 0 ? `
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-2 text-gray-600">Monthly Advance Deduction</td>
                    <td class="px-4 py-2 text-right text-red-600">-₹${formatNumber(salary.deductions?.monthlyAdvanceDeducted)}</td>
                  </tr>
                  ` : ''}
                  ${salary.deductions?.loanDeducted > 0 ? `
                  <tr class="border-b border-gray-100">
                    <td class="px-4 py-2 text-gray-600">Loan Deduction</td>
                    <td class="px-4 py-2 text-right text-red-600">-₹${formatNumber(salary.deductions?.loanDeducted)}</td>
                  </tr>
                  ` : ''}
                  <tr class="bg-red-50 font-semibold">
                    <td class="px-4 py-2 text-gray-800">Total Deductions</td>
                    <td class="px-4 py-2 text-right font-bold text-red-700">-₹${formatNumber(salary.deductions?.totalDeductions)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Net Salary Section with Amount in Words -->
          <div class="mb-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
            <div class="text-center">
              <p class="text-sm font-semibold text-purple-700 mb-2">Net Salary Payable</p>
              <p class="text-3xl font-bold text-purple-700">₹${formatNumber(salary.netSalary)}</p>
              <div class="mt-3 pt-2 border-t border-purple-200">
                <p class="text-xs text-purple-600 mb-1">Amount in Words</p>
                <p class="text-sm font-medium text-purple-800 tracking-wide">${netSalaryInWords}</p>
              </div>
            </div>
          </div>

          <!-- Carry Forward Info -->
          ${(salary.carryForwardToNext?.monthlyAdvance > 0 || salary.carryForwardToNext?.loan > 0) ? `
          <div class="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-orange-600 text-lg">⏩</span>
              <h4 class="text-sm font-semibold text-orange-700">Carry Forward to Next Month</h4>
            </div>
            <div class="flex gap-6 text-sm">
              ${salary.carryForwardToNext?.monthlyAdvance > 0 ? `
              <div><span class="text-gray-600">Monthly Advance:</span> <span class="font-semibold text-orange-600 ml-2">₹${formatNumber(salary.carryForwardToNext.monthlyAdvance)}</span></div>
              ` : ''}
              ${salary.carryForwardToNext?.loan > 0 ? `
              <div><span class="text-gray-600">Loan:</span> <span class="font-semibold text-orange-600 ml-2">₹${formatNumber(salary.carryForwardToNext.loan)}</span></div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Payment Details -->
          ${salary.paymentDetails?.paidAt ? `
          <div class="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-blue-600 text-lg">💳</span>
              <h4 class="text-sm font-semibold text-blue-700">Payment Details</h4>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div><span class="text-gray-500">Payment Date:</span> <span class="font-medium ml-2">${new Date(salary.paymentDetails.paidAt).toLocaleDateString('en-IN')}</span></div>
              <div><span class="text-gray-500">Payment Method:</span> <span class="font-medium ml-2 capitalize">${salary.paymentDetails.paymentMethod}</span></div>
              ${salary.paymentDetails.paymentNotes ? `<div><span class="text-gray-500">Notes:</span> <span class="font-medium ml-2">${salary.paymentDetails.paymentNotes}</span></div>` : ''}
            </div>
          </div>
          ` : ''}

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

  const downloadAllAsPDF = async () => {
    setDownloading(true);
    const zip = new JSZip();
    
    for (let i = 0; i < salaries.length; i++) {
      const salary = salaries[i];
      const worker = salary.workerId;
      setCurrentWorker(worker.name);
      setProgress(((i + 1) / salaries.length) * 100);
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateSalarySlipHTML(salary, worker);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '1000px';
      document.body.appendChild(tempDiv);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: 1000
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 277;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      const fileName = `Salary_Slip_${worker.name}_${getMonthName(month)}_${year}.pdf`;
      zip.file(fileName, pdfBlob);
      
      document.body.removeChild(tempDiv);
    }
    
    const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
    saveAs(zipBlob, `Salary_Slips_${getMonthName(month)}_${year}.zip`);
    setDownloading(false);
    setProgress(0);
    setCurrentWorker("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header with gradient - matching SalarySlip style */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Bulk Download Salary Slips</h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 text-xl transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {/* Info section */}
          <div className="text-center mb-6">
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <p className="text-2xl font-bold text-purple-700">{salaries.length}</p>
              <p className="text-sm text-gray-600">Salary Slips Ready</p>
            </div>
            <p className="text-sm text-gray-600">{getMonthName(month)} {year}</p>
            <p className="text-xs text-gray-500 mt-1">All workers who have been paid</p>
          </div>
          
          {/* Progress bar - matching SalarySlip style */}
          {downloading && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Generating PDFs...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">
                <span className="font-medium">{currentWorker}</span>
              </p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <button 
              onClick={downloadAllAsPDF} 
              disabled={downloading} 
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 text-sm font-medium shadow-md"
            >
              {downloading ? "Creating ZIP..." : "📦 Download All (ZIP)"}
            </button>
            <button 
              onClick={onClose} 
              className="flex-1 bg-gray-500 text-white px-4 py-2.5 rounded-xl hover:bg-gray-600 transition-all duration-200 text-sm font-medium shadow-md"
            >
              Cancel
            </button>
          </div>
          
          {/* Info note */}
          <div className="mt-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-sm">ℹ️</span>
              <p className="text-xs text-gray-500">
                All salary slips will be downloaded as individual PDF files inside a ZIP folder. 
                Each slip includes complete salary breakdown, attendance, and payment details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}