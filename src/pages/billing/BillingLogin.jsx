import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { billingAPI } from "../../api/api";  // Import billingAPI instead of API

export default function BillingLogin({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await billingAPI.post("/billing/auth/login", {
        username: formData.username,
        password: formData.password
      });

      if (res.data.success) {
        localStorage.setItem("billingToken", res.data.token);
        localStorage.setItem("billingUser", JSON.stringify(res.data.user));
        
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user);
        }
        
        navigate("/billing/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (!formData.companyName.trim()) {
      setError("Company name is required");
      setLoading(false);
      return;
    }

    try {
      const res = await billingAPI.post("/billing/auth/signup", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        companyName: formData.companyName,
        role: "admin"
      });

      if (res.data.success) {
        localStorage.setItem("billingToken", res.data.token);
        localStorage.setItem("billingUser", JSON.stringify(res.data.user));
        
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user);
        }
        
        alert("Account created successfully! Welcome to Billing System.");
        navigate("/billing/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
          <div className="text-5xl mb-3">🧾</div>
          <h1 className="text-2xl font-bold text-white">Billing App</h1>
          <p className="text-blue-100 text-sm mt-1">
            {isLogin ? "Login to your account" : "Create a new company account"}
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={isLogin ? handleLogin : handleSignup}>
            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isLogin ? "Username or Email" : "Username"}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isLogin ? "Enter username or email" : "Choose a username"}
              />
            </div>

            {/* Email (Signup only) */}
            {!isLogin && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Full Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Company Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your company name"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will create a separate billing environment for your company
                  </p>
                </div>
              </>
            )}

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
              />
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : (isLogin ? "Login" : "Create Company Account")}
            </button>

            {/* Toggle */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setFormData({
                    username: "",
                    email: "",
                    password: "",
                    fullName: "",
                    companyName: "",
                    confirmPassword: "",
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isLogin ? "Don't have an account? Create Company Account" : "Already have an account? Login"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            Secure multi-tenant billing management system
          </p>
        </div>
      </div>
    </div>
  );
}