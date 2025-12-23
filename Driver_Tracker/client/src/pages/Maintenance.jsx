import React, { useEffect, useState } from "react";
import apiClient from "../lib/apiClient";
import DetailedView from "../components/DetailedView";
import StatusBadge from "../lib/StatusBadge";

const statusVariant = (status) => {
  if (status === "Resolved") return "success";
  if (status === "In Progress") return "warning";
  return "danger";
};

const Maintenance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vans, setVans] = useState([]);
  const [equipment, setEquipment] = useState([]);

  // UI State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Action State
  const [editing, setEditing] = useState(null);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteBody, setNoteBody] = useState("");

  // Form State
  const [createForm, setCreateForm] = useState({
    description: "",
    priority: "Medium",
    relatedType: "Van",
    relatedId: "",
  });
  const [assetQuery, setAssetQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchRecords();
    fetchAssets();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/maintenance");
      setRecords(res.data);
      // Update selected record if it exists to show latest data
      if (selectedRecord) {
        const updated = res.data.find((r) => r._id === selectedRecord._id);
        if (updated) setSelectedRecord(updated);
      }
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

  const getAssetName = (record) => {
    if (record.onModel === "Van" || record.relatedType === "Van") {
      const van = vans.find(
        (v) => v._id === record.relatedAsset || v._id === record.relatedId
      );
      return van ? van.vanId || van.vin : "Unknown Van";
    }
    if (record.onModel === "Equipment" || record.relatedType === "Equipment") {
      const eq = equipment.find(
        (e) => e._id === record.relatedAsset || e._id === record.relatedId
      );
      return eq ? eq.serialNumber || eq.type : "Unknown Equipment";
    }
    return "Unknown Asset";
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.relatedId) {
      alert("Select a related asset from suggestions");
      return;
    }
    try {
      const payload = {
        ...createForm,
        onModel: createForm.relatedType,
        relatedAsset: createForm.relatedId,
      };

      await apiClient.post("/api/maintenance", payload);
      setCreateForm({
        description: "",
        priority: "Medium",
        relatedType: "Van",
        relatedId: "",
      });
      setAssetQuery("");
      setIsModalOpen(false);
      fetchRecords();
    } catch (error) {
      console.error("Error creating maintenance", error);
      alert("Error creating maintenance record");
    }
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

  const filteredRecords = records.filter((record) => {
    const matchesType =
      filterType === "All" ||
      (record.onModel || record.relatedType) === filterType;
    const matchesStatus =
      filterStatus === "All" || record.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const openRecordsCount = records.filter(
    (r) => r.status !== "Resolved"
  ).length;

  const renderHeader = () => (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Add Issue
      </button>
    </div>
  );

  const renderSummary = () => {
    if (selectedRecord) {
      return (
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {getAssetName(selectedRecord)}
              </h2>
              <p className="text-sm text-gray-500">
                Reported on{" "}
                {new Date(
                  selectedRecord.reportedAt || selectedRecord.createdAt
                ).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setNoteTarget(selectedRecord)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Add Note
              </button>
              <button
                onClick={() => setEditing(selectedRecord)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => setEditing(selectedRecord)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Resolve
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-500 block">Status</span>
              <StatusBadge
                label={selectedRecord.status}
                variant={statusVariant(selectedRecord.status)}
              />
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Priority</span>
              <span
                className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                  selectedRecord.priority === "High" ||
                  selectedRecord.priority === "Critical"
                    ? "bg-red-100 text-red-800"
                    : selectedRecord.priority === "Medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {selectedRecord.priority}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-1">Description</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded border">
              {selectedRecord.description}
            </p>
          </div>

          {selectedRecord.notes && selectedRecord.notes.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Notes</h3>
              <ul className="space-y-2">
                {selectedRecord.notes.map((note, idx) => (
                  <li key={idx} className="text-sm text-gray-600 border-b pb-2">
                    <div className="flex justify-between">
                      <span>{note.body}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full py-6">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {openRecordsCount}
        </div>
        <div className="text-gray-500 font-medium">
          Open Maintenance Reports
        </div>
      </div>
    );
  };

  const renderLeftPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex space-x-2 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
        >
          <option value="All">All Types</option>
          <option value="Van">Vans</option>
          <option value="Equipment">Equipment</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredRecords.map((record) => (
          <div
            key={record._id}
            onClick={() => setSelectedRecord(record)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedRecord?._id === record._id
                ? "bg-blue-50 border-blue-500"
                : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-gray-900">
                {getAssetName(record)}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  record.priority === "High" || record.priority === "Critical"
                    ? "bg-red-100 text-red-800"
                    : record.priority === "Medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {record.priority}
              </span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">
              {record.description}
            </p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {record.onModel || record.relatedType}
              </span>
              <StatusBadge
                label={record.status}
                variant={statusVariant(record.status)}
              />
            </div>
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center text-gray-500 py-4">No records found</div>
        )}
      </div>
    </div>
  );

  const renderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Maintenance Issue</h2>
        <form onSubmit={handleCreate}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={createForm.relatedType === "Van"}
                  onChange={() => {
                    setCreateForm((prev) => ({
                      ...prev,
                      relatedType: "Van",
                      relatedId: "",
                    }));
                    setAssetQuery("");
                  }}
                  className="mr-2"
                />
                Van
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={createForm.relatedType === "Equipment"}
                  onChange={() => {
                    setCreateForm((prev) => ({
                      ...prev,
                      relatedType: "Equipment",
                      relatedId: "",
                    }));
                    setAssetQuery("");
                  }}
                  className="mr-2"
                />
                Equipment
              </label>
            </div>
          </div>

          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset
            </label>
            <input
              type="text"
              value={assetQuery}
              onChange={(e) => {
                setAssetQuery(e.target.value);
                setShowSuggestions(true);
                setCreateForm((prev) => ({ ...prev, relatedId: "" }));
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={`Search ${createForm.relatedType}...`}
              className="w-full border rounded p-2"
            />
            {showSuggestions && assetQuery && (
              <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto mt-1">
                {(createForm.relatedType === "Van" ? vans : equipment)
                  .filter((item) => {
                    const search = assetQuery.toLowerCase();
                    const val =
                      createForm.relatedType === "Van"
                        ? item.vanId || item.vin
                        : item.serialNumber || item.type;
                    return val && val.toLowerCase().includes(search);
                  })
                  .map((item) => (
                    <div
                      key={item._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setCreateForm((prev) => ({
                          ...prev,
                          relatedId: item._id,
                        }));
                        setAssetQuery(
                          createForm.relatedType === "Van"
                            ? item.vanId || item.vin
                            : item.serialNumber || item.type
                        );
                        setShowSuggestions(false);
                      }}
                    >
                      {createForm.relatedType === "Van"
                        ? item.vanId || item.vin
                        : item.serialNumber || item.type}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={createForm.priority}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, priority: e.target.value }))
              }
              className="w-full border rounded p-2"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full border rounded p-2 h-24"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderEditModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
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
              <label className="block text-sm font-medium mb-1">Priority</label>
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
              <label className="block text-sm font-medium mb-1">Status</label>
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
  );

  const renderNoteModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
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
  );

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <>
      <DetailedView
        children={renderHeader()}
        summary={renderSummary()}
        leftPanel={renderLeftPanel()}
        rightPanel={null}
      />
      {isModalOpen && renderModal()}
      {editing && renderEditModal()}
      {noteTarget && renderNoteModal()}
    </>
  );
};

export default Maintenance;
