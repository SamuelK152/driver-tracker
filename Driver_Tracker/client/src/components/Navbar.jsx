import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!token) return null;

  return (
    <nav className="bg-blue-600 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Driver Tracker
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="hover:text-blue-200">
            Dashboard
          </Link>
          <Link to="/dispatch" className="hover:text-blue-200">
            Dispatch
          </Link>

          <div className="relative">
            <button
              onClick={() => setIsMetricsOpen(!isMetricsOpen)}
              className="hover:text-blue-200 flex items-center focus:outline-none"
            >
              Metrics
              <svg
                className="w-4 h-4 ml-1"
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

            {isMetricsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <Link
                  to="/import"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMetricsOpen(false)}
                >
                  Import
                </Link>
                <Link
                  to="/history"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMetricsOpen(false)}
                >
                  History
                </Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsFleetOpen(!isFleetOpen)}
              className="hover:text-blue-200 flex items-center focus:outline-none"
            >
              Fleet
              <svg
                className="w-4 h-4 ml-1"
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

            {isFleetOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <Link
                  to="/vans"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsFleetOpen(false)}
                >
                  Vans
                </Link>
                <Link
                  to="/equipment"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsFleetOpen(false)}
                >
                  Equipment
                </Link>
                <Link
                  to="/driverProfiles"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsFleetOpen(false)}
                >
                  Drivers
                </Link>
                <Link
                  to="/maintenance"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsFleetOpen(false)}
                >
                  Maintenance Log
                </Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsManagerOpen(!isManagerOpen)}
              className="hover:text-blue-200 flex items-center focus:outline-none"
            >
              Manager
              <svg
                className="w-4 h-4 ml-1"
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

            {isManagerOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <Link
                  to="/vans"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsManagerOpen(false)}
                >
                  Vans
                </Link>
                <Link
                  to="/equipment"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsManagerOpen(false)}
                >
                  Equipment
                </Link>
                <Link
                  to="/driverProfiles"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsManagerOpen(false)}
                >
                  Drivers
                </Link>
                <Link
                  to="/maintenance"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsManagerOpen(false)}
                >
                  Maintenance Log
                </Link>
                <Link
                  to="/options"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsManagerOpen(false)}
                >
                  Options
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
