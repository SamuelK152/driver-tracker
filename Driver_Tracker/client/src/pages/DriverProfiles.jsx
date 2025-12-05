import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";

const DriverProfiles = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await apiClient.get("/api/driver-profiles");
      setDrivers(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching driver profiles", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Driver Profiles</h1>
      <p className="mb-4 text-gray-600">
        Manage persistent driver preferences and training.
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Transporter ID</th>
                <th className="py-2 px-4 border-b text-left">Training</th>
                <th className="py-2 px-4 border-b text-left">
                  Preferred Equipment
                </th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{driver.name}</td>
                  <td className="py-2 px-4 border-b">{driver.transporterId}</td>
                  <td className="py-2 px-4 border-b">
                    {driver.training?.join(", ") || "-"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {driver.preferredEquipment
                      ?.map((e) => e.serialNumber)
                      .join(", ") || "-"}
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">
                    No profiles found. Profiles are created when drivers are
                    assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DriverProfiles;
