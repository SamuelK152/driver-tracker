import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ImportMetrics from "./pages/ImportMetrics";
import History from "./pages/History";
import Dispatch from "./pages/Dispatch";
import Options from "./pages/Options";
import Vans from "./pages/Vans";
import Equipment from "./pages/Equipment";
import IssueLog from "./pages/IssueLog";
import DriverProfiles from "./pages/DriverProfiles";
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
              path="/options"
              element={
                <ProtectedRoute>
                  <Options />
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
              path="/issues"
              element={
                <ProtectedRoute>
                  <IssueLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profiles"
              element={
                <ProtectedRoute>
                  <DriverProfiles />
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
