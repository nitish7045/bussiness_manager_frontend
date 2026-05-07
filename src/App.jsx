import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import Attendance from "./pages/Attendance";
import Login from "./pages/Login";
import AdvanceManagement from "./pages/advance";
import SalaryManagement from "./pages/salary";
import CompanySettings from "./pages/CompanySettings";
import Reports from "./pages/Reports";
// Add these imports at the top
import BillingLogin from "./pages/billing/BillingLogin";
import BillingDashboard from "./pages/billing/BillingDashboard";
import BillingProtectedRoute from "./components/billing/BillingProtectedRoute";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isLoggedIn = localStorage.getItem("token");


  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <Router>
      <div className="flex">
        <Sidebar setPage={setCurrentPage} onCollapse={setIsSidebarCollapsed} />
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

            
// Add these routes inside your Router
<Route path="/billing/login" element={<BillingLogin />} />
<Route path="/billing/dashboard" element={
  <BillingProtectedRoute>
    <BillingDashboard />
  </BillingProtectedRoute>
} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;