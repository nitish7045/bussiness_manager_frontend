// src/utils/salaryUtils.js
export const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

export const formatNumberWithDecimals = (num) => {
  if (num === undefined || num === null) return "0";
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const getMonthName = (month) => {
  const months = ["January", "February", "March", "April", "May", "June", 
                  "July", "August", "September", "October", "November", "December"];
  return months[month - 1];
};

export const numberToWords = (num) => {
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

export const generateSalarySlipHTML = (salary, worker, companyDetails, month, year) => {
  const basePay = worker.wages?.monthly || worker.monthlySalary || 0;
  const dailySalary = salary.dailySalary || (basePay / 30);
  const hourlySalary = dailySalary / 8;
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const totalPresentDays = (salary.attendance?.weekdayPresent || 0) + (salary.attendance?.sundayPresent || 0);
  const leaveDays = totalDaysInMonth - totalPresentDays - (salary.attendance?.halfDays || 0);
  const netSalaryInWords = numberToWords(salary.netSalary || 0);
  const monthName = getMonthName(month);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Salary Slip - ${worker.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: white; padding: 20px; }
        .salary-slip { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .text-center { text-align: center; }
        .border-bottom { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .bg-blue-50 { background: #eff6ff; }
        .bg-green-50 { background: #f0fdf4; }
        .bg-red-50 { background: #fef2f2; }
        .bg-purple-50 { background: #faf5ff; }
        .bg-gray-50 { background: #f9fafb; }
        .rounded-xl { border-radius: 12px; }
        .p-4 { padding: 16px; }
        .p-3 { padding: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .text-xs { font-size: 11px; }
        .text-sm { font-size: 13px; }
        .text-base { font-size: 14px; }
        .text-lg { font-size: 16px; }
        .text-xl { font-size: 18px; }
        .text-2xl { font-size: 20px; }
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
      </style>
    </head>
    <body>
      <div class="salary-slip">
        <div class="text-center border-bottom">
          ${companyDetails.logo ? `<img src="${companyDetails.logo}" style="height: 60px; object-fit: contain; margin: 0 auto 12px auto;" />` : ''}
          <h1 class="text-xl font-bold text-gray-800">${companyDetails.name || "Business Manager"}</h1>
          <div class="text-sm text-gray-500 mt-1">Salary Slip</div>
          <div class="text-sm text-gray-500">${monthName} ${year}</div>
        </div>

        <div class="bg-gray-50 rounded-xl p-4 mb-6">
          <div class="grid-2">
            <div><span class="text-xs text-gray-500">Employee Name</span><br/><span class="font-semibold">${worker.name}</span></div>
            <div><span class="text-xs text-gray-500">Designation</span><br/><span class="font-semibold">${worker.designation}</span></div>
            <div><span class="text-xs text-gray-500">Phone Number</span><br/><span class="font-semibold">${worker.phone || "Not provided"}</span></div>
            <div><span class="text-xs text-gray-500">Employee ID</span><br/><span class="font-mono">${worker._id?.slice(-8)}</span></div>
          </div>
        </div>

        <div class="grid-4">
          <div class="bg-blue-50 rounded-xl p-3 text-center">
            <div class="text-xs text-blue-600">Base Salary</div>
            <div class="text-lg font-bold text-blue-600">₹${formatNumber(basePay)}</div>
          </div>
          <div class="bg-green-50 rounded-xl p-3 text-center">
            <div class="text-xs text-green-600">Total Earnings</div>
            <div class="text-lg font-bold text-green-600">₹${formatNumber(salary.earnings?.totalEarnings)}</div>
          </div>
          <div class="bg-red-50 rounded-xl p-3 text-center">
            <div class="text-xs text-red-600">Total Deductions</div>
            <div class="text-lg font-bold text-red-600">-₹${formatNumber(salary.deductions?.totalDeductions)}</div>
          </div>
          <div class="bg-purple-50 rounded-xl p-3 text-center">
            <div class="text-xs text-purple-600">Net Salary</div>
            <div class="text-lg font-bold text-purple-600">₹${formatNumber(salary.netSalary)}</div>
          </div>
        </div>

        <div class="bg-purple-50 rounded-xl p-4 text-center mb-4">
          <div class="text-sm font-semibold text-purple-600 mb-1">Amount in Words</div>
          <div class="text-sm font-medium">${netSalaryInWords}</div>
        </div>

        <div class="text-center text-xs text-gray-400 mt-4 pt-3 border-top">
          Generated on: ${new Date().toLocaleString('en-IN')}
        </div>
      </div>
    </body>
    </html>
  `;
};