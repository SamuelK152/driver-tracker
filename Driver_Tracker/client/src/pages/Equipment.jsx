import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import PageShell from "../lib/PageShell";

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Equipment"); // 'Equipment' or 'Phones'

  // Form State
  const [form, setForm] = useState({
    type: "Scanner", // Default for Equipment
    serialNumber: "",
    phoneNumber: "", // Only for Phone
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [equipRes, phonesRes] = await Promise.all([
        apiClient.get("/api/equipment"),
        apiClient.get("/api/phones"),
      ]);
      setEquipment(equipRes.data);
      setPhones(phonesRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === "Phones") {
        await apiClient.post("/api/phones", {
          serialNumber: form.serialNumber,
          phoneNumber: form.phoneNumber,
          notes: form.notes,
        });
      } else {
        await apiClient.post("/api/equipment", {
          type: form.type,
          serialNumber: form.serialNumber,
          notes: form.notes,
        });
      }
      setForm({
        type: "Scanner",
        serialNumber: "",
        phoneNumber: "",
        notes: "",
      });
      fetchData();
      alert(
        `${activeTab === "Phones" ? "Phone" : "Equipment"} added successfully`
      );
    } catch (error) {
      console.error("Error adding item", error);
      alert("Failed to add item");
    }
  };

  return (
    <PageShell title="Equipment & Phones">
      <div className="p-6">
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 ${
              activeTab === "Equipment"
                ? "border-b-2 border-blue-500 font-bold"
                : ""
            }`}
            onClick={() => setActiveTab("Equipment")}
          >
            Equipment
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "Phones"
                ? "border-b-2 border-blue-500 font-bold"
                : ""
            }`}
            onClick={() => setActiveTab("Phones")}
          >
            Phones
          </button>
        </div>

        {/* Add Form */}
        <div className="bg-white p-4 rounded shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Add New {activeTab === "Phones" ? "Phone" : "Equipment"}
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            {activeTab === "Equipment" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                >
                  <option value="Scanner">Scanner</option>
                  <option value="Gas Card">Gas Card</option>
                  <option value="Dolly">Dolly</option>
                  <option value="Uniform">Uniform</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Serial Number / ID
              </label>
              <input
                type="text"
                required
                value={form.serialNumber}
                onChange={(e) =>
                  setForm({ ...form, serialNumber: e.target.value })
                }
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              />
            </div>

            {activeTab === "Phones" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add
            </button>
          </form>
        </div>

        {/* List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === "Equipment" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serial / ID
                </th>
                {activeTab === "Phones" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === "Phones" ? phones : equipment).map((item) => (
                <tr key={item._id}>
                  {activeTab === "Equipment" && (
                    <td className="px-6 py-4 whitespace-nowrap">{item.type}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.serialNumber}
                  </td>
                  {activeTab === "Phones" && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.phoneNumber}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
};

export default Equipment;
