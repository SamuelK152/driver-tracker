import React, { useState, useEffect } from "react";
import PageShell from "../lib/PageShell";
import { useApi } from "../lib/useApi";

const CustomPositions = () => {
  const { get, post } = useApi();
  const [loading, setLoading] = useState(true);

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
      const posRes = await get("/api/config/customPositions");
      setCustomPositions(posRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
    <PageShell title="Custom Positions">
      <div className="bg-white p-6 rounded-lg shadow max-w-4xl mx-auto">
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
    </PageShell>
  );
};

export default CustomPositions;
