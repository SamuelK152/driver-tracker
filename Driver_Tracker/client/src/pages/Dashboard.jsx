import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import PageShell from "../lib/PageShell";

const Dashboard = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await apiClient.get("/api/drivers/today");
      setMetrics(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching metrics", error);
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      await apiClient.post("/api/assignments/auto-assign", {});
      await fetchMetrics();
      alert("Equipment auto-assigned successfully!");
    } catch (error) {
      console.error("Error auto-assigning", error);
      alert("Error auto-assigning equipment");
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Today's Dashboard"
      actions={
        <button
          onClick={handleAutoAssign}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Auto-Assign Equipment
        </button>
      }
    >
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-600">
                  Driver
                </th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-600">
                  Route
                </th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-600">
                  VIN
                </th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-600">
                  Progress
                </th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-600">
                  Equipment
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b font-medium">
                    {m.driverName || m.driverId?.name}
                  </td>
                  <td className="py-3 px-4 border-b">{m.routeCode}</td>
                  <td className="py-3 px-4 border-b">
                    {m.vanId?.vin || m.vin}
                    {!m.vanId && m.vin && (
                      <span className="ml-2 inline-block px-2 py-0.5 text-xs font-bold text-red-800 bg-red-100 rounded-full">
                        Unknown VIN
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 border-b">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${(m.stopsComplete / m.allStops) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 inline-block">
                      {m.stopsComplete} / {m.allStops}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b">
                    {m.assignedEquipment && m.assignedEquipment.length > 0 ? (
                      <span className="text-green-600 font-medium">
                        {m.assignedEquipment.length} Items Assigned
                      </span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                </tr>
              ))}
              {metrics.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No metrics found for today. Please import data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
};

export default Dashboard;
