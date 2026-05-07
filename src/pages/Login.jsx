import { useState } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useState(false);

  const isLoggedIn =
    localStorage.getItem("token");

  return (
    <Router>
      {!isLoggedIn ? (
        <Routes>
          <Route
            path="*"
            element={<Login />}
          />

          <Route
            path="/billing/login"
            element={<BillingLogin />}
          />
        </Routes>
      ) : (
        <div className="flex">
          <Sidebar
            onCollapse={setIsSidebarCollapsed}
          />

          <main
            className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100"
            style={{
              marginLeft:
                isSidebarCollapsed
                  ? "64px"
                  : "256px",

              minHeight: "100vh",

              transition:
                "margin-left 0.3s ease",
            }}
          >
            <Routes>
              {/* MAIN ROUTES */}

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/workers"
                element={<Workers />}
              />

              <Route
                path="/attendance"
                element={<Attendance />}
              />

              <Route
                path="/advance"
                element={
                  <AdvanceManagement />
                }
              />

              <Route
                path="/salary"
                element={
                  <SalaryManagement />
                }
              />

              <Route
                path="/companysetting"
                element={
                  <CompanySettings />
                }
              />

              <Route
                path="/reports"
                element={<Reports />}
              />

              {/* BILLING ROUTES */}

              <Route
                path="/billing/login"
                element={<BillingLogin />}
              />

              <Route
                path="/billing/dashboard"
                element={
                  <BillingProtectedRoute>
                    <BillingDashboard />
                  </BillingProtectedRoute>
                }
              />

              {/* DEFAULT */}

              <Route
                path="/"
                element={
                  <Navigate to="/dashboard" />
                }
              />

              {/* 404 REDIRECT */}

              <Route
                path="*"
                element={
                  <Navigate to="/dashboard" />
                }
              />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  );
}

export default App;