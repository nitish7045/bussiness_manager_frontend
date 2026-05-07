import { useEffect, useState } from "react";
import API from "../api/api";

export default function Dashboard() {
  const [workers, setWorkers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    halfday: 0,
    holiday: 0,
    active: 0,
    inactive: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loginTime, setLoginTime] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  
  // Get current date with proper timezone handling
  const getCurrentDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const today = getCurrentDate();

  // Calculate session time remaining (8 hours session)
  const calculateSessionRemaining = (loginTimeStr) => {
    if (!loginTimeStr) return null;
    const login = new Date(loginTimeStr);
    const now = new Date();
    const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours
    const expiresAt = new Date(login.getTime() + sessionDuration);
    const remaining = expiresAt - now;
    
    if (remaining <= 0) {
      // Session expired, logout
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("loginTime");
      window.location.href = '/login';
      return null;
    }
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    return { hours, minutes, seconds, totalRemaining: remaining };
  };

  // Fetch login history - Only when modal is opened
  const fetchLoginHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await API.get("/auth/login-history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.loginHistory) {
        setLoginHistory(response.data.loginHistory);
      }
    } catch (error) {
      console.error("Error fetching login history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle security modal open
  const handleOpenSecurityModal = async () => {
    setShowSecurityModal(true);
    await fetchLoginHistory();
  };

  useEffect(() => {
    const storedLoginTime = localStorage.getItem("loginTime");
    if (storedLoginTime) {
      setLoginTime(new Date(storedLoginTime));
      const remaining = calculateSessionRemaining(storedLoginTime);
      setSessionTimeRemaining(remaining);
    } else {
      const now = new Date();
      localStorage.setItem("loginTime", now.toISOString());
      setLoginTime(now);
    }
    
    // Update time every second for better session display
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      const stored = localStorage.getItem("loginTime");
      if (stored) {
        const remaining = calculateSessionRemaining(stored);
        setSessionTimeRemaining(remaining);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Don't fetch login history automatically
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const employeesRes = await API.get("/employees");
      const allWorkers = employeesRes.data;
      setWorkers(allWorkers);

      const activeCount = allWorkers.filter(w => w.status === "active").length;
      const inactiveCount = allWorkers.filter(w => w.status === "inactive").length;

      const attendanceRes = await API.get(
        `/attendance?month=${today.getMonth() + 1}&year=${today.getFullYear()}`
      );

      const attendanceMap = {};
      let presentCount = 0;
      let absentCount = 0;
      let halfdayCount = 0;
      let holidayCount = 0;

      let attendanceData = [];
      if (attendanceRes.data && Array.isArray(attendanceRes.data)) {
        attendanceData = attendanceRes.data;
      } else if (attendanceRes.data && attendanceRes.data.data && Array.isArray(attendanceRes.data.data)) {
        attendanceData = attendanceRes.data.data;
      } else {
        attendanceData = [];
      }
      
      attendanceData.forEach(record => {
        const recordDate = record.date;
        const recordDay = parseInt(recordDate.split('-')[2]);
        
        if (recordDay === today.getDate()) {
          const workerId = record.workerId?._id || record.workerId;
          attendanceMap[workerId] = {
            status: record.status,
            overtime: record.overtimeHours || 0,
            marked: true
          };

          switch(record.status) {
            case 'present':
              presentCount++;
              break;
            case 'absent':
              absentCount++;
              break;
            case 'halfday':
              halfdayCount++;
              break;
            case 'holiday':
              holidayCount++;
              break;
          }
        }
      });

      const activeWorkers = allWorkers.filter(w => w.status === "active");
      const unmarkedCount = activeWorkers.filter(w => !attendanceMap[w._id]).length;
      const finalAbsentCount = absentCount + unmarkedCount;

      setAttendanceData(attendanceMap);
      setStats({
        present: presentCount,
        absent: finalAbsentCount,
        halfday: halfdayCount,
        holiday: holidayCount,
        total: allWorkers.length,
        active: activeCount,
        inactive: inactiveCount,
        unmarked: unmarkedCount,
        marked: Object.keys(attendanceMap).length
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-green-50 border-green-500 text-green-800';
      case 'absent': return 'bg-red-50 border-red-500 text-red-800';
      case 'halfday': return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'holiday': return 'bg-blue-50 border-blue-500 text-blue-800';
      default: return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'halfday': return '🌓';
      case 'holiday': return '🎉';
      default: return '⏳';
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatTime = (date) => {
    if (!date) return '--:-- --';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '--:-- --, --- -- ----';
    return new Date(date).toLocaleString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("loginTime");
      window.location.href = '/login';
    }
  };

  const handleExtendSession = () => {
    const newTime = new Date();
    localStorage.setItem("loginTime", newTime.toISOString());
    setLoginTime(newTime);
    const remaining = calculateSessionRemaining(newTime.toISOString());
    setSessionTimeRemaining(remaining);
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return '💻';
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📟';
    return '💻';
  };

  const activePercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const inactivePercentage = stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0;
  const presentPercentage = stats.active > 0 ? Math.round((stats.present / stats.active) * 100) : 0;
  const absentPercentage = stats.active > 0 ? Math.round((stats.absent / stats.active) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-lg rounded-b-2xl mb-6">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">
                  {getGreeting() === "Good Morning" ? "🌅" : getGreeting() === "Good Afternoon" ? "☀️" : "🌙"}
                </span>
                <h1 className="text-2xl font-bold text-gray-800">
                  {getGreeting()}, {user?.name || "User"}! 👋
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Welcome back to your attendance dashboard
              </p>
              {stats.marked > 0 && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ {stats.marked} workers have marked attendance today
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleOpenSecurityModal}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <span>🔒</span>
                Security
              </button>
              
              <div className="bg-gray-50 px-4 py-3 rounded-xl">
                <div className="text-xs text-gray-500">Today's Date</div>
                <div className="font-semibold text-gray-700 text-sm">{formatShortDate(today)}</div>
                <div className="text-xs text-gray-500 mt-1">Current Time</div>
                <div className="font-semibold text-gray-700 text-sm">{formatTime(currentTime)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Warning Banner */}
      {sessionTimeRemaining && sessionTimeRemaining.hours < 1 && sessionTimeRemaining.totalRemaining > 0 && (
        <div className="container mx-auto px-6 mb-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <p className="text-yellow-800 text-sm">
                  Your session will expire in {sessionTimeRemaining.minutes} minutes {sessionTimeRemaining.seconds} seconds
                </p>
              </div>
              <button
                onClick={handleExtendSession}
                className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600"
              >
                Extend Session
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {presentPercentage}% of active
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="text-2xl">❌</div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {absentPercentage}% of active
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Half Day</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.halfday}</p>
              </div>
              <div className="text-2xl">🌓</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Holiday</p>
                <p className="text-2xl font-bold text-blue-600">{stats.holiday}</p>
              </div>
              <div className="text-2xl">🎉</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Total Workers</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Active Workers</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="text-2xl">🟢</div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {activePercentage}% of total
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-400 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Inactive Workers</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="text-2xl">⚫</div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {inactivePercentage}% of total
            </div>
          </div>
        </div>

        {/* Today's Attendance Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📋</span>
              Today's Attendance - {formatDate(today)}
              <span className="text-sm font-normal text-blue-100 ml-2">
                ({stats.marked} marked / {stats.active} active)
              </span>
            </h2>
          </div>
          
          <div className="p-5">
            {workers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No workers found. Please add workers first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {workers.filter(w => w.status === "active").map(worker => {
                  const attendance = attendanceData[worker._id];
                  const status = attendance?.status || 'absent';
                  const isMarked = attendance?.marked || false;
                  const overtime = attendance?.overtime || 0;

                  return (
                    <div
                      key={worker._id}
                      className={`p-3 rounded-lg border-l-4 transition-all hover:shadow-md ${getStatusColor(status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">
                              {getStatusIcon(status)}
                            </span>
                            <h3 className="font-semibold text-gray-800 text-sm">
                              {worker.name}
                            </h3>
                          </div>
                          
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-medium">Status:</span>
                              <span className={`capitalize font-semibold ${
                                status === 'present' ? 'text-green-600' :
                                status === 'absent' ? 'text-red-600' :
                                status === 'halfday' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`}>
                                {status} {isMarked ? '✓' : ''}
                              </span>
                            </div>
                            
                            {overtime > 0 && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium">Overtime:</span>
                                <span className="text-orange-600 font-semibold">
                                  {overtime} hrs
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {!isMarked && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
                          {isMarked && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                              Marked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* User Info Card */}
        {user && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-md p-4 mb-8 border border-indigo-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-base font-bold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Session Information</h3>
                  <p className="text-xs text-gray-600">
                    Logged in as: <span className="font-medium">{user.email || user.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Session started: {formatDateTime(loginTime)}
                  </p>
                  {sessionTimeRemaining && sessionTimeRemaining.totalRemaining > 0 && (
                    <p className="text-xs text-gray-500">
                      Session expires in: <span className={`font-medium ${sessionTimeRemaining.hours < 1 ? 'text-orange-600' : 'text-green-600'}`}>
                        {sessionTimeRemaining.hours}h {sessionTimeRemaining.minutes}m {sessionTimeRemaining.seconds}s
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
              >
                <span>🚪</span>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Modal - Login History */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSecurityModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <h2 className="text-xl font-bold text-white">Security Center</h2>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-70px)]">
              {/* Session Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <span>🕐</span> Current Session
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Login Time:</p>
                    <p className="font-medium text-gray-800">{formatDateTime(loginTime)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Session Duration:</p>
                    <p className="font-medium text-gray-800">8 hours</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time Remaining:</p>
                    <p className={`font-medium ${sessionTimeRemaining?.hours < 1 ? 'text-orange-600' : 'text-green-600'}`}>
                      {sessionTimeRemaining ? `${sessionTimeRemaining.hours}h ${sessionTimeRemaining.minutes}m ${sessionTimeRemaining.seconds}s` : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Device:</p>
                    <p className="font-medium text-gray-800">
                      {navigator.userAgent.includes('Mobile') ? 'Mobile' : 
                       navigator.userAgent.includes('Tablet') ? 'Tablet' : 'Desktop'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Login History */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📜</span> Recent Login History
                </h3>
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading history...</p>
                  </div>
                ) : loginHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No login history available</p>
                ) : (
                  <div className="space-y-3">
                    {loginHistory.map((login, index) => (
                      <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{getDeviceIcon(login.userAgent)}</div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  login.success !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {login.success !== false ? '✓ Success' : '✗ Failed'}
                                </span>
                                {login.location && (
                                  <span className="text-xs text-gray-500">{login.location}</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">IP:</span> {login.ip || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDateTime(login.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security Tips */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <span>💡</span> Security Tips
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Never share your password with anyone</li>
                  <li>• Check login history regularly for unauthorized access</li>
                  <li>• Contact support immediately if you notice suspicious activity</li>
                  <li>• Your session automatically expires after 8 hours for security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}