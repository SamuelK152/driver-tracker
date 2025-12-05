import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import StatusBadge from "../lib/StatusBadge";

const Vans = () => {
  const [vans, setVans] = useState([]);
  const [newVan, setNewVan] = useState({
    vin: "",
    make: "",
    model: "",
    year: "",
    licensePlate: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVans();
  }, []);

  const fetchVans = async () => {
    try {
      const res = await apiClient.get("/api/vans");
      setVans(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vans", error);
      setLoading(false);
    }
  };

  const handleAddVan = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/vans", newVan);
      setNewVan({ vin: "", make: "", model: "", year: "", licensePlate: "" });
      fetchVans();
    } catch (error) {
      console.error("Error adding van", error);
      alert("Error adding van");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Van Inventory</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Add New Van</h2>
        <form
          onSubmit={handleAddVan}
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <input
            type="text"
            placeholder="VIN"
            className="border p-2 rounded"
            required
            value={newVan.vin}
            onChange={(e) => setNewVan({ ...newVan, vin: e.target.value })}
          />
          <input
            type="text"
            placeholder="Make"
            className="border p-2 rounded"
            value={newVan.make}
            onChange={(e) => setNewVan({ ...newVan, make: e.target.value })}
          />
          <input
            type="text"
            placeholder="Model"
            className="border p-2 rounded"
            value={newVan.model}
            onChange={(e) => setNewVan({ ...newVan, model: e.target.value })}
          />
          <input
            type="number"
            placeholder="Year"
            className="border p-2 rounded"
            value={newVan.year}
            onChange={(e) => setNewVan({ ...newVan, year: e.target.value })}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Add Van
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">VIN</th>
                <th className="py-2 px-4 border-b text-left">Make/Model</th>
                <th className="py-2 px-4 border-b text-left">Year</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vans.map((van) => (
                <tr key={van._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{van.vin}</td>
                  <td className="py-2 px-4 border-b">
                    {van.make} {van.model}
                  </td>
                  <td className="py-2 px-4 border-b">{van.year}</td>
                  <td className="py-2 px-4 border-b">
                    <StatusBadge
                      label={van.status}
                      variant={
                        van.status === "Active"
                          ? "success"
                          : van.status === "Maintenance"
                          ? "warning"
                          : "danger"
                      }
                    />
                  </td>
                  <td className="py-2 px-4 border-b">
                    {/* Placeholder for future actions like Edit or Report Issue */}
                    <button className="text-blue-600 hover:underline mr-2">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Vans;
