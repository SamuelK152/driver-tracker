import React, { useState, useEffect } from "react";
import PageShell from "../lib/PageShell";
import { useApi } from "../lib/useApi";

const ManagePriority = () => {
  const { get, put, post } = useApi();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Custom Positions State
  const [customPositions, setCustomPositions] = useState([]);
  const [newPosition, setNewPosition] = useState("");
  const [savingPositions, setSavingPositions] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesData, positionsData] = await Promise.all([
        get("/api/employees"),
        get("/api/config/customPositions"),
      ]);

      // Sort by priority
      const sorted = employeesData.sort(
        (a, b) => (a.priority || 999) - (b.priority || 999)
      );
      setEmployees(sorted);
      setCustomPositions(positionsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newEmployees = [...employees];
    [newEmployees[index - 1], newEmployees[index]] = [
      newEmployees[index],
      newEmployees[index - 1],
    ];
    setEmployees(newEmployees);
  };

  const moveDown = (index) => {
    if (index === employees.length - 1) return;
    const newEmployees = [...employees];
    [newEmployees[index + 1], newEmployees[index]] = [
      newEmployees[index],
      newEmployees[index + 1],
    ];
    setEmployees(newEmployees);
  };

  const savePriorities = async () => {
    setSaving(true);
    try {
      const priorities = employees.map((d, index) => ({
        _id: d._id,
        priority: index + 1,
      }));
      await put("/api/employees/priority", priorities);
      alert("Priorities saved successfully");
    } catch (error) {
      console.error("Error saving priorities:", error);
      alert("Error saving priorities");
    } finally {
      setSaving(false);
    }
  };

  const addPosition = () => {
    if (newPosition && !customPositions.includes(newPosition)) {
      setCustomPositions([...customPositions, newPosition]);
      setNewPosition("");
    }
  };

  const removePosition = (pos) => {
    setCustomPositions(customPositions.filter((p) => p !== pos));
  };

  const savePositions = async () => {
    setSavingPositions(true);
    try {
      await post("/api/config", {
        key: "customPositions",
        value: customPositions,
      });
      alert("Positions saved successfully");
    } catch (error) {
      console.error("Error saving positions:", error);
      alert("Error saving positions");
    } finally {
      setSavingPositions(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <PageShell title="Manage Priorities & Positions">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Driver Priority Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Driver Priority</h2>
            <button
              onClick={savePriorities}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {saving ? "Saving..." : "Save Order"}
            </button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {employees.map((emp, index) => (
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
                    disabled={index === employees.length - 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Positions Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Custom Positions</h2>
            <button
              onClick={savePositions}
              disabled={savingPositions}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
            >
              {savingPositions ? "Saving..." : "Save Positions"}
            </button>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="New Position Name"
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              onClick={addPosition}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {customPositions.map((pos) => (
              <div
                key={pos}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border"
              >
                <span>{pos}</span>
                <button
                  onClick={() => removePosition(pos)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            {customPositions.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No custom positions added.
              </p>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default ManagePriority;
