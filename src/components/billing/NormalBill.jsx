import React, { useState, useEffect, useRef } from "react";
import { billingAPI } from "../../api/api";

export default function NormalBill({ company, onBack, billType }) {
  const [billNo, setBillNo] = useState(1);
  const [editBillNo, setEditBillNo] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [toAddress, setToAddress] = useState("");
  const [site, setSite] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [amountInWords, setAmountInWords] = useState("Zero Only");
  const [roundTotal, setRoundTotal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [banks, setBanks] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [customers, setCustomers] = useState([]);
  
  // Manual row modal state
  const [showManualRowModal, setShowManualRowModal] = useState(false);
  const [manualRowText, setManualRowText] = useState("");
  const [includeSerial, setIncludeSerial] = useState(true);
  const [isBlankRow, setIsBlankRow] = useState(false);
  
  // Form fields for new item
  const [newItem, setNewItem] = useState({
    particular: "",
    notes: "",
    qty: 1,
    unit: "",
    rate: 0
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const particularRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    fetchLastBillNo();
    fetchProducts();
    fetchBanks();
    fetchCustomers();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Update total when items change
  useEffect(() => {
    calculateTotal();
  }, [items, roundTotal]);

  // Recalculate serial numbers whenever items change (only for rows with serial numbers)
  const recalculateSerialNumbers = (itemsList) => {
    let serialCounter = 1;
    return itemsList.map(item => {
      // Only assign serial number if the row should have one and it's not a blank row
      if (item.hasSerial === true && !item.isBlankRow) {
        return { ...item, srNo: serialCounter++ };
      }
      return { ...item, srNo: null };
    });
  };

  const fetchLastBillNo = async () => {
    try {
      const res = await billingAPI.get(`/billing/invoices/last-bill-no/normal`);
      if (res.data.lastBillNo) {
        setBillNo(res.data.lastBillNo + 1);
      }
    } catch (err) {
      console.error("Error fetching last bill no:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await billingAPI.get("/billing/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await billingAPI.get("/billing/banks");
      setBanks(res.data);
    } catch (err) {
      console.error("Error fetching banks:", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await billingAPI.get("/billing/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    function convertLessThanThousand(n) {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    }
    
    if (num === 0) return 'Zero Rupees Only';
    
    let rupees = Math.floor(num);
    let paise = Math.round((num - rupees) * 100);
    let result = '';
    
    if (rupees >= 10000000) {
      result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
      rupees %= 10000000;
    }
    if (rupees >= 100000) {
      result += convertLessThanThousand(Math.floor(rupees / 100000)) + ' Lakh ';
      rupees %= 100000;
    }
    if (rupees >= 1000) {
      result += convertLessThanThousand(Math.floor(rupees / 1000)) + ' Thousand ';
      rupees %= 1000;
    }
    if (rupees >= 100) {
      result += convertLessThanThousand(Math.floor(rupees / 100)) + ' Hundred ';
      rupees %= 100;
    }
    if (rupees > 0) {
      result += convertLessThanThousand(rupees) + ' ';
    }
    
    result += 'Rupees';
    if (paise > 0) {
      result += ' and ' + convertLessThanThousand(paise) + ' Paise';
    }
    return result + ' Only';
  };

  const calculateTotal = () => {
    let sum = items.reduce((acc, item) => {
      // Only add amount if it's a valid number and not a blank/description row
      if (item.amount && typeof item.amount === 'number' && !isNaN(item.amount)) {
        return acc + item.amount;
      }
      return acc;
    }, 0);
    if (roundTotal) {
      sum = Math.round(sum);
    }
    setTotal(sum);
    setAmountInWords(numberToWords(sum));
  };

  const handleProductSelect = (product) => {
    setNewItem({
      particular: product.name,
      notes: "",
      qty: 1,
      unit: product.unit || "NOS",
      rate: product.unitPrice
    });
    setSearchTerm(product.name);
    setShowDropdown(false);
  };

  const addItem = () => {
    if (!newItem.particular) {
      alert("Please select a product");
      return;
    }
    
    if (newItem.qty <= 0 || newItem.rate <= 0) {
      alert("Please enter valid quantity and rate");
      return;
    }
    
    const amount = newItem.qty * newItem.rate;
    const displayName = newItem.notes ? `${newItem.particular} (${newItem.notes})` : newItem.particular;
    
    // Calculate next serial number
    const nextSerial = items.filter(item => item.hasSerial === true && !item.isBlankRow).length + 1;
    
    const newRow = {
      srNo: nextSerial,
      particular: displayName,
      qty: newItem.qty,
      unit: newItem.unit,
      rate: newItem.rate,
      amount: amount,
      isBold: false,
      isCentered: false,
      hasSerial: true,
      isBlankRow: false
    };
    
    setItems([...items, newRow]);
    
    // Reset form
    setNewItem({
      particular: "",
      notes: "",
      qty: 1,
      unit: "",
      rate: 0
    });
    setSearchTerm("");
  };

  const deleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    // Recalculate serial numbers only for rows that should have them
    const updatedItems = recalculateSerialNumbers(newItems);
    setItems(updatedItems);
  };

  const editItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    
    // Recalculate amount if qty or rate changes
    if (field === 'qty' || field === 'rate') {
      const qty = updatedItems[index].qty || 0;
      const rate = updatedItems[index].rate || 0;
      updatedItems[index].amount = qty * rate;
    }
    
    setItems(updatedItems);
  };

  const toggleBold = (index) => {
    const updatedItems = [...items];
    updatedItems[index].isBold = !updatedItems[index].isBold;
    setItems(updatedItems);
  };

  const toggleCenter = (index) => {
    const updatedItems = [...items];
    updatedItems[index].isCentered = !updatedItems[index].isCentered;
    setItems(updatedItems);
  };

  const insertManualRow = () => {
    setManualRowText("");
    setIncludeSerial(true);
    setIsBlankRow(false);
    setShowManualRowModal(true);
  };

  const insertBlankRow = () => {
    const newRow = {
      srNo: null,
      particular: "",
      qty: "",
      unit: "",
      rate: "",
      amount: null,
      isBold: false,
      isCentered: false,
      hasSerial: false,
      isBlankRow: true
    };
    
    setItems([...items, newRow]);
  };

  const confirmManualRow = () => {
    if (isBlankRow) {
      // Insert blank row
      const newRow = {
        srNo: null,
        particular: "",
        qty: "",
        unit: "",
        rate: "",
        amount: null,
        isBold: false,
        isCentered: false,
        hasSerial: false,
        isBlankRow: true
      };
      setItems([...items, newRow]);
    } else if (manualRowText.trim()) {
      let nextSerial = null;
      
      if (includeSerial) {
        // Calculate next serial number based on existing rows that have serial numbers
        nextSerial = items.filter(item => item.hasSerial === true && !item.isBlankRow).length + 1;
      }
      
      const newRow = {
        srNo: nextSerial,
        particular: manualRowText,
        qty: "",
        unit: "",
        rate: "",
        amount: null,
        isBold: false,
        isCentered: false,
        hasSerial: includeSerial,
        isBlankRow: false
      };
      
      setItems([...items, newRow]);
    }
    
    // Reset modal state
    setManualRowText("");
    setIncludeSerial(true);
    setIsBlankRow(false);
    setShowManualRowModal(false);
  };

  const moveRow = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const updatedItems = [...items];
    [updatedItems[index], updatedItems[newIndex]] = [updatedItems[newIndex], updatedItems[index]];
    
    // Recalculate serial numbers after moving
    const renumberedItems = recalculateSerialNumbers(updatedItems);
    setItems(renumberedItems);
  };

  const selectBank = () => {
    if (banks.length === 0) {
      alert("No banks found. Please add a bank first.");
      return;
    }
    
    const bankList = banks.map((bank, idx) => 
      `${idx + 1}. ${bank.bankName} - ${bank.accountNo}`
    ).join("\n");
    
    const selected = prompt(`Select a Bank:\n\n${bankList}\n\nEnter bank number:`);
    if (selected) {
      const index = parseInt(selected) - 1;
      if (index >= 0 && index < banks.length) {
        setSelectedBank(banks[index]);
        alert(`Bank "${banks[index].bankName}" selected successfully!`);
      }
    }
  };

  const selectCustomer = (customer) => {
    setToAddress(customer.toAddress || "");
    setSite(customer.site || "");
    setShowCustomerSelector(false);
  };

  const saveInvoice = async () => {
    if (!toAddress && !site) {
      alert("Please enter To Address or Site");
      return;
    }
    
    if (items.length === 0) {
      alert("Please add items to the invoice");
      return;
    }
    
    try {
      const invoiceData = {
        companyId: company._id,
        billNo: billNo,
        date: date,
        toAddress: toAddress,
        site: site,
        items: items.map(item => ({
          name: item.particular,
          quantity: item.qty,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
          isBold: item.isBold || false,
          isCentered: item.isCentered || false,
          hasSerial: item.hasSerial === true,
          isBlankRow: item.isBlankRow || false
        })),
        total: total,
        amountInWords: amountInWords,
        bankDetails: selectedBank ? {
          bankName: selectedBank.bankName,
          accountNo: selectedBank.accountNumber,
          ifscCode: selectedBank.ifscCode
        } : null
      };
      
      await billingAPI.post("/billing/invoices/normal", invoiceData);
      alert(`Invoice ${billNo} saved successfully!`);
      
      // Start new invoice
      setBillNo(billNo + 1);
      setToAddress("");
      setSite("");
      setItems([]);
      setSelectedBank(null);
    } catch (err) {
      console.error("Error saving invoice:", err);
      alert("Error saving invoice");
    }
  };

  const clearAll = () => {
    if (window.confirm("Are you sure you want to clear all items?")) {
      setItems([]);
    }
  };

  const newInvoice = () => {
    if (window.confirm("Start a new invoice? Unsaved changes will be lost.")) {
      setBillNo(billNo + 1);
      setToAddress("");
      setSite("");
      setItems([]);
      setSelectedBank(null);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null || num === "") return "";
    if (typeof num === 'number' && !isNaN(num) && num !== 0) {
      return num.toLocaleString('en-IN');
    }
    return "";
  };

  const displayAmount = (item) => {
    if (item.isBlankRow) return "";
    if (item.amount && typeof item.amount === 'number' && !isNaN(item.amount) && item.amount !== 0) {
      return `₹${formatNumber(item.amount)}`;
    }
    return "";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">🧾 Normal Bill - {company.name}</h2>
      
      {/* Header with Calculator and Customer Selector */}
      <div className="mb-4">
        <button
          onClick={() => window.open("https://www.google.com/search?q=calculator", "_blank")}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          🧮 Calculator
        </button>
      </div>
      
      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Address</label>
          <div className="flex gap-2">
            <textarea
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              rows="3"
              className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer address"
            />
            <button
              onClick={() => setShowCustomerSelector(true)}
              className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
            >
              📂 Select
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
          <textarea
            value={site}
            onChange={(e) => setSite(e.target.value)}
            rows="3"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Enter site name"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill No</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={billNo}
              onChange={(e) => setBillNo(parseInt(e.target.value))}
              readOnly={!editBillNo}
              className={`w-32 border border-gray-300 rounded-lg p-2 ${!editBillNo ? 'bg-gray-100' : ''}`}
            />
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={editBillNo}
                onChange={(e) => setEditBillNo(e.target.checked)}
                className="rounded"
              />
              Edit
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
      </div>
      
      {/* Add Item Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">Add Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <input
              ref={particularRef}
              type="text"
              placeholder="Particular"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
                setNewItem({...newItem, particular: e.target.value});
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product._id}
                    onClick={() => handleProductSelect(product)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.unit} - ₹{product.unitPrice}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Notes"
              value={newItem.notes}
              onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Qty"
              value={newItem.qty}
              onChange={(e) => setNewItem({...newItem, qty: parseFloat(e.target.value) || 0})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Unit"
              value={newItem.unit}
              onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Rate"
              value={newItem.rate}
              onChange={(e) => setNewItem({...newItem, rate: parseFloat(e.target.value) || 0})}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
          <button
            onClick={addItem}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕ Add Item
          </button>
        </div>
      </div>
      
      {/* Items Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 border w-16">SR</th>
              <th className="px-3 py-2 border">PARTICULAR</th>
              <th className="px-3 py-2 border w-20">QTY</th>
              <th className="px-3 py-2 border w-16">UNIT</th>
              <th className="px-3 py-2 border w-24">RATE</th>
              <th className="px-3 py-2 border w-28">AMOUNT</th>
              <th className="px-3 py-2 border w-20">STYLE</th>
              <th className="px-3 py-2 border w-32">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">No items added</td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className={`border-t ${item.isBlankRow ? 'bg-gray-50' : ''}`}>
                  <td className="px-3 py-2 text-center text-gray-600">
                    {item.srNo ? item.srNo : ""}
                  </td>
                  <td className={`px-3 py-2 ${item.isBold ? 'font-bold' : ''} ${item.isCentered ? 'text-center' : ''}`}>
                    {item.isBlankRow ? (
                      <div className="h-6"></div>
                    ) : (
                      <input
                        type="text"
                        value={item.particular}
                        onChange={(e) => editItem(idx, 'particular', e.target.value)}
                        className={`w-full border rounded p-1 ${item.isBold ? 'font-bold' : ''} ${item.isCentered ? 'text-center' : ''}`}
                        placeholder={item.isBlankRow ? "" : "Enter text..."}
                      />
                    )}
                   </td>
                  <td className="px-3 py-2">
                    {item.isBlankRow ? (
                      <div className="h-6"></div>
                    ) : (
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => editItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                        className="w-20 border rounded p-1 text-center"
                      />
                    )}
                   </td>
                  <td className="px-3 py-2">
                    {item.isBlankRow ? (
                      <div className="h-6"></div>
                    ) : (
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => editItem(idx, 'unit', e.target.value)}
                        className="w-16 border rounded p-1"
                      />
                    )}
                   </td>
                  <td className="px-3 py-2">
                    {item.isBlankRow ? (
                      <div className="h-6"></div>
                    ) : (
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => editItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-24 border rounded p-1 text-right"
                      />
                    )}
                   </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {displayAmount(item)}
                   </td>
                  <td className="px-3 py-2 text-center">
                    {!item.isBlankRow && (
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => toggleBold(idx)}
                          className={`px-2 py-1 rounded text-xs font-bold ${item.isBold ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          onClick={() => toggleCenter(idx)}
                          className={`px-2 py-1 rounded text-xs ${item.isCentered ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                          title="Center"
                        >
                          C
                        </button>
                      </div>
                    )}
                   </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => moveRow(idx, -1)}
                        className="text-gray-600 hover:text-gray-800 px-1"
                        title="Move Up"
                      >
                        ⬆
                      </button>
                      <button
                        onClick={() => moveRow(idx, 1)}
                        className="text-gray-600 hover:text-gray-800 px-1"
                        title="Move Down"
                      >
                        ⬇
                      </button>
                      <button
                        onClick={() => deleteItem(idx)}
                        className="text-red-600 hover:text-red-800 px-1"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                   </td>
                 </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Action Buttons for Table */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => deleteItem(items.length - 1)}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          🗑 Delete Last Line
        </button>
        <button
          onClick={insertManualRow}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          📝 Insert Text Row
        </button>
        <button
          onClick={insertBlankRow}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          📄 Insert Blank Row (Spacing)
        </button>
      </div>
      
      {/* Manual Row Modal */}
      {showManualRowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 rounded-t-xl flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Insert Manual Row</h2>
              <button onClick={() => setShowManualRowModal(false)} className="text-white hover:text-gray-200 text-xl">
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Row Type</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isBlankRow}
                      onChange={() => setIsBlankRow(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Text Row</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isBlankRow}
                      onChange={() => setIsBlankRow(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Blank Row (Spacing)</span>
                  </label>
                </div>
              </div>
              
              {!isBlankRow && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Row Text / Description</label>
                    <textarea
                      value={manualRowText}
                      onChange={(e) => setManualRowText(e.target.value)}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter text for this row (e.g., 'Transport charges', 'Discount', 'Note: Payment within 7 days')..."
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This text will appear in the PARTICULAR column
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeSerial}
                        onChange={(e) => setIncludeSerial(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Include Serial Number</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {includeSerial 
                            ? "Row will be numbered sequentially (1, 2, 3...)" 
                            : "Row will show blank in SR column and won't affect other serial numbers"}
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              )}
              
              {isBlankRow && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Blank rows are useful for spacing and visual separation. They will not affect serial numbers or totals.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={confirmManualRow}
                  disabled={!isBlankRow && !manualRowText.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {isBlankRow ? "Insert Blank Row" : "Insert Text Row"}
                </button>
                <button
                  onClick={() => setShowManualRowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Total Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">TOTAL:</span>
            <span className="text-2xl font-bold text-blue-600">
              ₹{formatNumber(roundTotal ? Math.round(total) : total) || "0"}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-medium whitespace-nowrap">Amount in words:</span>
            <span className="italic text-gray-600 truncate">{amountInWords}</span>
          </div>
          <button
            onClick={() => setRoundTotal(!roundTotal)}
            className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 transition-colors"
          >
            🔄 {roundTotal ? "Use Exact Total" : "Use Rounded Total"}
          </button>
        </div>
      </div>
      
      {/* Main Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => alert("Preview feature coming soon")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          👁 Preview Bill
        </button>
        <button
          onClick={saveInvoice}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          💾 Save Invoice
        </button>
        <button
          onClick={newInvoice}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          🆕 New Invoice
        </button>
        <button
          onClick={clearAll}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          🗑 Clear All
        </button>
        <button
          onClick={selectBank}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          🏦 Select Bank
        </button>
        <button
          onClick={onBack}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ⬅️ Back
        </button>
      </div>
      
      {/* Customer Selector Modal */}
      {showCustomerSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 rounded-t-xl flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Select Customer</h2>
              <button onClick={() => setShowCustomerSelector(false)} className="text-white hover:text-gray-200 text-xl">
                ✕
              </button>
            </div>
            <div className="p-4">
              {customers.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No customers found</p>
              ) : (
                customers.map(customer => (
                  <div
                    key={customer._id}
                    onClick={() => selectCustomer(customer)}
                    className="border rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">{customer.site || "No Site"}</div>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">{customer.toAddress}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}