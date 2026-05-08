// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import ForgotPasswordForm from "../components/ForgotPasswordForm";

export default function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = "/dashboard";
    }
  }, []);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    setMessage({ type: "", text: "" });
    if (tab === "login") {
      setForm({ email: "", password: "", name: "", confirmPassword: "" });
    } else if (tab === "register") {
      setForm({ email: "", password: "", name: "", confirmPassword: "" });
    } else if (tab === "forgot") {
      setForm({ ...form, email: "" });
    }
  };

  const handleLoginSuccess = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Glassmorphism Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
          {/* Logo/Brand */}
          <div className="text-center pt-8 pb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl animate-pulse opacity-75"></div>
              <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Business Manager</h1>
            <p className="text-white/70 text-sm">Streamline your workforce management</p>
          </div>

          {/* Tab Buttons */}
          <div className="flex px-6 gap-2">
            <button
              onClick={() => handleSwitchTab("login")}
              className={`flex-1 py-2.5 text-center font-medium rounded-lg transition-all duration-300 transform ${
                activeTab === "login"
                  ? "bg-white/20 text-white shadow-lg scale-100"
                  : "bg-white/5 text-white/60 hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleSwitchTab("register")}
              className={`flex-1 py-2.5 text-center font-medium rounded-lg transition-all duration-300 transform ${
                activeTab === "register"
                  ? "bg-white/20 text-white shadow-lg scale-100"
                  : "bg-white/5 text-white/60 hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Container */}
          <div className="p-6">
            {/* Message Display */}
            {message.text && (
              <div className={`mb-4 p-3 rounded-lg backdrop-blur-sm ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-200 border border-green-500/30"
                  : "bg-red-500/20 text-red-200 border border-red-500/30"
              }`}>
                {message.text}
              </div>
            )}

            {/* Dynamic Form Rendering */}
            {activeTab === "login" && (
              <LoginForm
                onSwitchTab={handleSwitchTab}
                form={form}
                setForm={setForm}
                loading={loading}
                setLoading={setLoading}
                setMessage={setMessage}
                onLoginSuccess={handleLoginSuccess}
              />
            )}

            {activeTab === "register" && (
              <SignupForm
                form={form}
                setForm={setForm}
                loading={loading}
                setLoading={setLoading}
                setMessage={setMessage}
                onSwitchTab={handleSwitchTab}
              />
            )}

            {activeTab === "forgot" && (
              <ForgotPasswordForm
                form={form}
                setForm={setForm}
                loading={loading}
                setLoading={setLoading}
                setMessage={setMessage}
                onSwitchTab={handleSwitchTab}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/50 text-xs">
            © 2024 Business Manager. All rights reserved.
          </p>
        </div>
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}