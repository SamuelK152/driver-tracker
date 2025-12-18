import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import StatusBadge from "../lib/StatusBadge";
import PageShell from "../lib/PageShell";

const ServiceTypeAutocomplete = ({
  value,
  onChange,
  serviceTypes,
  placeholder,
  className,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredTypes = serviceTypes.filter((t) =>
    t.name.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="border rounded px-3 py-2 w-full"
      />
      {showSuggestions && value && filteredTypes.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto mt-1">
          {filteredTypes.map((type) => (
            <li
              key={type._id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange(type.name);
                setShowSuggestions(false);
              }}
            >
              {type.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Vans = () => {
  const [vans, setVans] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
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
  const [newVanServiceTypeInput, setNewVanServiceTypeInput] = useState("");
  const [editingVanServiceTypeInput, setEditingVanServiceTypeInput] =
    useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vansRes, typesRes] = await Promise.all([
        apiClient.get("/api/vans"),
        apiClient.get("/api/service-types"),
      ]);
      setVans(vansRes.data);
      setServiceTypes(typesRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateServiceType = async (typeName) => {
    if (!typeName) return null;
    const trimmedName = typeName.trim();
    const existing = serviceTypes.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) return existing._id;

    try {
      const res = await apiClient.post("/api/service-types", {
        name: trimmedName,
      });
      setServiceTypes((prev) => [...prev, res.data]);
      return res.data._id;
    } catch (error) {
      console.error("Error creating service type", error);
      throw error;
    }
  };

  const handleAddVan = async (e) => {
    e.preventDefault();
    try {
      const serviceTypeId = await getOrCreateServiceType(
        newVanServiceTypeInput
      );
      await apiClient.post("/api/vans", { ...newVan, serviceTypeId });
      setNewVan({
        vanId: "",
        vin: "",
        make: "",
        model: "",
        year: "",
        licensePlate: "",
        serviceType: "",
      });
      setNewVanServiceTypeInput("");
      fetchData();
      alert("Van added successfully");
    } catch (error) {
      console.error("Error adding van", error);
      alert("Error adding van");
    }
  };

  const handleUpdateVan = async (e) => {
    e.preventDefault();
    if (!editingVan) return;
    try {
      const serviceTypeId = await getOrCreateServiceType(
        editingVanServiceTypeInput
      );
      await apiClient.put(`/api/vans/${editingVan._id}`, {
        ...editingVan,
        serviceTypeId,
      });
      setEditingVan(null);
      fetchData();
      alert("Van updated successfully");
    } catch (error) {
      console.error("Error updating van", error);
      alert("Error updating van");
    }
  };

  const handleDeleteVan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this van?")) return;
    try {
      await apiClient.delete(`/api/vans/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting van", error);
      alert("Error deleting van");
    }
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
          <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1 text-sm text-gray-700">
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  setEditingVan({
                    ...van,
                    serviceTypeId:
                      van.serviceTypeId?._id || van.serviceTypeId || "",
                  });
                  setEditingVanServiceTypeInput(van.serviceTypeId?.name || "");
                  setActiveMenuId(null);
                }}
              >
                Edit
              </button>
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                onClick={() => handleDeleteVan(van._id)}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <PageShell title="Fleet Management">
      <div className="p-6">
        {/* Add Van Form */}
        <div className="bg-white p-4 rounded shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Add New Van</h3>
          <form
            onSubmit={handleAddVan}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <input
              type="text"
              placeholder="Van ID (e.g. GV01)"
              required
              value={newVan.vanId}
              onChange={(e) => setNewVan({ ...newVan, vanId: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="VIN"
              required
              value={newVan.vin}
              onChange={(e) => setNewVan({ ...newVan, vin: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Make"
              value={newVan.make}
              onChange={(e) => setNewVan({ ...newVan, make: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Model"
              value={newVan.model}
              onChange={(e) => setNewVan({ ...newVan, model: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Year"
              value={newVan.year}
              onChange={(e) => setNewVan({ ...newVan, year: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="License Plate"
              value={newVan.licensePlate}
              onChange={(e) =>
                setNewVan({ ...newVan, licensePlate: e.target.value })
              }
              className="border rounded px-3 py-2"
            />
            <ServiceTypeAutocomplete
              value={newVanServiceTypeInput}
              onChange={setNewVanServiceTypeInput}
              serviceTypes={serviceTypes}
              placeholder="Service Type"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Van
            </button>
          </form>
        </div>

        {/* Vans List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Make/Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Plate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vans.map((van) => (
                <tr key={van._id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {van.vanId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{van.vin}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {van.make} {van.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{van.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {van.licensePlate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {van.serviceTypeId?.name || "Unlisted"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={van.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {renderActionsMenu(van)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editingVan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                Edit Van {editingVan.vanId}
              </h2>
              <form onSubmit={handleUpdateVan}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Make
                    </label>
                    <input
                      type="text"
                      value={editingVan.make || ""}
                      onChange={(e) =>
                        setEditingVan({ ...editingVan, make: e.target.value })
                      }
                      className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Model
                    </label>
                    <input
                      type="text"
                      value={editingVan.model || ""}
                      onChange={(e) =>
                        setEditingVan({ ...editingVan, model: e.target.value })
                      }
                      className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Year
                    </label>
                    <input
                      type="number"
                      value={editingVan.year || ""}
                      onChange={(e) =>
                        setEditingVan({ ...editingVan, year: e.target.value })
                      }
                      className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      License Plate
                    </label>
                    <input
                      type="text"
                      value={editingVan.licensePlate || ""}
                      onChange={(e) =>
                        setEditingVan({
                          ...editingVan,
                          licensePlate: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Service Type
                    </label>
                    <ServiceTypeAutocomplete
                      value={editingVanServiceTypeInput}
                      onChange={setEditingVanServiceTypeInput}
                      serviceTypes={serviceTypes}
                      placeholder="Select Service Type"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={editingVan.status}
                      onChange={(e) =>
                        setEditingVan({ ...editingVan, status: e.target.value })
                      }
                      className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3"
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingVan(null)}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Vans;
