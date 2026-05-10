// src/services/whatsappService.js
import API from "../api/api";

class WhatsAppService {
  constructor() {
    this.sendingQueue = [];
    this.isProcessing = false;
    this.callbacks = {};
  }

  // Format phone number for India
  formatPhoneNumber(number) {
    if (!number) return null;
    let cleaned = number.toString().replace(/\D/g, "");
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return cleaned;
    }
    return null;
  }

  // Convert blob to base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // =============================================
  // FORMAT SALARY SLIP MESSAGE (Matches your SalarySlip component)
  // =============================================
  formatSalarySlipMessage(worker, salary, companyDetails, month, year) {
    const monthName = this.getMonthName(month);
    const basePay = worker.wages?.monthly || worker.monthlySalary || 0;
    const dailySalary = salary.dailySalary || (basePay / 30);
    const hourlySalary = dailySalary / 8;
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const totalPresentDays = (salary.attendance?.weekdayPresent || 0) + (salary.attendance?.sundayPresent || 0);
    const leaveDays = totalDaysInMonth - totalPresentDays - (salary.attendance?.halfDays || 0);
    const netSalaryInWords = this.numberToWords(salary.netSalary || 0);
    
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

    let earningsBreakdown = `• Weekday Present: ${salary.attendance?.weekdayPresent || 0} × ₹${formatNumberWithDecimals(dailySalary)} = ₹${formatNumberWithDecimals(salary.earnings?.weekdayPay)}`;
    
    if (salary.attendance?.weekdayHalf > 0) {
      earningsBreakdown += `\n• Weekday Half Day: ${salary.attendance?.weekdayHalf} × ₹${formatNumberWithDecimals(dailySalary * 0.5)} = ₹${formatNumberWithDecimals(salary.earnings?.weekdayHalfPay)}`;
    }
    if (salary.attendance?.sundayPresent > 0) {
      earningsBreakdown += `\n• Sunday Present (Double Pay): ${salary.attendance?.sundayPresent} × ₹${formatNumberWithDecimals(dailySalary * 2)} = ₹${formatNumberWithDecimals(salary.earnings?.sundayPresentPay)}`;
    }
    if (salary.attendance?.sundayHalf > 0) {
      earningsBreakdown += `\n• Sunday Half Day (1.5x): ${salary.attendance?.sundayHalf} × ₹${formatNumberWithDecimals(dailySalary * 1.5)} = ₹${formatNumberWithDecimals(salary.earnings?.sundayHalfPay)}`;
    }
    if (salary.attendance?.sundayHoliday > 0) {
      earningsBreakdown += `\n• Sunday Holiday: ${salary.attendance?.sundayHoliday} × ₹${formatNumberWithDecimals(dailySalary)} = ₹${formatNumberWithDecimals(salary.earnings?.sundayHolidayPay)}`;
    }
    if (salary.attendance?.otherHolidays > 0) {
      earningsBreakdown += `\n• Other Holidays: ${salary.attendance?.otherHolidays} × ₹${formatNumberWithDecimals(dailySalary)} = ₹${formatNumberWithDecimals(salary.earnings?.otherHolidayPay)}`;
    }
    if (salary.attendance?.overtimeHours > 0) {
      earningsBreakdown += `\n• Overtime: ${salary.attendance?.overtimeHours} hrs × ₹${formatNumberWithDecimals(hourlySalary)} = ₹${formatNumberWithDecimals(salary.earnings?.overtimePay)}`;
    }

    let deductionsBreakdown = "";
    if (salary.deductions?.monthlyAdvanceDeducted > 0) {
      deductionsBreakdown += `• Monthly Advance Deduction: ₹${formatNumber(salary.deductions?.monthlyAdvanceDeducted)}\n`;
    }
    if (salary.deductions?.loanDeducted > 0) {
      deductionsBreakdown += `• Loan Deduction: ₹${formatNumber(salary.deductions?.loanDeducted)}\n`;
    }

    let carryForwardSection = "";
    if (salary.carryForwardToNext?.monthlyAdvance > 0 || salary.carryForwardToNext?.loan > 0) {
      carryForwardSection = `*⏩ CARRY FORWARD TO NEXT MONTH*
• Monthly Advance Remaining: ₹${formatNumber(salary.carryForwardToNext?.monthlyAdvance)}
• Loan Remaining: ₹${formatNumber(salary.carryForwardToNext?.loan)}

━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    let paymentDetailsSection = "";
    if (salary.paymentDetails?.paidAt) {
      paymentDetailsSection = `*💳 PAYMENT DETAILS*
• Payment Date: ${new Date(salary.paymentDetails.paidAt).toLocaleDateString('en-IN')}
• Payment Method: ${salary.paymentDetails.paymentMethod}
${salary.paymentDetails.paymentNotes ? `• Notes: ${salary.paymentDetails.paymentNotes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    return `*🏢 ${companyDetails?.name || "Business Manager"}*
━━━━━━━━━━━━━━━━━━━━━━━

*💰 Salary Slip for ${monthName} ${year}*

━━━━━━━━━━━━━━━━━━━━━━━
*📋 EMPLOYEE DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${worker.name}
📌 *Designation:* ${worker.designation || "N/A"}
🆔 *ID:* ${worker._id?.slice(-8) || "N/A"}
📞 *Phone:* ${worker.phone || "Not provided"}

━━━━━━━━━━━━━━━━━━━━━━━
*💰 SALARY SUMMARY*
━━━━━━━━━━━━━━━━━━━━━━━

💵 *Base Salary:* ₹${formatNumber(basePay)}
✨ *Total Earnings:* ₹${formatNumber(salary.earnings?.totalEarnings)}
📉 *Total Deductions:* ₹${formatNumber(salary.deductions?.totalDeductions)}

━━━━━━━━━━━━━━━━━━━━━━━
*✨ NET SALARY: ₹${formatNumber(salary.netSalary)}*
━━━━━━━━━━━━━━━━━━━━━━━

*📝 Amount in Words:*
${netSalaryInWords}

━━━━━━━━━━━━━━━━━━━━━━━
*📊 ATTENDANCE SUMMARY*
━━━━━━━━━━━━━━━━━━━━━━━

✅ *Present Days:* ${totalPresentDays}
🌓 *Half Days:* ${salary.attendance?.weekdayHalf || 0}
❌ *Leave Days:* ${leaveDays}
⏰ *Overtime Hours:* ${salary.attendance?.overtimeHours || 0}
📅 *Total Days:* ${totalDaysInMonth}

━━━━━━━━━━━━━━━━━━━━━━━
*📈 EARNINGS BREAKDOWN*
━━━━━━━━━━━━━━━━━━━━━━━

${earningsBreakdown}

━━━━━━━━━━━━━━━━━━━━━━━
*📉 DEDUCTIONS*
━━━━━━━━━━━━━━━━━━━━━━━

${deductionsBreakdown || "• No deductions"}

━━━━━━━━━━━━━━━━━━━━━━━
${carryForwardSection}${paymentDetailsSection}*📅 Generated on:* ${new Date().toLocaleString('en-IN')}

━━━━━━━━━━━━━━━━━━━━━━━
*${companyDetails?.name || "Business Manager"}*
_Your trusted business partner_`;
  }

  // =============================================
  // NUMBER TO WORDS (Matches your SalarySlip component)
  // =============================================
  numberToWords(num) {
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
  }

  // =============================================
  // SEND TEXT MESSAGE ONLY
  // =============================================
  async sendTextMessage(phoneNumber, message, workerId, workerName, metadata = {}) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      if (!formattedNumber) {
        throw new Error("Invalid phone number");
      }

      const response = await API.post("/whatsapp/send-text", {
        to: formattedNumber,
        text: message,
        workerId: workerId,
        workerName: workerName,
        metadata: metadata
      });

      return response.data;
    } catch (error) {
      console.error("WhatsApp text send error:", error);
      throw error;
    }
  }

  // =============================================
  // SEND PDF VIA WHATSAPP
  // =============================================
  async sendPDFMessage(phoneNumber, message, pdfBlob, pdfName, workerId, workerName, metadata = {}) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      if (!formattedNumber) {
        throw new Error("Invalid phone number");
      }

      let pdfBase64 = null;
      if (pdfBlob) {
        pdfBase64 = await this.blobToBase64(pdfBlob);
      }

      const response = await API.post("/whatsapp/send-pdf", {
        to: formattedNumber,
        caption: message,
        pdfBase64: pdfBase64,
        pdfName: pdfName,
        workerId: workerId,
        workerName: workerName,
        metadata: metadata
      });

      return response.data;
    } catch (error) {
      console.error("WhatsApp PDF send error:", error);
      throw error;
    }
  }

  // =============================================
  // SEND FULL SALARY SLIP (Detailed message + PDF)
  // =============================================
  async sendFullSalarySlip(worker, salary, companyDetails, month, year, pdfBlob = null) {
    const message = this.formatSalarySlipMessage(worker, salary, companyDetails, month, year);
    const monthName = this.getMonthName(month);
    const pdfName = `Salary_Slip_${worker.name.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName}_${year}.pdf`;
    
    if (pdfBlob) {
      return await this.sendPDFMessage(
        worker.phone,
        message,
        pdfBlob,
        pdfName,
        worker._id,
        worker.name,
        {
          type: "full_salary_slip",
          month: month,
          year: year,
          netSalary: salary.netSalary,
          hasPDF: true
        }
      );
    } else {
      return await this.sendTextMessage(
        worker.phone,
        message,
        worker._id,
        worker.name,
        {
          type: "full_salary_slip_text",
          month: month,
          year: year,
          netSalary: salary.netSalary
        }
      );
    }
  }

  // =============================================
  // SEND BULK MESSAGES (Generic)
  // =============================================
  async sendBulkMessages(items, onProgress, batchDelay = 1000) {
    const results = {
      total: items.length,
      success: 0,
      failed: 0,
      failedItems: []
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        if (item.type === "pdf" && item.pdfBlob) {
          await this.sendPDFMessage(
            item.phoneNumber,
            item.message,
            item.pdfBlob,
            item.pdfName,
            item.workerId,
            item.workerName,
            item.metadata
          );
        } else {
          await this.sendTextMessage(
            item.phoneNumber,
            item.message,
            item.workerId,
            item.workerName,
            item.metadata
          );
        }
        
        results.success++;
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: items.length,
            currentItem: item.workerName,
            successCount: results.success,
            failCount: results.failed,
            type: item.type || "text"
          });
        }
        
      } catch (error) {
        results.failed++;
        results.failedItems.push({
          workerName: item.workerName,
          phoneNumber: item.phoneNumber,
          error: error.response?.data?.message || error.message
        });
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: items.length,
            currentItem: item.workerName,
            successCount: results.success,
            failCount: results.failed,
            error: error.response?.data?.message || error.message,
            type: item.type || "text"
          });
        }
      }
      
      if (i < items.length - 1) {
        await this.delay(batchDelay);
      }
    }
    
    return results;
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================
  getMonthName(month) {
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return months[month - 1];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =============================================
  // CONNECTION MANAGEMENT
  // =============================================
  async checkConnectionStatus() {
    try {
      const response = await API.get("/whatsapp/status");
      return response.data;
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      return { success: false, connected: false };
    }
  }

  async getQRCode() {
    try {
      const response = await API.get("/whatsapp/qr");
      return response.data;
    } catch (error) {
      console.error("Error getting QR code:", error);
      throw error;
    }
  }

  async initialize() {
    try {
      const response = await API.post("/whatsapp/init");
      return response.data;
    } catch (error) {
      console.error("Error initializing WhatsApp:", error);
      throw error;
    }
  }

  async reconnect() {
    try {
      const response = await API.post("/whatsapp/reconnect");
      return response.data;
    } catch (error) {
      console.error("Error reconnecting WhatsApp:", error);
      throw error;
    }
  }

  async logout() {
    try {
      const response = await API.post("/whatsapp/logout");
      return response.data;
    } catch (error) {
      console.error("Error logging out from WhatsApp:", error);
      throw error;
    }
  }
}

export default new WhatsAppService();