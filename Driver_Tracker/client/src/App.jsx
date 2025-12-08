import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ImportMetrics from "./pages/ImportMetrics";
import History from "./pages/History";
import Dispatch from "./pages/Dispatch";
import Vans from "./pages/Vans";
import Equipment from "./pages/Equipment";
import DriverProfiles from "./pages/DriverProfiles";
import Scheduling from "./pages/Scheduling";
import MaintenanceLog from "./pages/MaintenanceLog";
import Options from "./pages/Options";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/import"
              element={
                <ProtectedRoute>
                  <ImportMetrics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dispatch"
              element={
                <ProtectedRoute>
                  <Dispatch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vans"
              element={
                <ProtectedRoute>
                  <Vans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipment"
              element={
                <ProtectedRoute>
                  <Equipment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driverProfiles"
              element={
                <ProtectedRoute>
                  <DriverProfiles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduling"
              element={
                <ProtectedRoute>
                  <Scheduling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute>
                  <MaintenanceLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/options"
              element={
                <ProtectedRoute>
                  <Options />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
