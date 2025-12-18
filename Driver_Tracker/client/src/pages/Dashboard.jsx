import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import PageShell from "../lib/PageShell";

const Dashboard = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await apiClient.get(`/api/routes?date=${today}`);
      setRoutes(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setLoading(false);
    }
  };

  return (
    <PageShell title="Today's Dashboard">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Routes</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {routes.length === 0 ? (
                <li className="px-4 py-4 sm:px-6 text-gray-500">
                  No routes found for today.
                </li>
              ) : (
                routes.map((route) => (
                  <li key={route._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-blue-600 truncate">
                        {route.routeCode}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            route.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {route.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Driver: {route.driverId?.name || "Unassigned"}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Van: {route.vanId?.vanId || "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Dashboard;
