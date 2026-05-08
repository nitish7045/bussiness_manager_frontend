// src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ setPage, onCollapse, isCollapsed: externalCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(externalCollapsed || false);
  const [user, setUser] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    const path = location.pathname.substring(1);
    if (path && path !== "") {
      setActiveItem(path.split('/')[0]);
    }
  }, [location]);

  const handleCollapse = () => {
    setIsTransitioning(true);
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapse) {
      onCollapse(newState);
    }
    // Reset transitioning after animation
    setTimeout(() => setIsTransitioning(false), 300);
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
      className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16.5" : "w-64"
      }`}
      style={{ 
        position: "sticky",
        top: 0,
        left: 0,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        scrollbarWidth: "thin",
        scrollbarColor: "#4b5563 #1f2937"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: #1f2937;
        }
        div::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      {/* Header */}
      <div className={`border-b border-gray-700 transition-all duration-300 ease-in-out ${
        isCollapsed ? "p-3" : "p-4"
      }`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 transition-all duration-300 ${
            isCollapsed ? "justify-center w-full" : ""
          }`}>
            <div className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              isCollapsed ? "w-10 h-10" : "w-8 h-8"
            }`}>
              <span className={`transition-all duration-300 ${isCollapsed ? "text-xl" : "text-base"}`}>🏢</span>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}>
              {!isCollapsed && (
                <>
                  <h1 className="text-base font-bold truncate">Business Manager</h1>
                  {user && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      Hi, {user.name?.split(" ")[0]}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Collapse Button */}
          <button
            onClick={handleCollapse}
            disabled={isTransitioning}
            className={`p-1.5 hover:bg-gray-700 rounded-lg transition-all duration-200 flex-shrink-0 ${
              isCollapsed ? "mx-auto" : ""
            } hover:scale-110 active:scale-95`}
            style={{ transform: isTransitioning ? "scale(0.95)" : "scale(1)" }}
          >
            <span className="text-sm transition-transform duration-300 inline-block">
              {isCollapsed ? "➡️" : "⬅️"}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className={`space-y-1 ${isCollapsed ? "px-2" : "px-3"}`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center gap-2 rounded-lg transition-all duration-200 group ${
                activeItem === item.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } ${isCollapsed ? "justify-center py-3" : "py-2 px-3"} ${
                item.isBilling ? "border-l-2 border-purple-500" : ""
              }`}
              title={isCollapsed ? item.label : ""}
            >
              <span className={`transition-all duration-200 flex-shrink-0 ${
                isCollapsed ? "text-xl" : "text-base"
              } ${activeItem === item.id ? "scale-110" : ""}`}>
                {item.icon}
              </span>
              <span className={`transition-all duration-300 whitespace-nowrap ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}>
                {!isCollapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.isBilling && (
                      <span className="ml-2 text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </>
                )}
              </span>
              {activeItem === item.id && !isCollapsed && (
                <div className="ml-auto w-1 h-6 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className={`my-3 ${isCollapsed ? "mx-2" : "mx-3"} border-t border-gray-700`}></div>

        <div className={`space-y-1 ${isCollapsed ? "px-2" : "px-3"}`}>
          <button
            onClick={logout}
            className={`w-full flex items-center gap-2 rounded-lg transition-all duration-200 bg-red-600 hover:bg-red-700 text-white ${
              isCollapsed ? "justify-center py-3" : "py-2 px-3"
            }`}
            title={isCollapsed ? "Logout" : ""}
          >
            <span className={`transition-all duration-200 flex-shrink-0 ${isCollapsed ? "text-xl" : "text-base"}`}>🚪</span>
            <span className={`transition-all duration-300 whitespace-nowrap ${
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}>
              {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
            </span>
          </button>
        </div>
        
        <div className={`transition-all duration-300 overflow-hidden ${
          isCollapsed ? "h-0 opacity-0 mt-0" : "h-auto opacity-100 mt-3"
        }`}>
          {!isCollapsed && (
            <p className="text-xs text-gray-500 text-center px-3">
              © 2024 Business Manager
            </p>
          )}
        </div>
      </div>
    </div>
  );
}