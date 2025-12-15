import React, { useState, useEffect } from "react";
import PageShell from "../lib/PageShell";
import { useApi } from "../lib/useApi";

const ManagePriority = () => {
  const { get, put, post } = useApi();
  const [drivers, setDrivers] = useState([]);
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
      const [driversData, positionsData] = await Promise.all([
        get("/api/driver-profiles"),
        get("/api/config/customPositions"),
      ]);

      // Sort by priority
      const sorted = driversData.sort(
        (a, b) => (a.priority || 999) - (b.priority || 999)
      );
      setDrivers(sorted);
      setCustomPositions(positionsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newDrivers = [...drivers];
    [newDrivers[index - 1], newDrivers[index]] = [
      newDrivers[index],
      newDrivers[index - 1],
    ];
    setDrivers(newDrivers);
  };

  const moveDown = (index) => {
    if (index === drivers.length - 1) return;
    const newDrivers = [...drivers];
    [newDrivers[index + 1], newDrivers[index]] = [
      newDrivers[index],
      newDrivers[index + 1],
    ];
    setDrivers(newDrivers);
  };

  const savePriorities = async () => {
    setSaving(true);
    try {
      const priorities = drivers.map((d, index) => ({
        _id: d._id,
        priority: index + 1,
      }));
      // Send array directly as per backend implementation
      await put("/api/driver-profiles/priority", priorities);
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

  return (
    <PageShell title="Manage Scheduling">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Priority Section */}
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Driver Priority</h2>
            <button
              onClick={savePriorities}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Order"}
            </button>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Drag or use arrows to order drivers. Top drivers get priority for
            preferred vans and routes.
          </p>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drivers.map((driver, index) => (
                    <tr key={driver._id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {driver.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => moveUp(index)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveDown(index)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={index === drivers.length - 1}
                        >
                          ↓
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Custom Positions Section */}
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Custom Positions</h2>
            <button
              onClick={savePositions}
              disabled={savingPositions}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {savingPositions ? "Saving..." : "Save Positions"}
            </button>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Define custom roles that can be assigned to drivers on the schedule
            (e.g., "Rescue", "Lead").
          </p>

          <div className="bg-white shadow rounded-lg p-4">
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

            <ul className="divide-y divide-gray-200">
              {customPositions.map((pos) => (
                <li
                  key={pos}
                  className="py-3 flex justify-between items-center"
                >
                  <span>{pos}</span>
                  <button
                    onClick={() => removePosition(pos)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {customPositions.length === 0 && (
                <li className="py-3 text-gray-500 italic">
                  No custom positions defined.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default ManagePriority;
