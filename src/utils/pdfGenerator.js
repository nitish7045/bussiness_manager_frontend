// src/utils/pdfGenerator.js
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

class PDFGenerator {
  async generateSalarySlipPDF(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      quality: 0.9
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
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
    let position = 10;
    
    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
    
    while (heightLeft > 0) {
      position = position - pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }
    
    return pdf.output('blob');
  }
  
  async downloadPDF(elementId, fileName) {
    const blob = await this.generateSalarySlipPDF(elementId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default new PDFGenerator();