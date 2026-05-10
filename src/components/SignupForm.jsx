// src/components/SignupForm.jsx
import { useState, useEffect } from "react";
import API from "../api/api";

export default function SignupForm({
  form,
  setForm,
  loading,
  setLoading,
  setMessage,
  onSwitchTab,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Weak",
    color: "red",
    feedback: []
  });
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];
    
    if (!password) {
      return { score: 0, label: "Weak", color: "red", feedback: [] };
    }
    
    // Length check
    if (password.length >= 8) {
      score += 25;
    } else if (password.length >= 6) {
      score += 15;
      feedback.push("Add 2+ more characters for better security");
    } else {
      feedback.push("Password must be at least 6 characters");
    }
    
    // Uppercase letters
    if (/[A-Z]/.test(password)) {
      score += 20;
    } else {
      feedback.push("Add uppercase letters (A-Z)");
    }
    
    // Lowercase letters
    if (/[a-z]/.test(password)) {
      score += 20;
    } else {
      feedback.push("Add lowercase letters (a-z)");
    }
    
    // Numbers
    if (/[0-9]/.test(password)) {
      score += 20;
    } else {
      feedback.push("Add numbers (0-9)");
    }
    
    // Special characters
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 15;
    } else {
      feedback.push("Add special characters (!@#$% etc.)");
    }
    
    // Determine strength label
    let label = "Weak";
    let color = "red";
    if (score >= 80) {
      label = "Strong";
      color = "green";
    } else if (score >= 60) {
      label = "Good";
      color = "yellow";
    } else if (score >= 40) {
      label = "Medium";
      color = "orange";
    }
    
    return { score, label, color, feedback: feedback.slice(0, 3) };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (form.password) {
      setPasswordStrength(checkPasswordStrength(form.password));
    } else {
      setPasswordStrength({ score: 0, label: "Weak", color: "red", feedback: [] });
    }
  }, [form.password]);

  const handleSendOTP = async () => {
    // Validate email
    if (!form.email) {
      setMessage({ type: "error", text: "Please enter email first" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    // Validate WhatsApp number
    if (!form.whatsappNumber) {
      setMessage({ type: "error", text: "Please enter WhatsApp number" });
      return;
    }
    
    // Basic validation (should have at least 10 digits)
    const cleanNumber = form.whatsappNumber.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      setMessage({ type: "error", text: "Please enter a valid WhatsApp number (minimum 10 digits)" });
      return;
    }

    try {
      setLoading(true);
      const response = await API.post("/auth/send-otp", { 
        email: form.email,
        whatsappNumber: form.whatsappNumber
      });
      
      setOtpSent(true);
      setMessage({ type: "success", text: "OTP sent to your email and WhatsApp!" });
      
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.msg || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setMessage({ type: "error", text: "Please enter OTP" });
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/verify-otp", { 
        email: form.email, 
        whatsappNumber: form.whatsappNumber,
        otp 
      });
      setOtpVerified(true);
      setMessage({ type: "success", text: "OTP verified successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.msg || "Invalid OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.whatsappNumber || !form.password || !form.confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    if (form.password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long" });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (!otpVerified) {
      setMessage({ type: "error", text: "Please verify OTP first" });
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        whatsappNumber: form.whatsappNumber,
      });

      setMessage({ type: "success", text: "Registration successful! Please login." });

      setTimeout(() => {
        onSwitchTab("login");
        setForm({ 
          email: "", 
          password: "", 
          name: "", 
          confirmPassword: "",
          whatsappNumber: "" 
        });
        setOtp("");
        setOtpSent(false);
        setOtpVerified(false);
        setMessage({ type: "", text: "" });
        setLoading(false);
      }, 2000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.msg || "Registration failed. Please try again.",
      });
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Get password strength color class
  const getStrengthColor = () => {
    switch(passwordStrength.color) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'orange': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  // Get password strength text color
  const getStrengthTextColor = () => {
    switch(passwordStrength.color) {
      case 'green': return 'text-green-400';
      case 'yellow': return 'text-yellow-400';
      case 'orange': return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  // Check if passwords match
  const doPasswordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const isConfirmPasswordDirty = form.confirmPassword && form.confirmPassword.length > 0;

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">Full Name</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter your full name"
            className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            disabled={loading}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">Email Address</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            disabled={loading || otpVerified}
          />
        </div>
      </div>

      {/* WhatsApp Number */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          WhatsApp Number
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <input
            type="tel"
            name="whatsappNumber"
            value={form.whatsappNumber || ""}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            placeholder="9876543210"
            className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            disabled={loading || otpVerified}
          />
        </div>
        <p className="text-xs text-white/40 mt-1">
          Enter your 10-digit mobile number (Indian number only)
        </p>
      </div>

      {/* OTP Section */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">Verification</label>
        
        {/* OTP Input Section */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit verification code"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                disabled={!otpSent || otpVerified}
              />
            </div>
            
            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading || !form.email || !form.whatsappNumber}
                className="relative px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium whitespace-nowrap"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  "Send OTP"
                )}
              </button>
            ) : !otpVerified ? (
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={loading || !otp}
                className="relative px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium whitespace-nowrap"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify"
                )}
              </button>
            ) : (
              <div className="px-5 py-2 bg-gradient-to-r from-green-700 to-green-800 text-white rounded-lg font-medium flex items-center whitespace-nowrap">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </div>
            )}
          </div>
          
          {otpSent && !otpVerified && (
            <p className="text-xs text-white/50 mt-2">
              Verification code sent to your email and WhatsApp
            </p>
          )}
          
          {otpVerified && (
            <p className="text-xs text-green-400 mt-2">
              ✓ Verified successfully! You can now create your account.
            </p>
          )}
        </div>
      </div>

      {/* Password with Strength Meter */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">Password</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V8a4 4 0 00-8 0v3h8z" />
            </svg>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            placeholder="Create a password (min. 6 characters)"
            className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
            disabled={loading}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center transition-transform duration-200 hover:scale-110"
          >
            <svg className="h-5 w-5 text-white/50 hover:text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showPassword ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              )}
            </svg>
          </button>
        </div>

        {/* Password Strength Meter */}
        {form.password && (
          <div className="mt-3 space-y-2">
            {/* Strength Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${passwordStrength.score}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${getStrengthTextColor()}`}>
                {passwordStrength.label}
              </span>
            </div>

            {/* Strength Feedback */}
            {passwordFocused && passwordStrength.feedback.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-white/50">Password tips:</p>
                {passwordStrength.feedback.map((tip, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs text-white/40">
                    <span>•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Character Counter */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${form.password.length >= 6 ? 'text-green-400' : 'text-red-400'}`}>
                  {form.password.length >= 6 ? '✓' : '⚠️'}
                </span>
                <span className="text-xs text-white/50">
                  {form.password.length}/6+ characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/[A-Z]/.test(form.password) ? (
                  <span className="text-xs text-green-400">✓ Uppercase</span>
                ) : (
                  <span className="text-xs text-white/30">○ Uppercase</span>
                )}
                {/[0-9]/.test(form.password) ? (
                  <span className="text-xs text-green-400">✓ Number</span>
                ) : (
                  <span className="text-xs text-white/30">○ Number</span>
                )}
                {/[^A-Za-z0-9]/.test(form.password) ? (
                  <span className="text-xs text-green-400">✓ Special</span>
                ) : (
                  <span className="text-xs text-white/30">○ Special</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">Confirm Password</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Confirm your password"
            className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
            disabled={loading}
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center transition-transform duration-200 hover:scale-110"
          >
            <svg className="h-5 w-5 text-white/50 hover:text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showConfirmPassword ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              )}
            </svg>
          </button>
        </div>

        {/* Password Match Indicator */}
        {isConfirmPasswordDirty && (
          <div className={`mt-2 text-xs flex items-center gap-1 ${doPasswordsMatch ? 'text-green-400' : 'text-red-400'}`}>
            {doPasswordsMatch ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Passwords match</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Passwords do not match</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Password Requirements Summary */}
      {form.password && form.password.length > 0 && form.password.length < 6 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          <p className="text-xs text-red-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Password must be at least 6 characters long
          </p>
        </div>
      )}

      {/* Strength Summary for Strong Password */}
      {passwordStrength.score >= 80 && form.password && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
          <p className="text-xs text-green-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Strong password! Good security
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !otpVerified || (form.password && form.password.length < 6) || (form.confirmPassword && form.password !== form.confirmPassword)}
        className="relative w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-2.5 rounded-lg overflow-hidden group transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
        style={{ pointerEvents: loading ? 'none' : 'auto' }}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-teal-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
        <span className="relative flex items-center justify-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </span>
      </button>
    </form>
  );
}