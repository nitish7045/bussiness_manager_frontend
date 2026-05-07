// src/components/salary/SalarySlip.jsx
import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import API from "../../api/api";
import { saveAs } from 'file-saver';

export default function SalarySlip({ salary, worker, onClose, onSend, isBulk = false }) {
  const [companyDetails, setCompanyDetails] = useState({
    name: "Business Manager",
    phone: "",
    email: "",
    address: "",
    gst: "",
    logo: null
  });
  const [userName, setUserName] = useState("");

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

  // Convert number to words
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

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const res = await API.get("/auth/company-details");
      if (res.data.companyDetails) {
        setCompanyDetails({
          name: res.data.companyDetails.name || "Business Manager",
          phone: res.data.companyDetails.phone || "",
          email: res.data.companyDetails.email || "",
          address: res.data.companyDetails.address || "",
          gst: res.data.companyDetails.gst || "",
          logo: res.data.companyDetails.logo || null
        });
        setUserName(res.data.userName || "");
      }
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  const getMonthName = (month) => {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[month - 1];
  };

  const downloadPDF = async () => {
    const element = document.getElementById('salary-slip');
    const canvas = await html2canvas(element, {
      scale: 1.5, // Reduced from 2 to 1.5 for smaller size
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      quality: 0.8 // Add quality setting
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG with 70% quality
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true // Enable compression
    });
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST'); // Add compression
    pdf.save(`Salary_Slip_${worker.name}_${getMonthName(salary.month)}_${salary.year}.pdf`);
  };

  // Replace the sendWhatsApp function with this:
// Updated sendWhatsApp function in SalarySlip.jsx
const sendWhatsApp = async () => {
  const phoneNumber = worker.phone;
  if (!phoneNumber) {
    alert("No phone number found for this worker");
    return;
  }
  
  // Clean phone number
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  
  // First generate the PDF
  const element = document.getElementById('salary-slip');
  const canvas = await html2canvas(element, {
    scale: 1.5,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    quality: 0.8
  });
  
  const imgData = canvas.toDataURL('image/jpeg', 0.7);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  
  // Save PDF
  const pdfBlob = pdf.output('blob');
  const fileName = `Salary_Slip_${worker.name}_${getMonthName(salary.month)}_${salary.year}.pdf`;
  
  // Check if the Web Share API is available (mobile)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
    try {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      await navigator.share({
        title: 'Salary Slip',
        text: `Salary slip for ${worker.name} - ${getMonthName(salary.month)} ${salary.year}`,
        files: [file]
      });
      alert("Salary slip shared successfully!");
    } catch (err) {
      console.error("Share failed:", err);
      // Fallback: download and open WhatsApp
      saveAs(pdfBlob, fileName);
      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Salary slip for ${worker.name} is attached. Please check the downloaded file.`)}`, '_blank');
      alert("PDF downloaded. Please attach it to your WhatsApp message.");
    }
  } else {
    // Fallback for desktop: download and open WhatsApp
    saveAs(pdfBlob, fileName);
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Salary slip for ${worker.name} is attached. Please check the downloaded file.`)}`, '_blank');
    alert("PDF downloaded. Please attach it to your WhatsApp message.");
  }
};

  // Calculate base pay (monthly salary)
  const basePay = worker.monthlySalary || (worker.wages?.monthly) || 0;
  
  // Calculate total days in month
  const totalDaysInMonth = new Date(salary.year, salary.month, 0).getDate();
  
  // Calculate present days including Sunday presents
  const totalPresentDays = (salary.attendance?.weekdayPresent || 0) + (salary.attendance?.sundayPresent || 0);
  
  // Calculate leave days
  const leaveDays = totalDaysInMonth - totalPresentDays - (salary.attendance?.halfDays || 0);

  // Get daily salary for calculations display
  const dailySalary = salary.dailySalary || (basePay / 30);
  const hourlySalary = salary.hourlySalary || (dailySalary / 8);
  
  // Get net salary in words
  const netSalaryInWords = numberToWords(salary.netSalary || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header with Actions */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 rounded-t-2xl flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white">Salary Slip</h2>
          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 shadow-md"
            >
              📥 Download PDF
            </button>
            <button
              onClick={sendWhatsApp}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-200 flex items-center gap-2 shadow-md"
            >
              💬 WhatsApp
            </button>
            {!isBulk && (
              <button
                onClick={() => onSend(worker.email || companyDetails.email)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-all duration-200 flex items-center gap-2 shadow-md"
              >
                📧 Send Email
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-all duration-200 flex items-center gap-2 shadow-md"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Rest of the Salary Slip Content remains the same */}
        <div id="salary-slip" className="p-8 bg-white">
          {/* Company Header with Logo */}
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-24"></div>
              {companyDetails.logo && (
                <img 
                  src={companyDetails.logo} 
                  alt="Company Logo" 
                  className="h-20 object-contain mx-auto"
                />
              )}
              <div className="w-24"></div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{companyDetails.name}</h1>
            <div className="flex justify-center gap-6 text-sm text-gray-600 mt-2">
              {companyDetails.phone && <span>📞 {companyDetails.phone}</span>}
              {companyDetails.email && <span>✉️ {companyDetails.email}</span>}
            </div>
            {companyDetails.address && (
              <p className="text-sm text-gray-500 mt-1">📍 {companyDetails.address}</p>
            )}
            {companyDetails.gst && (
              <p className="text-xs text-gray-400 mt-1">GST: {companyDetails.gst}</p>
            )}
            <div className="mt-4">
              <p className="text-xl font-semibold text-blue-600">Salary Slip</p>
              <p className="text-sm text-gray-500">{getMonthName(salary.month)} {salary.year}</p>
            </div>
          </div>

          {/* Employee Details Card */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-l-4 border-blue-500 pl-3">Employee Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Employee Name</p>
                <p className="text-base font-semibold text-gray-800">{worker.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Designation</p>
                <p className="text-base font-semibold text-gray-800">{worker.designation}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                <p className="text-base font-mono text-gray-700">{worker._id?.slice(-8)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                <p className="text-base text-gray-800">{worker.phone || "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* Salary Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="text-xs text-blue-600 mb-1">Monthly Base Salary</p>
              <p className="text-2xl font-bold text-blue-700">₹{formatNumber(basePay)}</p>
              <p className="text-xs text-gray-500 mt-1">Daily Rate: ₹{formatNumber(dailySalary)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <p className="text-xs text-green-600 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-green-700">₹{formatNumber(salary.earnings?.totalEarnings)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
              <p className="text-xs text-red-600 mb-1">Total Deductions</p>
              <p className="text-2xl font-bold text-red-700">-₹{formatNumber(salary.deductions?.totalDeductions)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
              <p className="text-xs text-purple-600 mb-1">Net Salary Payable</p>
              <p className="text-2xl font-bold text-purple-700">₹{formatNumber(salary.netSalary)}</p>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-l-4 border-green-500 pl-3">Attendance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{totalPresentDays}</p>
                <p className="text-xs text-gray-500">Present Days</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{salary.attendance?.weekdayHalf || 0}</p>
                <p className="text-xs text-gray-500">Half Days</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{leaveDays}</p>
                <p className="text-xs text-gray-500">Leave Days</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{salary.attendance?.overtimeHours || 0}</p>
                <p className="text-xs text-gray-500">Overtime Hours</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{totalDaysInMonth}</p>
                <p className="text-xs text-gray-500">Total Days</p>
              </div>
            </div>
          </div>

          {/* Earnings and Deductions Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Earnings Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-green-700">Earnings</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      <div className="text-gray-600">Weekday Present</div>
                      <div className="text-xs text-gray-400">
                        {salary.attendance?.weekdayPresent || 0} × ₹{formatNumberWithDecimals(dailySalary)}
                      </div>
                     </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₹{formatNumberWithDecimals(salary.earnings?.weekdayPay)}
                     </td>
                  </tr>
                  {salary.attendance?.weekdayHalf > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <div className="text-gray-600">Weekday Half Day</div>
                        <div className="text-xs text-gray-400">
                          {salary.attendance?.weekdayHalf} × ₹{formatNumberWithDecimals(dailySalary * 0.5)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">₹{formatNumberWithDecimals(salary.earnings?.weekdayHalfPay)}</td>
                    </tr>
                  )}
                  {salary.attendance?.sundayPresent > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <div className="text-gray-600">Sunday Present (Double Pay)</div>
                        <div className="text-xs text-gray-400">
                          {salary.attendance?.sundayPresent} × ₹{formatNumberWithDecimals(dailySalary * 2)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">₹{formatNumberWithDecimals(salary.earnings?.sundayPresentPay)}</td>
                    </tr>
                  )}
                  {salary.attendance?.sundayHalf > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <div className="text-gray-600">Sunday Half Day (1.5x)</div>
                        <div className="text-xs text-gray-400">
                          {salary.attendance?.sundayHalf} × ₹{formatNumberWithDecimals(dailySalary * 1.5)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">₹{formatNumberWithDecimals(salary.earnings?.sundayHalfPay)}</td>
                    </tr>
                  )}
                  {salary.attendance?.sundayHoliday > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <div className="text-gray-600">Sunday Holiday</div>
                        <div className="text-xs text-gray-400">
                          {salary.attendance?.sundayHoliday} × ₹{formatNumberWithDecimals(dailySalary)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">₹{formatNumberWithDecimals(salary.earnings?.sundayHolidayPay)}</td>
                    </tr>
                  )}
                  {salary.attendance?.otherHolidays > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <div className="text-gray-600">Other Holidays</div>
                        <div className="text-xs text-gray-400">
                          {salary.attendance?.otherHolidays} × ₹{formatNumberWithDecimals(dailySalary)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">₹{formatNumberWithDecimals(salary.earnings?.otherHolidayPay)}</td>
                    </tr>
                  )}
                  {salary.attendance?.overtimeHours > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <div className="text-gray-600">Overtime</div>
                        <div className="text-xs text-gray-400">
                          {salary.attendance?.overtimeHours} hrs × ₹{formatNumberWithDecimals(hourlySalary)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">₹{formatNumberWithDecimals(salary.earnings?.overtimePay)}</td>
                    </tr>
                  )}
                  <tr className="bg-green-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">Total Earnings</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      ₹{formatNumberWithDecimals(salary.earnings?.totalEarnings)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Deductions Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-red-700">Deductions</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {(salary.deductions?.monthlyAdvanceDeducted > 0) && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Monthly Advance Deduction</td>
                      <td className="px-4 py-3 text-right text-red-600">
                        -₹{formatNumber(salary.deductions?.monthlyAdvanceDeducted)}
                      </td>
                    </tr>
                  )}
                  {(salary.deductions?.loanDeducted > 0) && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Loan Deduction</td>
                      <td className="px-4 py-3 text-right text-red-600">
                        -₹{formatNumber(salary.deductions?.loanDeducted)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-red-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">Total Deductions</td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">
                      -₹{formatNumber(salary.deductions?.totalDeductions)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Salary Section with Amount in Words */}
          <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
            <div className="text-center">
              <p className="text-sm font-semibold text-purple-700 mb-2">Net Salary Payable</p>
              <p className="text-3xl font-bold text-purple-700">₹{formatNumber(salary.netSalary)}</p>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-600 mb-1">Amount in Words</p>
                <p className="text-base font-medium text-purple-800 tracking-wide">
                  {netSalaryInWords}
                </p>
              </div>
            </div>
          </div>

          {/* Carry Forward Info */}
          {(salary.carryForwardToNext?.monthlyAdvance > 0 || salary.carryForwardToNext?.loan > 0) && (
            <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-600 text-lg">⏩</span>
                <h4 className="text-sm font-semibold text-orange-700">Carry Forward to Next Month</h4>
              </div>
              <div className="flex gap-6 text-sm">
                {salary.carryForwardToNext?.monthlyAdvance > 0 && (
                  <div>
                    <span className="text-gray-600">Monthly Advance:</span>
                    <span className="font-semibold text-orange-600 ml-2">₹{formatNumber(salary.carryForwardToNext.monthlyAdvance)}</span>
                  </div>
                )}
                {salary.carryForwardToNext?.loan > 0 && (
                  <div>
                    <span className="text-gray-600">Loan:</span>
                    <span className="font-semibold text-orange-600 ml-2">₹{formatNumber(salary.carryForwardToNext.loan)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Details */}
          {salary.paymentDetails?.paidAt && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 text-lg">💳</span>
                <h4 className="text-sm font-semibold text-blue-700">Payment Details</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Payment Date:</span>
                  <span className="font-medium text-gray-700 ml-2">
                    {new Date(salary.paymentDetails.paidAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-medium text-gray-700 ml-2 capitalize">{salary.paymentDetails.paymentMethod}</span>
                </div>
                {salary.paymentDetails.paymentNotes && (
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-gray-500">Notes:</span>
                    <span className="font-medium text-gray-700 ml-2">{salary.paymentDetails.paymentNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">This is a computer-generated document. No signature required.</p>
            <p className="text-xs text-gray-400 mt-1">Generated on: {new Date().toLocaleString('en-IN')}</p>
            <div className="mt-4 flex justify-center gap-8 text-xs text-gray-400">
              <span>Thank you for your contribution!</span>
              <span>For any queries, contact HR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}