import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { billingAPI } from "../../api/api";

export default function BillingProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("billingToken");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await billingAPI.get("/billing/auth/verify", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.valid) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem("billingToken");
          localStorage.removeItem("billingUser");
        }
      } catch (err) {
        setIsAuthenticated(false);
        localStorage.removeItem("billingToken");
        localStorage.removeItem("billingUser");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/billing/login" />;
}