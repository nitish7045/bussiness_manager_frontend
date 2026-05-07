// src/components/ForgotPasswordForm.jsx
import { useState } from "react";
import API from "../api/api";

export default function ForgotPasswordForm({ form, setForm, loading, setLoading, setMessage, onSwitchTab }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP Verification, 3: New Password
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resetToken, setResetToken] = useState("");
  const [timerInterval, setTimerInterval] = useState(null);

  // Cleanup timer
  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // Handle Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!form.email) {
      setMessage({ type: "error", text: "Please enter your email address" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/auth/forgot-password", { email: form.email });
      
      // Check response success flag
      if (response.data.success) {
        setResetEmail(form.email);
        setOtpSent(true);
        setStep(2);
        setResendTimer(60);
        
        // Clear any existing timer
        clearTimer();
        
        // Start resend timer
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setTimerInterval(null);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimerInterval(timer);
        
        setMessage({ 
          type: "success", 
          text: response.data.msg || "OTP has been sent to your email address. Please check your inbox." 
        });
      } else {
        setMessage({ 
          type: "error", 
          text: response.data.msg || "Failed to send OTP. Please try again." 
        });
      }
      
    } catch (err) {
      console.error("Send OTP Error:", err);
      
      let errorMsg = "Failed to send OTP. Please try again.";
      
      if (err.response) {
        // Handle specific error messages from backend
        if (err.response.data?.msg) {
          errorMsg = err.response.data.msg;
        }
        
        // Handle no account found
        if (errorMsg.toLowerCase().includes("no account found")) {
          errorMsg = "No account found with this email address. Please check your email or sign up.";
        }
      } else if (err.request) {
        errorMsg = "Server Network error. Please check your connection.";
      }
      
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setMessage({ type: "error", text: "Please enter a valid 6-digit OTP" });
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/auth/verify-reset-otp", { 
        email: resetEmail, 
        otp: otp 
      });
      
      if (response.data.success) {
        setOtpVerified(true);
        setResetToken(response.data.token);
        setStep(3);
        
        setMessage({ 
          type: "success", 
          text: response.data.msg || "OTP verified successfully! Please set your new password." 
        });
      } else {
        setMessage({ 
          type: "error", 
          text: response.data.msg || "Invalid OTP. Please try again." 
        });
      }
      
    } catch (err) {
      console.error("Verify OTP Error:", err);
      
      let errorMsg = "Invalid OTP. Please try again.";
      
      if (err.response) {
        if (err.response.data?.msg) {
          errorMsg = err.response.data.msg;
        }
        
        // Handle expired OTP
        if (errorMsg.toLowerCase().includes("expired")) {
          errorMsg = "OTP has expired. Please request a new one.";
          // Auto resend after 2 seconds
          setTimeout(() => {
            handleResendOTP();
          }, 2000);
        }
      }
      
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      const response = await API.post("/auth/forgot-password", { email: resetEmail });
      
      if (response.data.success) {
        setResendTimer(60);
        
        // Clear any existing timer
        clearTimer();
        
        // Start resend timer
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setTimerInterval(null);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimerInterval(timer);
        
        setMessage({ 
          type: "success", 
          text: response.data.msg || "New OTP has been sent to your email address." 
        });
      } else {
        setMessage({ 
          type: "error", 
          text: response.data.msg || "Failed to resend OTP. Please try again." 
        });
      }
      
    } catch (err) {
      console.error("Resend OTP Error:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.msg || "Failed to resend OTP. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/auth/reset-password", { 
        email: resetEmail,
        token: resetToken,
        newPassword: newPassword
      });
      
      if (response.data.success) {
        setMessage({ 
          type: "success", 
          text: response.data.msg || "Password reset successfully! Please login with your new password." 
        });
        
        // Clear timer
        clearTimer();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          onSwitchTab("login");
          setForm({ ...form, email: resetEmail, password: "" });
          setStep(1);
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setResetEmail("");
          setResetToken("");
          setOtpSent(false);
          setOtpVerified(false);
          setResendTimer(0);
        }, 2000);
      } else {
        setMessage({ 
          type: "error", 
          text: response.data.msg || "Failed to reset password. Please try again." 
        });
      }
      
    } catch (err) {
      console.error("Reset Password Error:", err);
      
      let errorMsg = " Server Error Failed to reset password. Please try again.";
      
      if (err.response) {
        if (err.response.data?.msg) {
          errorMsg = err.response.data.msg;
        }
        
        // Handle invalid/expired token
        if (errorMsg.toLowerCase().includes("invalid") || errorMsg.toLowerCase().includes("expired")) {
          errorMsg = "Reset link expired or invalid. Please request a new password reset.";
          // Go back to step 1 after 2 seconds
          setTimeout(() => {
            setStep(1);
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
            setResetEmail("");
            setResetToken("");
            setOtpSent(false);
            setOtpVerified(false);
            setMessage({ type: "info", text: "Please request a new password reset." });
          }, 2000);
        }
      }
      
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Step 1: Email Input
  if (step === 1) {
    return (
      <form onSubmit={handleSendOTP} className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔐</span>
            <p className="text-white/70 text-sm">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>
          </div>
          
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
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 rounded-lg overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style={{ pointerEvents: loading ? 'none' : 'auto' }}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          <span className="relative flex items-center justify-center">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Sending OTP...
              </>
            ) : (
              "Send Verification Code"
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            clearTimer();
            onSwitchTab("login");
          }}
          className="w-full text-center text-purple-300 hover:text-purple-200 transition-all duration-200 font-medium hover:scale-105"
        >
          Back to Sign In
        </button>
      </form>
    );
  }

  // Step 2: OTP Verification
  if (step === 2) {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📧</span>
            <p className="text-white/70 text-sm">
              We've sent a verification code to <strong className="text-purple-300">{resetEmail}</strong>
            </p>
          </div>
          <p className="text-white/50 text-xs mb-4">
            Please enter the 6-digit code to verify your identity
          </p>
          
          <label className="block text-white/80 text-sm font-medium mb-2">
            Verification Code (OTP)
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7h2.5M15 7v6m0-6h-2.5m4.5 0H18m-6 0v6m0-6h-2.5M9 7h2.5M9 7v6M9 7H6.5M6.5 7H5m10 11h6m-6 0v2m0-2h-2m2 0v2" />
              </svg>
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
              disabled={loading}
              autoFocus
            />
          </div>
          
          {/* OTP Input Hint */}
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-white/40">
              Enter the 6-digit code sent to your email
            </span>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendTimer > 0 || loading}
              className={`text-xs transition-all duration-200 ${
                resendTimer > 0 
                  ? 'text-white/40 cursor-not-allowed' 
                  : 'text-purple-300 hover:text-purple-200 hover:scale-105'
              }`}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 rounded-lg overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style={{ pointerEvents: loading ? 'none' : 'auto' }}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          <span className="relative flex items-center justify-center">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            clearTimer();
            setStep(1);
            setOtp("");
            setMessage({ type: "", text: "" });
          }}
          className="w-full text-center text-purple-300 hover:text-purple-200 transition-all duration-200 font-medium hover:scale-105"
        >
          ← Back to Email
        </button>
      </form>
    );
  }

  // Step 3: New Password
  if (step === 3) {
    return (
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔑</span>
            <p className="text-white/70 text-sm">
              Set a new password for your account
            </p>
          </div>
          
          {/* New Password */}
          <label className="block text-white/80 text-sm font-medium mb-2">
            New Password
          </label>
          <div className="relative group mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V8a4 4 0 00-8 0v3h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center transition-transform duration-200 hover:scale-110"
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

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'bg-green-500 w-full' :
                      newPassword.length >= 6 ? 'bg-yellow-500 w-3/4' :
                      'bg-red-500 w-1/2'
                    }`}
                  />
                </div>
                <span className="text-xs text-white/60">
                  {newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'Strong' : 
                   newPassword.length >= 6 ? 'Medium' : 'Weak'}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-1">
                Use 6+ characters with letters and numbers for a strong password
              </p>
            </div>
          )}

          {/* Confirm Password */}
          <label className="block text-white/80 text-sm font-medium mb-2">
            Confirm Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center transition-transform duration-200 hover:scale-110"
            >
              <svg className="h-5 w-5 text-white/50 hover:text-white/80 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showConfirmPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                )}
              </svg>
            </button>
          </div>

          {/* Password Match Indicator */}
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <span>⚠️</span> Passwords do not match
            </p>
          )}
          {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <span>✓</span> Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
          className="relative w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-2.5 rounded-lg overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style={{ pointerEvents: loading ? 'none' : 'auto' }}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-teal-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          <span className="relative flex items-center justify-center">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStep(2);
            setNewPassword("");
            setConfirmPassword("");
          }}
          className="w-full text-center text-purple-300 hover:text-purple-200 transition-all duration-200 font-medium hover:scale-105"
        >
          ← Back to Verification
        </button>
      </form>
    );
  }

  return null;
}