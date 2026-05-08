// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"; // Remove BrowserRouter
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

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

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

  // Redirect to login if not authenticated and not on billing login
  useEffect(() => {
    if (!isLoading && !isLoggedIn && location.pathname !== "/billing/login") {
      navigate("/login");
    }
  }, [isLoading, isLoggedIn, location, navigate]);

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
    <div className="flex">
      <Sidebar 
        setPage={setCurrentPage} 
        onCollapse={setIsSidebarCollapsed}
        isCollapsed={isSidebarCollapsed}
      />
      <main 
        className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100"
        style={{ 
          marginLeft: isSidebarCollapsed ? "64px" : "256px",
          minHeight: "100vh",
          transition: "margin-left 0.3s ease"
        }}
      >
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/advance" element={<AdvanceManagement />} />
          <Route path="/salary" element={<SalaryManagement />} />
          <Route path="/companysetting" element={<CompanySettings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/billing/dashboard" element={
            <BillingProtectedRoute>
              <BillingDashboard />
            </BillingProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;