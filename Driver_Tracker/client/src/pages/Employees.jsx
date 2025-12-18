import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editMode, setEditMode] = useState(null); // 'details', 'training', 'preferences'

  // Data for editing
  const [vans, setVans] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [employeeTraining, setEmployeeTraining] = useState([]);
  const [employeePreferences, setEmployeePreferences] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await apiClient.get("/api/employees");
      setEmployees(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees", error);
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    if (vans.length > 0) return; // Already fetched
    try {
      const [vansRes, equipRes, typesRes] = await Promise.all([
        apiClient.get("/api/vans"),
        apiClient.get("/api/equipment"),
        apiClient.get("/api/service-types"),
      ]);
      setVans(vansRes.data);
      setEquipment(equipRes.data);
      setServiceTypes(typesRes.data);
    } catch (error) {
      console.error("Error fetching reference data", error);
    }
  };

  const handleEditClick = async (employee, mode) => {
    setEditingEmployee(employee);
    setEditMode(mode);
    setActiveMenuId(null);

    if (mode === "preferences") {
      await fetchReferenceData();
      try {
        const res = await apiClient.get(
          `/api/employees/${employee._id}/preferences`
        );
        setEmployeePreferences(res.data);
      } catch (error) {
        console.error("Error fetching preferences", error);
        setEmployeePreferences({});
      }
    } else if (mode === "training") {
      try {
        const res = await apiClient.get(
          `/api/employees/${employee._id}/training`
        );
        setEmployeeTraining(res.data);
      } catch (error) {
        console.error("Error fetching training", error);
        setEmployeeTraining([]);
      }
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(
        `/api/employees/${editingEmployee._id}/preferences`,
        employeePreferences
      );
      setEditingEmployee(null);
      setEditMode(null);
      alert("Preferences updated");
    } catch (error) {
      console.error("Error updating preferences", error);
      alert("Failed to update preferences");
    }
  };

  const handleSaveTraining = async (e) => {
    e.preventDefault();
    // Logic to save training (add new or update existing)
    // For now, let's just say we add a new one
    // This part needs a proper UI to add/remove training records
    setEditingEmployee(null);
    setEditMode(null);
  };

  const togglePreference = (listName, itemId) => {
    setEmployeePreferences((prev) => {
      const list = prev[listName] || [];
      // Check if list contains objects or IDs. The API returns populated objects.
      // We should probably store IDs for editing.
      const currentIds = list.map((i) => (typeof i === "object" ? i._id : i));

      let newIds;
      if (currentIds.includes(itemId)) {
        newIds = currentIds.filter((id) => id !== itemId);
      } else {
        newIds = [...currentIds, itemId];
      }
      return { ...prev, [listName]: newIds };
    });
  };

  const renderActionsMenu = (employee) => {
    const isOpen = activeMenuId === employee._id;
    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          className="px-2 py-1 text-gray-600 hover:text-gray-900"
          onClick={() => setActiveMenuId(isOpen ? null : employee._id)}
        >
          ...
        </button>
        {isOpen && (
          <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1 text-sm text-gray-700">
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => handleEditClick(employee, "preferences")}
              >
                Edit Preferences
              </button>
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => handleEditClick(employee, "training")}
              >
                Edit Training
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Employee
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td className="px-6 py-4 whitespace-nowrap">{emp.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {emp.transporterId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      emp.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {emp.employmentType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {renderActionsMenu(emp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editMode === "preferences"
                  ? "Edit Preferences"
                  : "Edit Training"}{" "}
                - {editingEmployee.name}
              </h2>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {editMode === "preferences" && (
              <form onSubmit={handleSavePreferences}>
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Preferred Vans</h3>
                  <div className="flex flex-wrap gap-2">
                    {vans.map((van) => {
                      const isSelected = (
                        employeePreferences.preferredVans || []
                      ).some(
                        (v) => (typeof v === "object" ? v._id : v) === van._id
                      );
                      return (
                        <button
                          key={van._id}
                          type="button"
                          onClick={() =>
                            togglePreference("preferredVans", van._id)
                          }
                          className={`px-3 py-1 rounded border ${
                            isSelected
                              ? "bg-blue-100 border-blue-500 text-blue-700"
                              : "bg-gray-50 border-gray-300"
                          }`}
                        >
                          {van.vanId}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">Preferred Service Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {serviceTypes.map((type) => {
                      const isSelected = (
                        employeePreferences.preferredServiceTypes || []
                      ).some(
                        (t) => (typeof t === "object" ? t._id : t) === type._id
                      );
                      return (
                        <button
                          key={type._id}
                          type="button"
                          onClick={() =>
                            togglePreference("preferredServiceTypes", type._id)
                          }
                          className={`px-3 py-1 rounded border ${
                            isSelected
                              ? "bg-blue-100 border-blue-500 text-blue-700"
                              : "bg-gray-50 border-gray-300"
                          }`}
                        >
                          {type.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            )}

            {editMode === "training" && (
              <div>
                <ul className="divide-y divide-gray-200 mb-4">
                  {employeeTraining.map((t) => (
                    <li key={t._id} className="py-3">
                      <div className="font-medium">{t.trainingName}</div>
                      <div className="text-sm text-gray-500">
                        Completed:{" "}
                        {new Date(t.completedDate).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                  {employeeTraining.length === 0 && (
                    <li className="py-3 text-gray-500">
                      No training records found.
                    </li>
                  )}
                </ul>
                <p className="text-sm text-gray-500 italic">
                  Training management UI to be implemented.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
