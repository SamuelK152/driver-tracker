import React, { useState, useEffect } from "react";
import PageShell from "../lib/PageShell";
import { useApi } from "../lib/useApi";

const PreferencePriority = () => {
  const { get, put, post } = useApi();
  const [loading, setLoading] = useState(true);

  // Data
  const [employees, setEmployees] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [vans, setVans] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  // Selection State
  const [selectedType, setSelectedType] = useState("van"); // 'van', 'equipment', 'service'
  const [selectedItemId, setSelectedItemId] = useState("");
  const [currentPriorityList, setCurrentPriorityList] = useState([]);
  const [savingPriority, setSavingPriority] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, prefRes, vansRes, equipRes, servRes] = await Promise.all([
        get("/api/employees"),
        get("/api/preferences"),
        get("/api/vans"),
        get("/api/equipment"),
        get("/api/service-types"),
      ]);

      setEmployees(empRes || []);
      setPreferences(prefRes || []);
      setVans(vansRes || []);
      setEquipment(equipRes || []);
      setServiceTypes(servRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update list when selection changes
  useEffect(() => {
    if (!selectedItemId) {
      setCurrentPriorityList([]);
      return;
    }

    // Find the preference document for this item
    const prefDoc = preferences.find(
      (p) =>
        p.pref &&
        (typeof p.pref === "object" ? p.pref._id : p.pref) === selectedItemId
    );

    if (prefDoc && prefDoc.employees) {
      // Map employee IDs to full employee objects for display
      const list = prefDoc.employees.map((empId) => {
        const id = typeof empId === "object" ? empId._id : empId;
        return (
          employees.find((e) => e._id === id) || { _id: id, name: "Unknown" }
        );
      });
      setCurrentPriorityList(list);
    } else {
      setCurrentPriorityList([]);
    }
  }, [selectedItemId, preferences, employees]);

  const getListItems = () => {
    switch (selectedType) {
      case "van":
        return vans.map((v) => ({ id: v._id, label: v.vanId }));
      case "equipment":
        return equipment.map((e) => ({ id: e._id, label: e.name }));
      case "service":
        return serviceTypes.map((s) => ({ id: s._id, label: s.name }));
      default:
        return [];
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newList = [...currentPriorityList];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setCurrentPriorityList(newList);
  };

  const moveDown = (index) => {
    if (index === currentPriorityList.length - 1) return;
    const newList = [...currentPriorityList];
    [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
    setCurrentPriorityList(newList);
  };

  const savePriorityOrder = async () => {
    if (!selectedItemId) return;
    setSavingPriority(true);
    try {
      // Find the preference doc ID
      const prefDoc = preferences.find(
        (p) =>
          p.pref &&
          (typeof p.pref === "object" ? p.pref._id : p.pref) === selectedItemId
      );

      if (prefDoc) {
        // Update existing preference doc
        const employeeIds = currentPriorityList.map((e) => e._id);
        await put(`/api/preferences/${prefDoc._id}`, {
          ...prefDoc,
          employees: employeeIds,
        });

        // Update local state to reflect saved version
        setPreferences((prev) =>
          prev.map((p) =>
            p._id === prefDoc._id ? { ...p, employees: employeeIds } : p
          )
        );
      } else {
        // Create new preference doc if it doesn't exist yet
        const employeeIds = currentPriorityList.map((e) => e._id);

        let onModel = "Van";
        if (selectedType === "equipment") onModel = "Equipment";
        if (selectedType === "service") onModel = "ServiceType";

        const res = await post("/api/preferences", {
          pref: selectedItemId,
          employees: employeeIds,
          type: onModel,
        });
        setPreferences([...preferences, res]);
      }
      alert("Priority order saved");
    } catch (error) {
      console.error("Error saving priority:", error);
      alert("Failed to save priority");
    } finally {
      setSavingPriority(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <PageShell title="Preference Priority">
      <div className="bg-white p-6 rounded-lg shadow max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Preference Priority</h2>
          <button
            onClick={savePriorityOrder}
            disabled={savingPriority || !selectedItemId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {savingPriority ? "Saving..." : "Save Order"}
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSelectedItemId("");
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="van">Van</option>
              <option value="equipment">Equipment</option>
              <option value="service">Service Type</option>
            </select>
          </div>
          <div className="w-2/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Item...</option>
              {getListItems().map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto border-t pt-4">
          {currentPriorityList.length === 0 ? (
            <p className="text-gray-500 text-center italic">
              Select an item to view/order employees.
            </p>
          ) : (
            currentPriorityList.map((emp, index) => (
              <div
                key={emp._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border"
              >
                <span className="font-medium">
                  {index + 1}. {emp.name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === currentPriorityList.length - 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default PreferencePriority;
