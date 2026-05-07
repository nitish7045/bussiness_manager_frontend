// src/pages/PaymentManagement.jsx
import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import PaymentHeader from "../components/payment/PaymentHeader";
import SummaryCards from "../components/payment/SummaryCards";
import PaymentFilters from "../components/payment/PaymentFilters";
import ReceivedPaymentsTable from "../components/payment/ReceivedPaymentsTable";
import BillsTable from "../components/payment/BillsTable";
import AddPaymentModal from "../components/payment/AddPaymentModal";
import AddBillModal from "../components/payment/AddBillModal";

export default function PaymentManagement() {
  // State
  const [receivedPayments, setReceivedPayments] = useState([]);
  const [bills, setBills] = useState([]);
  const [activeTab, setActiveTab] = useState("received");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  
  // Form states
  const [paymentForm, setPaymentForm] = useState({
    payment: "",
    date: new Date().toISOString().split('T')[0],
    company: "AK Enterprises"
  });
  
  const [billForm, setBillForm] = useState({
    company: "AK Enterprises",
    billNo: "",
    site: "",
    date: new Date().toISOString().split('T')[0],
    amount: ""
  });

  const companies = ["AK Enterprises", "KC Enterprises", "Anish Enterprises", "Cash"];

  // Load data from localStorage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedReceived = localStorage.getItem("receivedPayments");
    const savedBills = localStorage.getItem("bills");
    
    if (savedReceived) {
      setReceivedPayments(JSON.parse(savedReceived));
    } else {
      const sampleReceived = [
        { id: 1, srNo: 1, payment: 50000, date: "2024-03-01", company: "AK Enterprises" },
        { id: 2, srNo: 2, payment: 30000, date: "2024-03-05", company: "KC Enterprises" },
        { id: 3, srNo: 3, payment: 20000, date: "2024-03-10", company: "Cash" },
      ];
      setReceivedPayments(sampleReceived);
      localStorage.setItem("receivedPayments", JSON.stringify(sampleReceived));
    }
    
    if (savedBills) {
      setBills(JSON.parse(savedBills));
    } else {
      const sampleBills = [
        { id: 1, company: "AK Enterprises", billNo: "AK-001", site: "Site A", date: "2024-03-02", amount: 25000 },
        { id: 2, company: "KC Enterprises", billNo: "KC-001", site: "Site B", date: "2024-03-06", amount: 15000 },
        { id: 3, company: "Anish Enterprises", billNo: "AN-001", site: "Site C", date: "2024-03-11", amount: 10000 },
      ];
      setBills(sampleBills);
      localStorage.setItem("bills", JSON.stringify(sampleBills));
    }
  };

  const saveData = () => {
    localStorage.setItem("receivedPayments", JSON.stringify(receivedPayments));
    localStorage.setItem("bills", JSON.stringify(bills));
  };

  // Filter functions
  const getFilteredReceived = () => {
    let filtered = [...receivedPayments];
    if (filterCompany !== "all") filtered = filtered.filter(p => p.company === filterCompany);
    if (searchTerm) filtered = filtered.filter(p => 
      p.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payment.toString().includes(searchTerm)
    );
    if (dateRange.start) filtered = filtered.filter(p => p.date >= dateRange.start);
    if (dateRange.end) filtered = filtered.filter(p => p.date <= dateRange.end);
    return filtered;
  };

  const getFilteredBills = () => {
    let filtered = [...bills];
    if (filterCompany !== "all") filtered = filtered.filter(b => b.company === filterCompany);
    if (searchTerm) filtered = filtered.filter(b => 
      b.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.site.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (dateRange.start) filtered = filtered.filter(b => b.date >= dateRange.start);
    if (dateRange.end) filtered = filtered.filter(b => b.date <= dateRange.end);
    return filtered;
  };

  // Received Payments CRUD
  const addPayment = () => {
    if (!paymentForm.payment || !paymentForm.date) {
      alert("Please fill all required fields");
      return;
    }
    
    const newId = editingPayment ? editingPayment.id : Date.now();
    const newSrNo = editingPayment ? editingPayment.srNo : receivedPayments.length + 1;
    
    const newPayment = {
      id: newId,
      srNo: newSrNo,
      payment: parseFloat(paymentForm.payment),
      date: paymentForm.date,
      company: paymentForm.company
    };
    
    let updated = editingPayment 
      ? receivedPayments.map(p => p.id === newId ? newPayment : p)
      : [...receivedPayments, newPayment];
    
    updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    updated = updated.map((p, idx) => ({ ...p, srNo: idx + 1 }));
    
    setReceivedPayments(updated);
    saveData();
    resetPaymentForm();
    setShowPaymentModal(false);
    alert(editingPayment ? "Payment updated!" : "Payment added!");
  };

  const editPayment = (payment) => {
    setEditingPayment(payment);
    setPaymentForm({
      payment: payment.payment,
      date: payment.date,
      company: payment.company
    });
    setShowPaymentModal(true);
  };

  const deletePayment = (id) => {
    if (window.confirm("Delete this payment?")) {
      const updated = receivedPayments.filter(p => p.id !== id).map((p, idx) => ({ ...p, srNo: idx + 1 }));
      setReceivedPayments(updated);
      saveData();
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      payment: "",
      date: new Date().toISOString().split('T')[0],
      company: "AK Enterprises"
    });
    setEditingPayment(null);
  };

  // Bills CRUD
  const addBill = () => {
    if (!billForm.billNo || !billForm.site || !billForm.amount || !billForm.date) {
      alert("Please fill all required fields");
      return;
    }
    
    const newId = editingBill ? editingBill.id : Date.now();
    const newBill = {
      id: newId,
      company: billForm.company,
      billNo: billForm.billNo,
      site: billForm.site,
      date: billForm.date,
      amount: parseFloat(billForm.amount)
    };
    
    let updated = editingBill 
      ? bills.map(b => b.id === newId ? newBill : b)
      : [...bills, newBill];
    
    updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setBills(updated);
    saveData();
    resetBillForm();
    setShowBillModal(false);
    alert(editingBill ? "Bill updated!" : "Bill added!");
  };

  const editBill = (bill) => {
    setEditingBill(bill);
    setBillForm({
      company: bill.company,
      billNo: bill.billNo,
      site: bill.site,
      date: bill.date,
      amount: bill.amount
    });
    setShowBillModal(true);
  };

  const deleteBill = (id) => {
    if (window.confirm("Delete this bill?")) {
      setBills(bills.filter(b => b.id !== id));
      saveData();
    }
  };

  const resetBillForm = () => {
    setBillForm({
      company: "AK Enterprises",
      billNo: "",
      site: "",
      date: new Date().toISOString().split('T')[0],
      amount: ""
    });
    setEditingBill(null);
  };

  // Calculations
  const totalReceived = receivedPayments.reduce((sum, p) => sum + p.payment, 0);
  const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);
  const balance = totalReceived - totalBills;

  // PDF Export
  const exportToPDF = async () => {
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`Payment_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <PaymentHeader />
        <SummaryCards totalReceived={totalReceived} totalBills={totalBills} balance={balance} />
        <PaymentFilters 
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          filterCompany={filterCompany} setFilterCompany={setFilterCompany}
          dateRange={dateRange} setDateRange={setDateRange}
          companies={companies}
        />
        
        {/* Tabs */}
        <div className="mb-4">
          <div className="flex gap-2 border-b border-gray-200">
            <button onClick={() => setActiveTab("received")} className={`px-4 py-2 text-sm font-medium ${activeTab === "received" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>
              Received Payments ({getFilteredReceived().length})
            </button>
            <button onClick={() => setActiveTab("bills")} className={`px-4 py-2 text-sm font-medium ${activeTab === "bills" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>
              Bills ({getFilteredBills().length})
            </button>
          </div>
        </div>
        
        {activeTab === "received" && (
          <ReceivedPaymentsTable 
            payments={getFilteredReceived()}
            onEdit={editPayment}
            onDelete={deletePayment}
            onAdd={() => setShowPaymentModal(true)}
            onExport={exportToPDF}
          />
        )}
        
        {activeTab === "bills" && (
          <BillsTable 
            bills={getFilteredBills()}
            onEdit={editBill}
            onDelete={deleteBill}
            onAdd={() => setShowBillModal(true)}
            onExport={exportToPDF}
          />
        )}
        
        {/* Modals */}
        <AddPaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSave={addPayment}
          editingPayment={editingPayment}
          formData={paymentForm}
          setFormData={setPaymentForm}
          companies={companies}
        />
        
        <AddBillModal 
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          onSave={addBill}
          editingBill={editingBill}
          formData={billForm}
          setFormData={setBillForm}
          companies={companies}
        />
        
        {/* Hidden PDF Content */}
        <div id="report-content" style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', background: 'white', padding: '20px' }}>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Payment Management Report</h1>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Summary</h2>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="bg-green-50 p-3 rounded">Total Received: ₹{totalReceived.toLocaleString()}</div>
              <div className="bg-red-50 p-3 rounded">Total Bills: ₹{totalBills.toLocaleString()}</div>
              <div className="bg-blue-50 p-3 rounded">Balance: ₹{balance.toLocaleString()}</div>
            </div>
          </div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Received Payments</h2>
            <table className="w-full border-collapse">
              <thead><tr className="bg-gray-100"><th className="border p-2">Sr No.</th><th className="border p-2">Amount</th><th className="border p-2">Date</th><th className="border p-2">Company</th></tr></thead>
              <tbody>{getFilteredReceived().map(p => (<tr key={p.id}><td className="border p-2">{p.srNo}</td><td className="border p-2">₹{p.payment.toLocaleString()}</td><td className="border p-2">{p.date}</td><td className="border p-2">{p.company}</td></tr>))}</tbody>
            </table>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Bills</h2>
            <table className="w-full border-collapse">
              <thead><tr className="bg-gray-100"><th className="border p-2">Company</th><th className="border p-2">Bill No.</th><th className="border p-2">Site</th><th className="border p-2">Date</th><th className="border p-2">Amount</th></tr></thead>
              <tbody>{getFilteredBills().map(b => (<tr key={b.id}><td className="border p-2">{b.company}</td><td className="border p-2">{b.billNo}</td><td className="border p-2">{b.site}</td><td className="border p-2">{b.date}</td><td className="border p-2">₹{b.amount.toLocaleString()}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}