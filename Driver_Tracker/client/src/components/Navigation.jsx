import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sidebar State
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);

  // Navbar State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Navbar Section */}
      <header className="bg-white shadow p-4 flex justify-between items-center z-10 relative h-16 flex-shrink-0">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-gray-900 focus:outline-none mr-4"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <Link to="/" className="text-xl font-bold text-gray-800">
            Driver Tracker
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Dummy Messages Button */}
          <button className="text-gray-600 hover:text-blue-600 focus:outline-none relative">
            <span className="sr-only">Messages</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>

          {/* Dummy Alerts Button */}
          <button className="text-gray-600 hover:text-blue-600 focus:outline-none relative">
            <span className="sr-only">Alerts</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center text-gray-600 hover:text-blue-600 focus:outline-none"
            >
              <span className="sr-only">Settings</span>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                <Link
                  to="/options"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  Options
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content Area (Sidebar + Main) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Section */}
        <aside
          className={`bg-gray-800 text-white h-full transition-all duration-300 ${
            isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
          } flex flex-col flex-shrink-0`}
        >
          <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <nav className="space-y-1 px-2">
              <Link
                to="/"
                className={`block px-4 py-2 rounded hover:bg-gray-700 whitespace-nowrap ${
                  isActive("/") ? "bg-gray-700" : ""
                }`}
              >
                Dashboard
              </Link>

              {/* Scheduling Dropdown */}
              <div>
                <div className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700">
                  <Link
                    to="/scheduling"
                    className={`flex-grow whitespace-nowrap focus:outline-none ${
                      isActive("/scheduling") ? "text-blue-400" : ""
                    }`}
                  >
                    Scheduling
                  </Link>
                  <button
                    onClick={() => setIsSchedulingOpen(!isSchedulingOpen)}
                    className="focus:outline-none ml-2 p-1 rounded hover:bg-gray-600"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isSchedulingOpen ? "transform rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
                {isSchedulingOpen && (
                  <div className="pl-6 space-y-1 mt-1">
                    <Link
                      to="/scheduling/routing"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/scheduling/routing") ? "bg-gray-700" : ""
                      }`}
                    >
                      Routing
                    </Link>
                    <Link
                      to="/scheduling/employees"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/scheduling/employees") ? "bg-gray-700" : ""
                      }`}
                    >
                      Employees
                    </Link>
                    <Link
                      to="/scheduling/calendar"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/scheduling/calendar") ? "bg-gray-700" : ""
                      }`}
                    >
                      Calendar
                    </Link>
                    <Link
                      to="/scheduling/manage"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/scheduling/manage") ? "bg-gray-700" : ""
                      }`}
                    >
                      Manage
                    </Link>
                  </div>
                )}
              </div>

              {/* Fleet Dropdown */}
              <div>
                <div className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700">
                  <Link
                    to="/fleet"
                    className={`flex-grow whitespace-nowrap focus:outline-none ${
                      isActive("/fleet") ? "text-blue-400" : ""
                    }`}
                  >
                    Fleet
                  </Link>
                  <button
                    onClick={() => setIsFleetOpen(!isFleetOpen)}
                    className="focus:outline-none ml-2 p-1 rounded hover:bg-gray-600"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isFleetOpen ? "transform rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
                {isFleetOpen && (
                  <div className="pl-6 space-y-1 mt-1">
                    <Link
                      to="/fleet/vans"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/fleet/vans") ? "bg-gray-700" : ""
                      }`}
                    >
                      Vans
                    </Link>
                    <Link
                      to="/fleet/equipment"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/fleet/equipment") ? "bg-gray-700" : ""
                      }`}
                    >
                      Equipment
                    </Link>
                    <Link
                      to="/fleet/maintenance"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/fleet/maintenance") ? "bg-gray-700" : ""
                      }`}
                    >
                      Maintenance
                    </Link>
                    <Link
                      to="/fleet/manage"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/fleet/manage") ? "bg-gray-700" : ""
                      }`}
                    >
                      Manage
                    </Link>
                  </div>
                )}
              </div>

              {/* Dispatch Dropdown */}
              <div>
                <div className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700">
                  <Link
                    to="/dispatch"
                    className={`flex-grow whitespace-nowrap focus:outline-none ${
                      isActive("/dispatch") ? "text-blue-400" : ""
                    }`}
                  >
                    Dispatch
                  </Link>
                  <button
                    onClick={() => setIsDispatchOpen(!isDispatchOpen)}
                    className="focus:outline-none ml-2 p-1 rounded hover:bg-gray-600"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isDispatchOpen ? "transform rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
                {isDispatchOpen && (
                  <div className="pl-6 space-y-1 mt-1">
                    <Link
                      to="/dispatch/progress"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/dispatch/progress") ? "bg-gray-700" : ""
                      }`}
                    >
                      Progress
                    </Link>
                    <Link
                      to="/dispatch/metrics"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/dispatch/metrics") ? "bg-gray-700" : ""
                      }`}
                    >
                      Metrics
                    </Link>
                    <Link
                      to="/dispatch/import"
                      className={`block px-4 py-2 rounded hover:bg-gray-700 text-sm whitespace-nowrap ${
                        isActive("/dispatch/import") ? "bg-gray-700" : ""
                      }`}
                    >
                      Import
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Navigation;
