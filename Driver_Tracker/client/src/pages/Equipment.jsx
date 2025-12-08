import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [vans, setVans] = useState([]);
  const [form, setForm] = useState({
    category: "Phone",
    id: "",
    phoneNumber: "",
    typeValue: "",
    count: "",
    vanId: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("Phone");

  useEffect(() => {
    fetchEquipment();
    fetchVans();
  }, []);

  const fetchEquipment = async () => {
    try {
      const res = await apiClient.get("/api/equipment");
      setEquipment(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching equipment", error);
      setLoading(false);
    }
  };

  const fetchVans = async () => {
    try {
      const res = await apiClient.get("/api/vans");
      setVans(res.data || []);
    } catch (error) {
      console.error("Error fetching vans", error);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    const payload = buildPayload();
    if (!payload) return;

    try {
      await apiClient.post("/api/equipment", payload);
      setForm({
        category: "Phone",
        id: "",
        phoneNumber: "",
        typeValue: "",
        count: "",
        vanId: "",
        notes: "",
      });
      fetchEquipment();
    } catch (error) {
      console.error("Error adding equipment", error);
      alert("Error adding equipment");
    }
  };

  const buildPayload = () => {
    const { category, id, phoneNumber, typeValue, count, vanId, notes } = form;

    if (category === "Phone") {
      if (!id) return alertMissing("ID");
      return {
        type: "Phone",
        serialNumber: id,
        phoneNumber,
        notes,
      };
    }

    if (category === "Gas Card") {
      return {
        type: "Gas Card",
        serialNumber: id || undefined,
        van: vanId || null,
        notes,
      };
    }

    if (category === "Bulk") {
      if (!typeValue) return alertMissing("Type");
      if (!count) return alertMissing("Count");
      return {
        type: typeValue,
        serialNumber: count,
        notes,
      };
    }

    // Other
    if (!typeValue) return alertMissing("Type");
    if (!id) return alertMissing("ID");
    return {
      type: typeValue,
      serialNumber: id,
      notes,
    };
  };

  const alertMissing = (field) => {
    alert(`Please provide ${field}`);
    return null;
  };

  const markMissing = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to mark this item as missing? This will create a maintenance record."
      )
    )
      return;
    try {
      await apiClient.post(`/api/equipment/${id}/missing`, {});
      fetchEquipment();
    } catch (error) {
      console.error("Error marking missing", error);
      alert("Error marking missing");
    }
  };

  const allTypes = Array.from(
    new Set(["Phone", "Gas Card", ...equipment.map((e) => e.type)])
  ).sort();
  const filteredEquipment = equipment.filter(
    (item) => item.type === selectedType
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Equipment Inventory</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Add New Equipment</h2>
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <select
            className="border p-2 rounded"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
                id: "",
                phoneNumber: "",
                typeValue: "",
                count: "",
                vanId: "",
              })
            }
          >
            <option value="Phone">Phone</option>
            <option value="Gas Card">Gas Card</option>
            <option value="Bulk">Bulk</option>
            <option value="Other">Other</option>
          </select>

          {form.category === "Phone" && (
            <>
              <input
                type="text"
                placeholder="ID"
                className="border p-2 rounded"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="border p-2 rounded"
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm({ ...form, phoneNumber: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Note"
                className="border p-2 rounded"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </>
          )}

          {form.category === "Gas Card" && (
            <>
              <input
                type="text"
                placeholder="ID (optional)"
                className="border p-2 rounded"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
              />
              <select
                className="border p-2 rounded"
                value={form.vanId}
                onChange={(e) => setForm({ ...form, vanId: e.target.value })}
              >
                <option value="">No Van</option>
                {vans.map((van) => (
                  <option key={van._id} value={van._id}>
                    {van.vanId || van.vin || van._id}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Note"
                className="border p-2 rounded"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </>
          )}

          {form.category === "Bulk" && (
            <>
              <input
                type="text"
                placeholder="Type"
                className="border p-2 rounded"
                value={form.typeValue}
                onChange={(e) =>
                  setForm({ ...form, typeValue: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Count"
                className="border p-2 rounded"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: e.target.value })}
              />
              <input
                type="text"
                placeholder="Note"
                className="border p-2 rounded"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </>
          )}

          {form.category === "Other" && (
            <>
              <input
                type="text"
                placeholder="Type"
                className="border p-2 rounded"
                value={form.typeValue}
                onChange={(e) =>
                  setForm({ ...form, typeValue: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="ID"
                className="border p-2 rounded"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
              />
              <input
                type="text"
                placeholder="Note"
                className="border p-2 rounded"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </>
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Add Equipment
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Column: Types */}
          <div className="md:col-span-1 bg-white p-4 rounded shadow h-fit">
            <h3 className="font-bold mb-2 text-lg">Types</h3>
            <ul>
              {allTypes.map((type) => (
                <li
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`cursor-pointer p-2 rounded mb-1 ${
                    selectedType === type
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {type}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Items */}
          <div className="md:col-span-3 bg-white p-4 rounded shadow overflow-x-auto">
            <h3 className="font-bold mb-4 text-lg">{selectedType} List</h3>
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  {selectedType === "Phone" ? (
                    <>
                      <th className="py-2 px-4 border-b text-left">ID</th>
                      <th className="py-2 px-4 border-b text-left">
                        Phone Number
                      </th>
                      <th className="py-2 px-4 border-b text-left">Status</th>
                      <th className="py-2 px-4 border-b text-left">Notes</th>
                      <th className="py-2 px-4 border-b text-left">Actions</th>
                    </>
                  ) : selectedType === "Gas Card" ? (
                    <>
                      <th className="py-2 px-4 border-b text-left">ID</th>
                      <th className="py-2 px-4 border-b text-left">Van</th>
                      <th className="py-2 px-4 border-b text-left">Status</th>
                      <th className="py-2 px-4 border-b text-left">Notes</th>
                      <th className="py-2 px-4 border-b text-left">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-4 border-b text-left">
                        ID / Count
                      </th>
                      <th className="py-2 px-4 border-b text-left">Status</th>
                      <th className="py-2 px-4 border-b text-left">Notes</th>
                      <th className="py-2 px-4 border-b text-left">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-4 px-4 text-center text-gray-500"
                    >
                      No items found for {selectedType}.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">
                        {item.type} {item.serialNumber}
                      </td>

                      {selectedType === "Phone" && (
                        <td className="py-2 px-4 border-b">
                          {item.phoneNumber}
                        </td>
                      )}

                      {selectedType === "Gas Card" && (
                        <td className="py-2 px-4 border-b">
                          {item.van
                            ? item.van.vanId || item.van.vin || item.van._id
                            : ""}
                        </td>
                      )}

                      <td className="py-2 px-4 border-b">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            item.status === "Available"
                              ? "bg-green-100 text-green-800"
                              : item.status === "Missing"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">{item.notes}</td>
                      <td className="py-2 px-4 border-b">
                        {item.status !== "Missing" && (
                          <button
                            onClick={() => markMissing(item._id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Mark Missing
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipment;
