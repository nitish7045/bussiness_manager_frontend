import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { billingAPI } from "../../api/api";
import NewBill from "../../components/billing/NewBill";
import BillManagement from "../../components/billing/BillManagement";
import BankManagement from "../../components/billing/BankManagement";
import ProductsManagement from "../../components/billing/ProductsManagement";
import CustomersManagement from "../../components/billing/CustomersManagement";
import BillingReports from "../../components/billing/BillingReports";
import FileUploadManager from "../../components/billing/FileUploadManager";

export default function BillingDashboard() {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState(() => {
    const savedMenu = localStorage.getItem("billingActiveMenu");
    return savedMenu || "bill";
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem("billingSidebarCollapsed");
    return savedState === "true";
  });
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [latency, setLatency] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("billingUser");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Save states to localStorage
  useEffect(() => {
    localStorage.setItem("billingActiveMenu", activeMenu);
  }, [activeMenu]);

  useEffect(() => {
    localStorage.setItem("billingSidebarCollapsed", isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const checkOnlineStatus = async () => {
    const start = Date.now();
    try {
      await fetch("https://www.google.com", { mode: "no-cors" });
      const end = Date.now();
      setOnlineStatus(true);
      setLatency(end - start);
    } catch (error) {
      setOnlineStatus(false);
      setLatency(0);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        const token = localStorage.getItem("billingToken");
        if (token) {
          await billingAPI.post("/billing/auth/logout", {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (err) {
        console.error("Logout error:", err);
      } finally {
        localStorage.removeItem("billingToken");
        localStorage.removeItem("billingUser");
        localStorage.removeItem("billingActiveMenu");
        localStorage.removeItem("billingSidebarCollapsed");
        navigate("/billing/login");
      }
    }
  };

  const menuItems = [
    { id: "bill", label: "New Bill", icon: "➕", shortLabel: "Bill" },
    { id: "bill_management", label: "Bill Management", icon: "🧾", shortLabel: "Bills" },
    { id: "bank_management", label: "Bank Management", icon: "🏦", shortLabel: "Bank" },
    { id: "products", label: "Products", icon: "📦", shortLabel: "Products" },
    { id: "customers", label: "Customers", icon: "👥", shortLabel: "Customers" },
    { id: "reports", label: "Reports", icon: "📊", shortLabel: "Reports" },
    { id: "upload", label: "Upload Files", icon: "📤", shortLabel: "Upload" },
  ];

  const renderContent = () => {
    switch(activeMenu) {
      case "bill":
        return <NewBill />;
      case "bill_management":
        return <BillManagement />;
      case "bank_management":
        return <BankManagement />;
      case "products":
        return <ProductsManagement />;
      case "customers":
        return <CustomersManagement />;
      case "reports":
        return <BillingReports />;
      case "upload":
        return <FileUploadManager />;
      default:
        return <NewBill />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-blue-700 text-white shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center px-4 py-3">
          {/* Logo and Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-blue-600 rounded-lg transition-colors"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="text-xl">{isSidebarCollapsed ? "☰" : "◀"}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧾</span>
              {!isSidebarCollapsed && (
                <span className="font-semibold hidden sm:inline">Billing System</span>
              )}
            </div>
          </div>
          
          {/* Status and User */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${onlineStatus ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-xs hidden md:inline">
                {onlineStatus ? `${latency} ms` : "Offline"}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user?.fullName?.split(' ')[0]}</p>
                <p className="text-xs text-blue-200">{user?.companyName?.slice(0, 15)}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1"
                title="Logout"
              >
                <span>🚪</span>
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Collapsible */}
        <div 
          className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 sticky top-12 ${
            isSidebarCollapsed ? "w-16" : "w-64"
          }`}
          style={{ height: "calc(100vh - 48px)" }}
        >
          <div className="py-4 overflow-y-auto h-full">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full text-left px-3 py-3 flex items-center gap-3 transition group ${
                  activeMenu === item.id
                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                } ${isSidebarCollapsed ? "justify-center" : ""}`}
                title={isSidebarCollapsed ? item.label : ""}
              >
                <span className="text-lg">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {activeMenu === item.id && (
                      <span className="text-xs text-blue-600">●</span>
                    )}
                  </>
                )}
                {isSidebarCollapsed && (
                  <div className="absolute left-14 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
            
            {/* Divider */}
            <div className={`my-3 ${isSidebarCollapsed ? "mx-2" : "mx-3"} border-t border-gray-200`}></div>
            
            {/* Collapsed Company Info */}
            {isSidebarCollapsed && (
              <div className="px-2 mt-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-blue-600 text-sm font-bold">
                    {user?.companyName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 p-4 transition-all duration-300`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}