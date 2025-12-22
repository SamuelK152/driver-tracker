import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Planning from "./pages/Planning";
import Assignments from "./pages/Assignments";
import Employees from "./pages/Employees";
import EmployeeDetailed from "./pages/EmployeeDetailed";
import Scheduling from "./pages/Scheduling";
import PlanningManage from "./pages/PlanningManage";
import PreferencePriority from "./pages/PreferencePriority";
import CustomPositions from "./pages/CustomPositions";
import Fleet from "./pages/Fleet";
import Vans from "./pages/Vans";
import Equipment from "./pages/Equipment";
import Maintenance from "./pages/Maintenance";
import FleetManage from "./pages/FleetManage";
import Dispatch from "./pages/Dispatch";
import Progress from "./pages/Progress";
import Metrics from "./pages/Metrics";
import ImportMetrics from "./pages/ImportMetrics";
import Options from "./pages/Options";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";

import DetailedScheduling from "./pages/DetailedScheduling";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes wrapped in Navigation */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigation />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />

          {/* Scheduling Routes */}
          <Route path="/planning" element={<Planning />} />
          <Route path="/planning/assignments" element={<Assignments />} />
          <Route path="/planning/employees" element={<Employees />} />
          <Route path="/employees/:id" element={<EmployeeDetailed />} />
          <Route
            path="/planning/detailed-scheduling/:date"
            element={<DetailedScheduling />}
          />
          <Route path="/planning/scheduling" element={<Scheduling />} />
          <Route path="/planning/manage" element={<PlanningManage />} />
          <Route
            path="/planning/manage/priority"
            element={<PreferencePriority />}
          />
          <Route
            path="/planning/manage/positions"
            element={<CustomPositions />}
          />
          {/* Fleet Routes */}
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/fleet/vans" element={<Vans />} />
          <Route path="/fleet/equipment" element={<Equipment />} />
          <Route path="/fleet/maintenance" element={<Maintenance />} />
          <Route path="/fleet/manage" element={<FleetManage />} />

          {/* Dispatch Routes */}
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/dispatch/progress" element={<Progress />} />
          <Route path="/dispatch/metrics" element={<Metrics />} />
          <Route path="/dispatch/import" element={<ImportMetrics />} />

          <Route path="/options" element={<Options />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
