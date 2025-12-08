import React, { useEffect, useState } from "react";
import apiClient from "../lib/apiClient";
import StatusBadge from "../lib/StatusBadge";

const statusVariant = (status) => {
  if (status === "Resolved") return "success";
  if (status === "In Progress") return "warning";
  return "danger";
};

const MaintenanceLog = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vans, setVans] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [createForm, setCreateForm] = useState({
    description: "",
    priority: "Medium",
    relatedType: "Van",
    relatedId: "",
  });
  const [assetQuery, setAssetQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editing, setEditing] = useState(null);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => {
    fetchRecords();
    fetchAssets();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/maintenance");
      setRecords(res.data);
    } catch (error) {
      console.error("Error fetching maintenance records", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const [vanRes, equipmentRes] = await Promise.all([
        apiClient.get("/api/vans"),
        apiClient.get("/api/equipment"),
      ]);
      setVans(vanRes.data || []);
      setEquipment(equipmentRes.data || []);
    } catch (error) {
      console.error("Error fetching assets", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.relatedId) {
      alert("Select a related asset from suggestions");
      return;
    }
    try {
      await apiClient.post("/api/maintenance", createForm);
      setCreateForm({
        description: "",
        priority: "Medium",
        relatedType: "Van",
        relatedId: "",
      });
      setAssetQuery("");
      fetchRecords();
    } catch (error) {
      console.error("Error creating maintenance", error);
      alert("Error creating maintenance record");
    }
  };

  const setRelatedType = (type) => {
    setCreateForm((prev) => ({
      ...prev,
      relatedType: type,
      relatedId: "",
    }));
    setAssetQuery("");
    setShowSuggestions(false);
  };

  const assetLabel = (record) => {
    if (record.relatedType === "Van") {
      const van = vans.find((v) => v._id === record.relatedId);
      if (van) return van.vanId || van.vin || "Van";
    }
    if (record.relatedType === "Equipment") {
      const eq = equipment.find((e) => e._id === record.relatedId);
      if (eq) return eq.serialNumber || eq.type || "Equipment";
    }
    return record.relatedId;
  };

  const currentAssets = createForm.relatedType === "Van" ? vans : equipment;
  const filteredSuggestions = currentAssets.filter((asset) => {
    const label =
      createForm.relatedType === "Van"
        ? asset.vanId || asset.vin || ""
        : asset.serialNumber || asset.type || "";
    return label.toLowerCase().includes(assetQuery.toLowerCase());
  });

  const pickAsset = (asset) => {
    const label =
      createForm.relatedType === "Van"
        ? asset.vanId || asset.vin || asset._id
        : asset.serialNumber || asset.type || asset._id;
    setCreateForm((prev) => ({ ...prev, relatedId: asset._id }));
    setAssetQuery(label);
    setShowSuggestions(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await apiClient.put(`/api/maintenance/${editing._id}`, {
        description: editing.description,
        priority: editing.priority,
        status: editing.status,
        resolutionNotes: editing.resolutionNotes,
      });
      setEditing(null);
      fetchRecords();
    } catch (error) {
      console.error("Error updating maintenance", error);
      alert("Error updating maintenance record");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteTarget) return;
    try {
      await apiClient.post(`/api/maintenance/${noteTarget._id}/notes`, {
        body: noteBody,
      });
      setNoteBody("");
      setNoteTarget(null);
      fetchRecords();
    } catch (error) {
      console.error("Error adding note", error);
      alert("Error adding note");
    }
  };

  const renderNotes = (record) => {
    if (!record.notes?.length)
      return <span className="text-gray-400">No notes</span>;
    const last = record.notes[record.notes.length - 1];
    return (
      <div className="text-sm text-gray-700">
        <div className="font-semibold">Last note</div>
        <div>{last.body}</div>
        <div className="text-xs text-gray-500">
          {new Date(last.createdAt).toLocaleString()}{" "}
          {last.user?.username ? `• ${last.user.username}` : ""}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Maintenance Log</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Create Maintenance</h2>
        <form
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
          onSubmit={handleCreate}
        >
          <input
            className="border p-2 rounded"
            placeholder="Description"
            required
            value={createForm.description}
            onChange={(e) =>
              setCreateForm({ ...createForm, description: e.target.value })
            }
          />
          <select
            className="border p-2 rounded"
            value={createForm.priority}
            onChange={(e) =>
              setCreateForm({ ...createForm, priority: e.target.value })
            }
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
          <select
            className="border p-2 rounded"
            value={createForm.relatedType}
            onChange={(e) => setRelatedType(e.target.value)}
          >
            <option value="Van">Van</option>
            <option value="Equipment">Equipment</option>
          </select>
          <div className="relative">
            <input
              className={`border p-2 rounded w-full ${
                !createForm.relatedId ? "border-red-400" : ""
              }`}
              placeholder={`Type to search ${createForm.relatedType.toLowerCase()}`}
              value={assetQuery}
              onChange={(e) => {
                setAssetQuery(e.target.value);
                setCreateForm((prev) => ({ ...prev, relatedId: "" }));
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded border bg-white shadow">
                {filteredSuggestions.map((asset) => {
                  const label =
                    createForm.relatedType === "Van"
                      ? asset.vanId || asset.vin || asset._id
                      : asset.serialNumber || asset.type || asset._id;
                  return (
                    <button
                      type="button"
                      key={asset._id}
                      className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                      onMouseDown={() => pickAsset(asset)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            {!createForm.relatedId &&
              assetQuery &&
              filteredSuggestions.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded border bg-white px-3 py-2 text-sm text-gray-600">
                  No matches
                </div>
              )}
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Create
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Asset</th>
                <th className="py-2 px-4 border-b text-left">Description</th>
                <th className="py-2 px-4 border-b text-left">Priority</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Reported</th>
                <th className="py-2 px-4 border-b text-left">Notes</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50 align-top">
                  <td className="py-2 px-4 border-b">
                    <div className="font-semibold">{record.relatedType}</div>
                    <div className="text-sm text-gray-600">
                      {assetLabel(record)}
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b">{record.description}</td>
                  <td className="py-2 px-4 border-b">{record.priority}</td>
                  <td className="py-2 px-4 border-b">
                    <StatusBadge
                      label={record.status}
                      variant={statusVariant(record.status)}
                    />
                  </td>
                  <td className="py-2 px-4 border-b text-sm text-gray-600">
                    {new Date(record.reportedAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b">{renderNotes(record)}</td>
                  <td className="py-2 px-4 border-b space-y-2">
                    <button
                      className="text-blue-600 hover:underline block"
                      onClick={() => setEditing({ ...record })}
                    >
                      Edit / Resolve
                    </button>
                    <button
                      className="text-blue-600 hover:underline block"
                      onClick={() => setNoteTarget(record)}
                    >
                      Add note
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-lg rounded bg-white p-6 shadow">
            <h3 className="text-xl font-semibold mb-4">Update Maintenance</h3>
            <form className="space-y-3" onSubmit={handleUpdate}>
              <textarea
                className="w-full border rounded p-2"
                required
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Priority
                  </label>
                  <select
                    className="border rounded p-2 w-full"
                    value={editing.priority}
                    onChange={(e) =>
                      setEditing({ ...editing, priority: e.target.value })
                    }
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    className="border rounded p-2 w-full"
                    value={editing.status}
                    onChange={(e) =>
                      setEditing({ ...editing, status: e.target.value })
                    }
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Resolution Notes
                </label>
                <textarea
                  className="w-full border rounded p-2"
                  value={editing.resolutionNotes || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, resolutionNotes: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded border"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {noteTarget && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-lg rounded bg-white p-6 shadow">
            <h3 className="text-xl font-semibold mb-4">Add Note</h3>
            <form className="space-y-3" onSubmit={handleAddNote}>
              <textarea
                className="w-full border rounded p-2"
                placeholder="Note"
                required
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded border"
                  onClick={() => setNoteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceLog;
