import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import StatusBadge from "../lib/StatusBadge";

const TypeaheadInput = ({
  value,
  onChange,
  options,
  placeholder,
  type = "text",
  required = false,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filteredOptions = options.filter((opt) =>
    String(opt).toLowerCase().includes(String(value).toLowerCase())
  );

  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        className="border p-2 rounded w-full"
        value={value}
        required={required}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      {showSuggestions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
          {filteredOptions.map((opt, idx) => (
            <li
              key={idx}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => {
                onChange(opt);
                setShowSuggestions(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Vans = () => {
  const [vans, setVans] = useState([]);
  const [newVan, setNewVan] = useState({
    vanId: "",
    vin: "",
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    serviceType: "",
  });
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingVan, setEditingVan] = useState(null);
  const [maintenanceVan, setMaintenanceVan] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    description: "",
    priority: "Medium",
  });
  const [selectedServiceType, setSelectedServiceType] = useState("Unlisted");

  const uniqueMakes = Array.from(
    new Set(vans.map((v) => v.make).filter(Boolean))
  ).sort();
  const uniqueModels = Array.from(
    new Set(vans.map((v) => v.model).filter(Boolean))
  ).sort();
  const uniqueYears = Array.from(
    new Set(vans.map((v) => v.year).filter(Boolean))
  ).sort((a, b) => b - a);
  const uniqueServiceTypes = Array.from(
    new Set(vans.map((v) => v.serviceType || "Unlisted"))
  ).sort();

  useEffect(() => {
    fetchVans();
  }, []);

  const fetchVans = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/vans");
      setVans(res.data);
    } catch (error) {
      console.error("Error fetching vans", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVan = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/vans", {
        ...newVan,
        year: newVan.year ? Number(newVan.year) : undefined,
      });
      setNewVan({
        vanId: "",
        vin: "",
        make: "",
        model: "",
        year: "",
        licensePlate: "",
        serviceType: "Unlisted",
      });
      fetchVans();
    } catch (error) {
      console.error("Error adding van", error);
      alert("Error adding van");
    }
  };

  const handleUpdateVan = async (e) => {
    e.preventDefault();
    if (!editingVan) return;
    try {
      await apiClient.put(`/api/vans/${editingVan._id}`, {
        vanId: editingVan.vanId,
        vin: editingVan.vin,
        make: editingVan.make,
        model: editingVan.model,
        year: editingVan.year ? Number(editingVan.year) : undefined,
        licensePlate: editingVan.licensePlate,
        serviceType: editingVan.serviceType,
        status: editingVan.status,
        notes: editingVan.notes,
      });
      setEditingVan(null);
      fetchVans();
    } catch (error) {
      console.error("Error updating van", error);
      alert("Error updating van");
    }
  };

  const handleSubmitMaintenance = async (e) => {
    e.preventDefault();
    if (!maintenanceVan) return;
    try {
      await apiClient.post("/api/maintenance", {
        ...maintenanceForm,
        relatedType: "Van",
        relatedId: maintenanceVan._id,
      });
      setMaintenanceVan(null);
      setMaintenanceForm({ description: "", priority: "Medium" });
      alert("Maintenance record created");
    } catch (error) {
      console.error("Error creating maintenance record", error);
      alert("Error creating maintenance record");
    }
  };

  const closeModals = () => {
    setEditingVan(null);
    setMaintenanceVan(null);
    setMaintenanceForm({ description: "", priority: "Medium" });
  };

  const renderActionsMenu = (van) => {
    const isOpen = activeMenuId === van._id;
    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          className="px-2 py-1 text-gray-600 hover:text-gray-900"
          onClick={() => setActiveMenuId(isOpen ? null : van._id)}
        >
          ...
        </button>
        {isOpen && (
          <div className="absolute right-0 z-10 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1 text-sm text-gray-700">
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  setEditingVan({
                    ...van,
                    year: van.year ?? "",
                  });
                  setActiveMenuId(null);
                }}
              >
                Edit van
              </button>
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  setMaintenanceVan(van);
                  setActiveMenuId(null);
                }}
              >
                Add maintenance
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const allServiceTypes = Array.from(
    new Set(vans.map((v) => v.serviceType || "Unlisted"))
  ).sort();
  const filteredVans = vans.filter(
    (van) => (van.serviceType || "Unlisted") === selectedServiceType
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Van Inventory</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Add New Van</h2>
        <form
          onSubmit={handleAddVan}
          className="grid grid-cols-1 md:grid-cols-6 gap-4"
        >
          <input
            type="text"
            placeholder="ID"
            className="border p-2 rounded"
            required
            value={newVan.vanId}
            onChange={(e) => setNewVan({ ...newVan, vanId: e.target.value })}
          />
          <input
            type="text"
            placeholder="VIN"
            className="border p-2 rounded"
            required
            value={newVan.vin}
            onChange={(e) => setNewVan({ ...newVan, vin: e.target.value })}
          />
          <TypeaheadInput
            placeholder="Make"
            value={newVan.make}
            onChange={(val) => setNewVan({ ...newVan, make: val })}
            options={uniqueMakes}
          />
          <TypeaheadInput
            placeholder="Model"
            value={newVan.model}
            onChange={(val) => setNewVan({ ...newVan, model: val })}
            options={uniqueModels}
          />
          <TypeaheadInput
            placeholder="Year"
            type="number"
            value={newVan.year}
            onChange={(val) => setNewVan({ ...newVan, year: val })}
            options={uniqueYears}
          />
          <TypeaheadInput
            placeholder="Service Type"
            value={newVan.serviceType}
            onChange={(val) => setNewVan({ ...newVan, serviceType: val })}
            options={uniqueServiceTypes}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Column: Service Types */}
          <div className="md:col-span-1 bg-white p-4 rounded shadow h-fit">
            <h3 className="font-bold mb-2 text-lg">Service Types</h3>
            <ul>
              {allServiceTypes.map((type) => (
                <li
                  key={type}
                  onClick={() => setSelectedServiceType(type)}
                  className={`cursor-pointer p-2 rounded mb-1 ${
                    selectedServiceType === type
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {type}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Vans List */}
          <div className="md:col-span-3 bg-white p-4 rounded shadow overflow-x-auto">
            <h3 className="font-bold mb-4 text-lg">
              {selectedServiceType} Vans
            </h3>
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">ID</th>
                  <th className="py-2 px-4 border-b text-left">VIN</th>
                  <th className="py-2 px-4 border-b text-left">Make/Model</th>
                  <th className="py-2 px-4 border-b text-left">Year</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVans.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-4 px-4 text-center text-gray-500"
                    >
                      No vans found for {selectedServiceType}.
                    </td>
                  </tr>
                ) : (
                  filteredVans.map((van) => (
                    <tr key={van._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{van.vanId || "—"}</td>
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
                        {renderActionsMenu(van)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingVan && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-lg rounded bg-white p-6 shadow">
            <h3 className="text-xl font-semibold mb-4">Edit Van</h3>
            <form className="space-y-3" onSubmit={handleUpdateVan}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="ID"
                  className="border p-2 rounded"
                  required
                  value={editingVan.vanId || ""}
                  onChange={(e) =>
                    setEditingVan({ ...editingVan, vanId: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="VIN"
                  className="border p-2 rounded"
                  required
                  value={editingVan.vin || ""}
                  onChange={(e) =>
                    setEditingVan({ ...editingVan, vin: e.target.value })
                  }
                />
                <TypeaheadInput
                  placeholder="Make"
                  value={editingVan.make || ""}
                  onChange={(val) =>
                    setEditingVan({ ...editingVan, make: val })
                  }
                  options={uniqueMakes}
                />
                <TypeaheadInput
                  placeholder="Model"
                  value={editingVan.model || ""}
                  onChange={(val) =>
                    setEditingVan({ ...editingVan, model: val })
                  }
                  options={uniqueModels}
                />
                <TypeaheadInput
                  placeholder="Year"
                  type="number"
                  value={editingVan.year || ""}
                  onChange={(val) =>
                    setEditingVan({ ...editingVan, year: val })
                  }
                  options={uniqueYears}
                />
                <input
                  type="text"
                  placeholder="License Plate"
                  className="border p-2 rounded"
                  value={editingVan.licensePlate || ""}
                  onChange={(e) =>
                    setEditingVan({
                      ...editingVan,
                      licensePlate: e.target.value,
                    })
                  }
                />
                <TypeaheadInput
                  placeholder="Service Type"
                  value={editingVan.serviceType || ""}
                  onChange={(val) =>
                    setEditingVan({
                      ...editingVan,
                      serviceType: val,
                    })
                  }
                  options={uniqueServiceTypes}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded border"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {maintenanceVan && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-lg rounded bg-white p-6 shadow">
            <h3 className="text-xl font-semibold mb-4">
              Add Maintenance for {maintenanceVan.vanId || maintenanceVan.vin}
            </h3>
            <form className="space-y-3" onSubmit={handleSubmitMaintenance}>
              <textarea
                className="w-full border rounded p-2"
                placeholder="Describe the maintenance need"
                required
                value={maintenanceForm.description}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    description: e.target.value,
                  })
                }
              />
              <div>
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  className="border rounded p-2 w-full"
                  value={maintenanceForm.priority}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      priority: e.target.value,
                    })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded border"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Create Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vans;
