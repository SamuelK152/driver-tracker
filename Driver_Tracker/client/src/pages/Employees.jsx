import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";

const DriverProfiles = () => {
  const [drivers, setDrivers] = useState([]);
  const [vans, setVans] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editMode, setEditMode] = useState(null); // 'training' or 'equipment'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [driversRes, vansRes, equipmentRes] = await Promise.all([
        apiClient.get("/api/driver-profiles"),
        apiClient.get("/api/vans"),
        apiClient.get("/api/equipment"),
      ]);
      setDrivers(driversRes.data);
      setVans(vansRes.data);
      setEquipment(equipmentRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data", error);
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingDriver) return;

    try {
      // We use the POST route which updates based on transporterId
      await apiClient.post("/api/driver-profiles", {
        transporterId: editingDriver.transporterId,
        name: editingDriver.name,
        training: editingDriver.training,
        preferredVans: editingDriver.preferredVans,
        preferredEquipment: editingDriver.preferredEquipment,
        preferredServiceTypes: editingDriver.preferredServiceTypes,
      });
      setEditingDriver(null);
      setEditMode(null);
      fetchData();
    } catch (error) {
      console.error("Error updating driver", error);
      alert("Error updating driver");
    }
  };

  const toggleSelection = (list, item) => {
    if (list.includes(item)) {
      return list.filter((i) => i !== item);
    }
    return [...list, item];
  };

  const renderActionsMenu = (driver) => {
    const isOpen = activeMenuId === driver._id;
    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          className="px-2 py-1 text-gray-600 hover:text-gray-900"
          onClick={() => setActiveMenuId(isOpen ? null : driver._id)}
        >
          ...
        </button>
        {isOpen && (
          <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1 text-sm text-gray-700">
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  setEditingDriver({
                    ...driver,
                    // Ensure arrays exist
                    training: driver.training || [],
                    preferredVans:
                      driver.preferredVans?.map((v) => v._id) || [],
                    preferredEquipment:
                      driver.preferredEquipment?.map((e) => e._id) || [],
                  });
                  setEditMode("training");
                  setActiveMenuId(null);
                }}
              >
                Edit Training
              </button>
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  setEditingDriver({
                    ...driver,
                    training: driver.training || [],
                    preferredVans:
                      driver.preferredVans?.map((v) => v._id) || [],
                    preferredEquipment:
                      driver.preferredEquipment?.map((e) => e._id) || [],
                    preferredServiceTypes: driver.preferredServiceTypes || [],
                  });
                  setEditMode("equipment");
                  setActiveMenuId(null);
                }}
              >
                Edit Preferred Equipment
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const uniqueServiceTypes = Array.from(
    new Set(vans.map((v) => v.serviceType || "Unlisted"))
  ).sort();

  const phones = equipment.filter((e) => e.type === "Phone");

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
                <th className="py-2 px-4 border-b text-left">Actions</th>
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
                    {[
                      ...(driver.preferredServiceTypes || []),
                      ...(driver.preferredVans?.map((v) => v.vanId) || []),
                      ...(driver.preferredEquipment?.map(
                        (e) => e.serialNumber
                      ) || []),
                    ].join(", ") || "-"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {renderActionsMenu(driver)}
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">
                    No profiles found. Profiles are created when drivers are
                    assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingDriver && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-lg rounded bg-white p-6 shadow max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editMode === "training"
                ? "Edit Training"
                : "Edit Preferred Equipment"}
            </h3>
            <form onSubmit={handleUpdate}>
              {editMode === "training" && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Select completed training (Service Types):
                  </p>
                  {uniqueServiceTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingDriver.training.includes(type)}
                        onChange={() =>
                          setEditingDriver({
                            ...editingDriver,
                            training: toggleSelection(
                              editingDriver.training,
                              type
                            ),
                          })
                        }
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              )}

              {editMode === "equipment" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      Preferred Service Types
                    </h4>
                    <div className="max-h-40 overflow-y-auto border p-2 rounded">
                      {uniqueServiceTypes.map((type) => (
                        <label
                          key={type}
                          className="flex items-center space-x-2 mb-1"
                        >
                          <input
                            type="checkbox"
                            checked={editingDriver.preferredServiceTypes.includes(
                              type
                            )}
                            onChange={() =>
                              setEditingDriver({
                                ...editingDriver,
                                preferredServiceTypes: toggleSelection(
                                  editingDriver.preferredServiceTypes,
                                  type
                                ),
                              })
                            }
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Preferred Vans</h4>
                    <div className="max-h-40 overflow-y-auto border p-2 rounded">
                      {vans.map((van) => (
                        <label
                          key={van._id}
                          className="flex items-center space-x-2 mb-1"
                        >
                          <input
                            type="checkbox"
                            checked={editingDriver.preferredVans.includes(
                              van._id
                            )}
                            onChange={() =>
                              setEditingDriver({
                                ...editingDriver,
                                preferredVans: toggleSelection(
                                  editingDriver.preferredVans,
                                  van._id
                                ),
                              })
                            }
                          />
                          <span>
                            {van.vanId} ({van.serviceType || "Unlisted"})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Preferred Phones</h4>
                    <div className="max-h-40 overflow-y-auto border p-2 rounded">
                      {phones.map((phone) => (
                        <label
                          key={phone._id}
                          className="flex items-center space-x-2 mb-1"
                        >
                          <input
                            type="checkbox"
                            checked={editingDriver.preferredEquipment.includes(
                              phone._id
                            )}
                            onChange={() =>
                              setEditingDriver({
                                ...editingDriver,
                                preferredEquipment: toggleSelection(
                                  editingDriver.preferredEquipment,
                                  phone._id
                                ),
                              })
                            }
                          />
                          <span>Phone {phone.serialNumber}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded border"
                  onClick={() => {
                    setEditingDriver(null);
                    setEditMode(null);
                  }}
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
    </div>
  );
};

export default DriverProfiles;
