// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import Attendance from "./pages/Attendance";
import Login from "./pages/Login";
import AdvanceManagement from "./pages/advance";
import SalaryManagement from "./pages/salary";
import CompanySettings from "./pages/CompanySettings";
import Reports from "./pages/Reports";
import BillingLogin from "./pages/billing/BillingLogin";
import BillingDashboard from "./pages/billing/BillingDashboard";
import BillingProtectedRoute from "./components/billing/BillingProtectedRoute";
import BroadcastMessage from "./pages/BroadcastMessage";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      setIsLoading(false);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  // Handle sidebar collapse state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === "true");
    }
  }, []);

  const handleSidebarCollapse = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem("sidebarCollapsed", collapsed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // If on login page or billing login, don't show sidebar
  if (!isLoggedIn || location.pathname === "/login" || location.pathname === "/billing/login") {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/billing/login" element={<BillingLogin />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        setPage={setCurrentPage} 
        onCollapse={handleSidebarCollapse}
        isCollapsed={isSidebarCollapsed}
      />
      <main 
        className="flex-1 overflow-x-auto bg-gradient-to-br from-gray-50 to-gray-100"
        style={{ 
          marginLeft: 0,
          width: isSidebarCollapsed ? "calc(100% - 64px)" : "calc(100% - 256px)",
          minHeight: "100vh",
          transition: "all 0.3s ease"
        }}
      >
        <div className="w-full">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/advance" element={<AdvanceManagement />} />
            <Route path="/salary" element={<SalaryManagement />} />
            <Route path="/companysetting" element={<CompanySettings />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/broadcast" element={<BroadcastMessage />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/billing/dashboard" element={
              <BillingProtectedRoute>
                <BillingDashboard />
              </BillingProtectedRoute>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;