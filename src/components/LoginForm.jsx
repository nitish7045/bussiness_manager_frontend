// src/components/LoginForm.jsx
import { useState, useEffect } from "react";
import API from "../api/api";

export default function LoginForm({ onSwitchTab, form, setForm, loading, setLoading, setMessage }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(null);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (lockTimer) clearTimeout(lockTimer);
    };
  }, [lockTimer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      setMessage({ 
        type: "error", 
        text: "Too many failed attempts. Please wait 15 minutes before trying again." 
      });
      return;
    }

    if (!form.email || !form.password) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: form.email,
        password: form.password
      });

      // Reset attempts on successful login
      setLoginAttempts(0);
      setIsLocked(false);
      if (lockTimer) clearTimeout(lockTimer);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("loginTime", new Date().toISOString());

      setMessage({ type: "success", text: "Login successful! Redirecting..." });
      
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);

    } catch (err) {
      console.log("========== LOGIN ERROR ==========");
      console.log("Full Error:", err);

      let errorMsg = "Login failed. Please check your credentials.";
      let remainingAttempts = null;

      if (err.response) {
        console.log("Status Code:", err.response.status);
        console.log("Response Data:", err.response.data);
        
        errorMsg = err.response?.data?.msg || errorMsg;
        
        // Extract remaining attempts from error message
        const attemptsMatch = errorMsg.match(/(\d+) attempts? remaining/);
        if (attemptsMatch) {
          remainingAttempts = parseInt(attemptsMatch[1]);
          setLoginAttempts(5 - remainingAttempts);
        }
        
        // Check for account lock
        if (err.response?.status === 403 && errorMsg.includes("locked")) {
          setIsLocked(true);
          setLoginAttempts(5);
          
          // Extract lock duration if present
          const minutesMatch = errorMsg.match(/(\d+) minutes/);
          const lockMinutes = minutesMatch ? parseInt(minutesMatch[1]) : 15;
          
          setMessage({ type: "error", text: errorMsg });
          
          // Auto unlock after specified time
          const timer = setTimeout(() => {
            setIsLocked(false);
            setLoginAttempts(0);
            setMessage({ type: "info", text: "Account unlocked. You can try logging in again." });
          }, lockMinutes * 60 * 1000);
          
          setLockTimer(timer);
          setLoading(false);
          return;
        }
        
        // Check for invalid credentials
        if (err.response?.status === 401 || err.response?.status === 400) {
          if (remainingAttempts !== null) {
            setMessage({ type: "error", text: errorMsg });
          } else {
            setMessage({ type: "error", text: "Invalid email or password" });
          }
        } else {
          setMessage({ type: "error", text: errorMsg });
        }
        
      } else if (err.request) {
        console.log("No response received from server");
        setMessage({ type: "error", text: "Cannot connect to server. Please check your connection." });
      } else {
        console.log("Request setup error:", err.message);
        setMessage({ type: "error", text: "Login failed. Please try again." });
      }

      console.log("=================================");
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* Warning banner for locked account */}
      {isLocked && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-200 border border-red-500/30 backdrop-blur-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0V6m0 3h-2m2 0h2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
            <span>Account locked. Please wait 15 minutes.</span>
          </div>
        </div>
      )}

      {/* Show attempt warning */}
      {loginAttempts > 0 && !isLocked && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{5 - loginAttempts} login attempts remaining</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Email Address
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Enter your email"
            className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            disabled={loading || isLocked}
          />
        </div>
      </div>

      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Password
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V8a4 4 0 00-8 0v3h8z" />
            </svg>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
            className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            disabled={loading || isLocked}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center transition-transform duration-200 hover:scale-110"
            disabled={isLocked}
          >
            <svg className="h-5 w-5 text-white/50 hover:text-white/80 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showPassword ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSwitchTab("forgot")}
          className="text-sm text-purple-300 hover:text-purple-200 transition-all duration-200 hover:scale-105"
          disabled={isLocked}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || isLocked}
        className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2.5 rounded-lg overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        style={{
          pointerEvents: loading ? 'none' : 'auto'
        }}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        <span className="relative flex items-center justify-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </>
          ) : isLocked ? (
            "Account Locked - Try Again Later"
          ) : (
            "Sign In"
          )}
        </span>
      </button>

      {/* Additional security info */}
      <div className="text-center text-xs text-white/40 mt-2">
        <p>Maximum 5 login attempts allowed</p>
      </div>
    </form>
  );
}