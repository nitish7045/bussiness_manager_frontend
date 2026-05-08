// src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ setPage, onCollapse, isCollapsed: externalCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(externalCollapsed || false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    const path = location.pathname.substring(1);
    if (path && path !== "") {
      setActiveItem(path);
    }
  }, [location]);

  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapse) {
      onCollapse(newState);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/dashboard" },
    { id: "workers", label: "Workers", icon: "👥", path: "/workers" },
    { id: "attendance", label: "Attendance", icon: "📅", path: "/attendance" },
    { id: "advance", label: "Advance", icon: "💰", path: "/advance" },
    { id: "salary", label: "Salary", icon: "💵", path: "/salary" },
    { id: "reports", label: "Reports", icon: "📈", path: "/reports" },
    { id: "companysetting", label: "Company Setting", icon: "🧑‍💻", path: "/companysetting" },
    { id: "billing", label: "Billing App", icon: "🧾", path: "/billing/dashboard", isBilling: true },
  ];

  const handleNavigation = (item) => {
    setActiveItem(item.id);
    if (setPage) setPage(item.id);
    navigate(item.path);
  };

  const logout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/login");
      window.location.reload();
    }
  };

  return (
    <div 
      className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        zIndex: 50,
        height: "100vh"
      }}
    >
      {/* Header */}
      <div className={`p-4 border-b border-gray-700 ${isCollapsed ? "px-2" : ""}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center w-full" : ""}`}>
            <div className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isCollapsed ? "w-10 h-10" : "w-8 h-8"
            }`}>
              <span className={`${isCollapsed ? "text-lg" : "text-base"}`}>🏢</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <h1 className="text-base font-bold">Business Manager</h1>
                {user && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Hi, {user.name?.split(" ")[0]}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={handleCollapse}
            className={`p-1 hover:bg-gray-700 rounded-lg transition-colors ${
              isCollapsed ? "absolute right-1 top-4" : ""
            }`}
          >
            <span className="text-sm">{isCollapsed ? "→" : "←"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <style>{`
          .overflow-y-auto::-webkit-scrollbar { display: none; }
        `}</style>
        
        <div className={`space-y-1 ${isCollapsed ? "px-1" : "px-3"}`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 group ${
                activeItem === item.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""} ${
                item.isBilling ? "border-l-2 border-purple-500" : ""
              }`}
              title={isCollapsed ? item.label : ""}
            >
              <span className={`${isCollapsed ? "text-lg" : "text-base"}`}>{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.isBilling && (
                    <span className="ml-auto text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        <div className={`my-3 ${isCollapsed ? "mx-2" : "mx-3"} border-t border-gray-700`}></div>

        <div className={`space-y-1 ${isCollapsed ? "px-1" : "px-3"}`}>
          <button
            onClick={logout}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 bg-red-600 hover:bg-red-700 text-white ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Logout" : ""}
          >
            <span className={`${isCollapsed ? "text-lg" : "text-base"}`}>🚪</span>
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
        
        {!isCollapsed && (
          <p className="text-xs text-gray-500 text-center mt-3 px-3">
            © 2024 Business Manager
          </p>
        )}
      </div>
    </div>
  );
}