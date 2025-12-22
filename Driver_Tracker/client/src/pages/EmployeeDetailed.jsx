import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../lib/apiClient";
import DetailedView from "../components/DetailedView";

const EmployeeDetailed = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Training");

  // Data
  const [training, setTraining] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [vans, setVans] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [expandedServiceTypes, setExpandedServiceTypes] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, trainRes, prefRes, vansRes, typesRes] =
          await Promise.all([
            apiClient.get(`/api/employees/${id}`),
            apiClient.get(`/api/employees/${id}/training`),
            apiClient.get(`/api/employees/${id}/preferences`),
            apiClient.get("/api/vans"),
            apiClient.get("/api/service-types"),
          ]);

        setEmployee(empRes.data);
        setTraining(trainRes.data);
        setPreferences(prefRes.data);
        setVans(vansRes.data);
        setServiceTypes(typesRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching employee details", error);
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSavePreferences = async () => {
    try {
      // Ensure we send only IDs
      const payload = {
        ...preferences,
        preferredVans: (preferences.preferredVans || []).map((v) =>
          typeof v === "object" ? v._id : v
        ),
        preferredServiceTypes: (preferences.preferredServiceTypes || []).map(
          (t) => (typeof t === "object" ? t._id : t)
        ),
      };
      await apiClient.put(`/api/employees/${id}/preferences`, payload);
      alert("Preferences updated successfully");
    } catch (error) {
      console.error("Error updating preferences", error);
      alert("Failed to update preferences");
    }
  };

  const toggleServiceType = (type) => {
    setExpandedServiceTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const togglePreference = (listName, itemId) => {
    setPreferences((prev) => {
      const list = prev[listName] || [];
      // Ensure we are working with IDs
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

  if (loading) return <div className="p-8">Loading...</div>;
  if (!employee) return <div className="p-8">Employee not found</div>;

  const summary = (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">{employee.name}</h1>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="font-semibold text-gray-600">ID:</span>{" "}
              {employee.transporterId}
            </div>
            <div>
              <span className="font-semibold text-gray-600">Status:</span>{" "}
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  employee.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {employee.status}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Type:</span>{" "}
              {employee.employmentType}
            </div>
            <div>
              <span className="font-semibold text-gray-600">Start Date:</span>{" "}
              {employee.startDate
                ? new Date(employee.startDate).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700"
        >
          Back
        </button>
      </div>
      {employee.notes && (
        <div className="mt-4 text-sm">
          <span className="font-semibold text-gray-600">Notes:</span>
          <p className="mt-1 text-gray-700">{employee.notes}</p>
        </div>
      )}
    </div>
  );

  const categories = ["Training", "Service Type Preference", "Van Preference"];

  const leftPanel = (
    <div className="flex flex-col space-y-1">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveCategory(cat)}
          className={`px-4 py-3 text-left rounded-md transition-colors ${
            activeCategory === cat
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  const renderRightPanelContent = () => {
    switch (activeCategory) {
      case "Training":
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Training Records</h3>
            <ul className="divide-y divide-gray-200">
              {training.map((t) => (
                <li key={t._id} className="py-3">
                  <div className="font-medium">{t.trainingName}</div>
                  <div className="text-sm text-gray-500">
                    Completed: {new Date(t.completedDate).toLocaleDateString()}
                  </div>
                  {t.expiryDate && (
                    <div className="text-sm text-gray-500">
                      Expires: {new Date(t.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
              {training.length === 0 && (
                <li className="py-3 text-gray-500">
                  No training records found.
                </li>
              )}
            </ul>
          </div>
        );
      case "Service Type Preference":
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Service Type Preferences</h3>
              <button
                onClick={handleSavePreferences}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
            <div className="space-y-2">
              {serviceTypes.map((type) => {
                const isSelected = (
                  preferences.preferredServiceTypes || []
                ).some((t) => (typeof t === "object" ? t._id : t) === type._id);
                return (
                  <label
                    key={type._id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        togglePreference("preferredServiceTypes", type._id)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{type.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      case "Van Preference":
        // Group vans by service type
        const groupedVans = vans.reduce((acc, van) => {
          const typeName = van.serviceTypeId?.name || "Unassigned";
          if (!acc[typeName]) acc[typeName] = [];
          acc[typeName].push(van);
          return acc;
        }, {});

        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Van Preferences</h3>
              <button
                onClick={handleSavePreferences}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(groupedVans).map(([typeName, groupVans]) => (
                <div
                  key={typeName}
                  className="border rounded-md overflow-hidden"
                >
                  <button
                    onClick={() => toggleServiceType(typeName)}
                    className="w-full flex justify-between items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors text-left"
                  >
                    <span className="font-medium text-gray-700">
                      {typeName} ({groupVans.length})
                    </span>
                    <span className="text-gray-500">
                      {expandedServiceTypes[typeName] ? "▼" : "▶"}
                    </span>
                  </button>

                  {expandedServiceTypes[typeName] && (
                    <div className="p-4 bg-white border-t">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {groupVans.map((van) => {
                          const isSelected = (
                            preferences.preferredVans || []
                          ).some(
                            (v) =>
                              (typeof v === "object" ? v._id : v) === van._id
                          );
                          return (
                            <label
                              key={van._id}
                              className={`flex items-center justify-center p-2 border rounded cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50 border-blue-500 text-blue-700"
                                  : "bg-white border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  togglePreference("preferredVans", van._id)
                                }
                                className="sr-only" // Hide default checkbox
                              />
                              <span>{van.vanId}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DetailedView
      summary={summary}
      leftPanel={leftPanel}
      rightPanel={renderRightPanelContent()}
    />
  );
};

export default EmployeeDetailed;
