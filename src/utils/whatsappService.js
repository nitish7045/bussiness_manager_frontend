// src/utils/whatsappService.js
import API from "../api/api";

class WhatsAppService {
  constructor() {
    this.sendingQueue = [];
    this.isProcessing = false;
    this.callbacks = {
      onProgress: null,
      onSuccess: null,
      onError: null,
      onComplete: null
    };
  }

  // Set callbacks for monitoring
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Send text message
  async sendTextMessage(phoneNumber, message, workerId, workerName) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      if (!formattedNumber) {
        throw new Error("Invalid phone number");
      }

      const response = await API.post("/broadcast/send-whatsapp", {
        phoneNumber: formattedNumber,
        message: message,
        workerId: workerId,
        workerName: workerName,
        messageType: "text"
      });

      return response.data;
    } catch (error) {
      console.error("WhatsApp send error:", error);
      throw error;
    }
  }

  // Send PDF file via WhatsApp (using backend API)
  async sendPDFMessage(phoneNumber, message, pdfBlob, pdfName, workerId, workerName, metadata = {}) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      if (!formattedNumber) {
        throw new Error("Invalid phone number");
      }

      // Convert PDF blob to base64
      const base64 = await this.blobToBase64(pdfBlob);
      
      const response = await API.post("/broadcast/send-pdf-whatsapp", {
        phoneNumber: formattedNumber,
        message: message,
        pdfBase64: base64,
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

  // Send bulk messages with queue processing
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
            item.workerName
          );
        }
        
        results.success++;
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: items.length,
            currentItem: item.workerName,
            successCount: results.success,
            failCount: results.failed
          });
        }
        
      } catch (error) {
        results.failed++;
        results.failedItems.push({
          workerName: item.workerName,
          phoneNumber: item.phoneNumber,
          error: error.message
        });
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: items.length,
            currentItem: item.workerName,
            successCount: results.success,
            failCount: results.failed,
            error: error.message
          });
        }
      }
      
      // Delay between messages to avoid rate limiting
      if (i < items.length - 1) {
        await this.delay(batchDelay);
      }
    }
    
    return results;
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

  // Delay helper
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new WhatsAppService();