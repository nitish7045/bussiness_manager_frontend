import axios from 'axios';

// 🔹 Common function to handle logout
const handleLogout = (type = "main") => {
  if (type === "main") {
    localStorage.removeItem("token");
    alert("Session expired. Please login again.");
    window.location.href = "/login";
  } else {
    localStorage.removeItem("billingToken");
    alert("Billing session expired. Please login again.");
    window.location.href = "/billing/login";
  }
};

// Check if error is session expiry (not wrong password)
const isSessionExpiryError = (error) => {
  if (!error.response || error.response.status !== 401) return false;
  
  const errorMsg = error.response?.data?.msg || "";
  
  // These are login-related errors - NOT session expiry
  const loginErrors = [
    "Invalid email or password",
    "Invalid password",
    "attempts remaining",
    "Too many failed attempts",
    "Account locked",
    "Invalid credentials"
  ];
  
  // Check if it's a login error
  const isLoginError = loginErrors.some(err => errorMsg.includes(err));
  
  // If it's a login error, don't logout
  if (isLoginError) return false;
  
  // Otherwise, it's likely session expiry
  return true;
};

// 🔹 Main API
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
});

// Attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

// Handle errors
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (isSessionExpiryError(error)) {
      handleLogout("main");
    }
    
    return Promise.reject(error);
  }
);

// 🔹 Billing API
export const billingAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Attach billing token
billingAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("billingToken");

  if (
    token &&
    config.url?.startsWith("/billing") &&
    !config.url?.includes("/billing/auth/")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle errors for billing API
billingAPI.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response && 
      error.response.status === 401 &&
      error.config.url?.startsWith("/billing")
    ) {
      if (isSessionExpiryError(error)) {
        handleLogout("billing");
      }
    }

    return Promise.reject(error);
  }
);

export default API;