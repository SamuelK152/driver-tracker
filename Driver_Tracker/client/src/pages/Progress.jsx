import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { read, utils } from "xlsx";
import apiClient from "../lib/apiClient";
import PageShell from "../lib/PageShell";
import {
  collectClaimedRoutes,
  normalizeRouteCode,
  validateRouteCodes,
} from "@shared/routeCodes";

const Progress = () => {
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "driverName",
    direction: "ascending",
  });
  const [filters, setFilters] = useState({
    behindAtRisk: true,
    onTime: true,
    ahead: true,
    other: true,
  });
  const fileInputRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentNoteRoute, setCurrentNoteRoute] = useState(null);
  const [noteText, setNoteText] = useState("");

  // Rescue Modal State
  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [currentRescuer, setCurrentRescuer] = useState(null);
  const [selectedRescueeId, setSelectedRescueeId] = useState("");
  const [rescueStopCount, setRescueStopCount] = useState("");

  // Import/Unknown Entities State
  const [unknownEntities, setUnknownEntities] = useState(null);
  const [newEntitiesForm, setNewEntitiesForm] = useState({
    transporters: [],
    vins: [],
  });
  const [serviceTypes, setServiceTypes] = useState([]);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use local date to ensure we fetch data for the current day in user's timezone
      const date = new Date();
      const offset = date.getTimezoneOffset();
      const today = new Date(date.getTime() - offset * 60000)
        .toISOString()
        .split("T")[0];

      const [routesRes, metricsRes] = await Promise.all([
        apiClient.get(`/api/routes?date=${today}`),
        apiClient.get(`/api/metrics?startDate=${today}&endDate=${today}`),
      ]);

      const routes = routesRes.data;
      const metrics = metricsRes.data;

      // Merge Data
      const merged = routes.map((route) => {
        // Robust ID comparison (handles populated objects vs strings)
        const metric = metrics.find(
          (m) => String(m.routeId?._id || m.routeId) === String(route._id)
        );

        // Calculate rescue stats
        const rescueStops =
          metric?.rescueLog
            ?.filter((l) => l.type === "GAVE")
            .reduce((a, b) => a + b.count, 0) || 0;
        const rescuedStops =
          metric?.rescueLog
            ?.filter((l) => l.type === "RECEIVED")
            .reduce((a, b) => a + b.count, 0) || 0;

        return {
          _id: route.driverId?._id, // Driver ID for actions
          routeId: route._id, // Route ID for notes
          transporterId: route.driverId?.transporterId,
          driverName: route.driverId?.name || "Unassigned",
          routeCode: route.routeCode,
          vin: route.vanId?.vin || "No Van",
          progressStatus: metric?.progressStatus || "NOT_APPLICABLE",
          projectedRTS: route.projectedRTS
            ? new Date(route.projectedRTS).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A",
          allStops: metric?.allStops || 0,
          stopsComplete: metric?.stopsComplete || 0,
          avgPace: metric?.avgPace || 0,
          note: route.notes,
          rescueStops,
          rescuedStops,
        };
      });

      setDisplayData(merged);
      setError(null);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    apiClient
      .get("/api/service-types")
      .then((res) => setServiceTypes(res.data))
      .catch(console.error);
  }, []);

  const handleRescue = async () => {
    if (!selectedRescueeId || !rescueStopCount || rescueStopCount <= 0) {
      alert(
        "Please select a driver to rescue and enter a valid number of stops."
      );
      return;
    }

    try {
      await apiClient.post("/api/metrics/rescue", {
        rescuerId: currentRescuer._id,
        rescueeId: selectedRescueeId,
        stopCount: rescueStopCount,
      });
      setIsRescueModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Rescue failed:", err);
      alert("Failed to process rescue.");
    }
  };

  const validateData = (processedData) => {
    // Basic validation if needed, but we rely on backend for entity validation now
    return true;
  };

  const handleCorrection = (rowIndex, field, newValue) => {
    const newData = [...pendingData];
    newData[rowIndex][field] = newValue;
    setPendingData(newData);
  };

  const uploadData = async (dataToUpload, newEntities = null) => {
    try {
      // Use local date for upload as well
      const date = new Date();
      const offset = date.getTimezoneOffset();
      const today = new Date(date.getTime() - offset * 60000)
        .toISOString()
        .split("T")[0];

      const payload = {
        metrics: dataToUpload,
        date: today,
      };
      if (newEntities) {
        payload.newEntities = newEntities;
      }

      const res = await apiClient.post("/api/metrics/import", payload);

      if (res.data.status === "unknown_entities") {
        setUnknownEntities({
          transporters: res.data.unknownTransporters,
          vins: res.data.unknownVins,
        });
        setNewEntitiesForm({
          transporters: res.data.unknownTransporters.map((t) => ({
            transporterId: t.transporterId,
            name: t.name || "",
          })),
          vins: res.data.unknownVins.map((vin) => ({
            vin: vin,
            name: "",
            serviceType: "",
          })),
        });
        // Keep pending data
      } else {
        setPendingData([]);
        setValidationErrors([]);
        setUnknownEntities(null);
        fetchData();
      }
    } catch (err) {
      setError("Failed to upload data.");
      console.error(err);
    }
  };

  const revalidateAndUpload = () => {
    if (validateData(pendingData)) {
      uploadData(pendingData);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const wb = read(event.target.result, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = utils.sheet_to_json(ws);

        if (jsonData.length === 0) {
          setError("File is empty");
          return;
        }

        // Map data using user's mapping
        const mappedData = jsonData.map((row) => ({
          transporterId: row["Transporter Id"],
          driverName: row["Driver name"],
          status: row["Progress Status"],
          routeCode: row["Route code"],
          projectedRTS: row["Projected Return to Station"],
          vin: row["cortex_vin_number"],
          allStops: row["All Stops"],
          stopsComplete: row["Stops complete"],
          totalPackages: row["total packages"],
          avgPace: row["cortex_avg_pace_stops_per_hour"],
          breakTimeUsed: row["cortex_total_break_time_used"],
          signOut: row["App sign out:"],
        }));

        setPendingData(mappedData);
        uploadData(mappedData);
      } catch (err) {
        setError("Failed to process file.");
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleEntityChange = (type, index, field, value) => {
    const updated = { ...newEntitiesForm };
    updated[type][index][field] = value;
    setNewEntitiesForm(updated);
  };

  const confirmNewEntities = () => {
    uploadData(pendingData, newEntitiesForm);
  };

  const cancelImport = () => {
    setUnknownEntities(null);
    setPendingData([]);
    setNewEntitiesForm({ transporters: [], vins: [] });
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const filtered = displayData.filter((d) => {
      const status = d.progressStatus;
      if (filters.behindAtRisk && (status === "BEHIND" || status === "AT_RISK"))
        return true;
      if (filters.onTime && status === "ON_TIME") return true;
      if (filters.ahead && (status === "AHEAD" || status === "COMPLETE"))
        return true;
      if (filters.other && (status === "NOT_APPLICABLE" || !status))
        return true;
      return false;
    });

    return filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [displayData, sortConfig, filters]);

  const getStatusColor = (status) => {
    switch (status) {
      case "BEHIND":
        return "bg-red-100 border border-red-200";
      case "AT_RISK":
        return "bg-orange-100 border border-orange-200";
      case "ON_TIME":
        return "bg-yellow-100 border border-yellow-200";
      case "AHEAD":
        return "bg-blue-100 border border-blue-200";
      case "COMPLETE":
        return "bg-green-100 border border-green-200";
      default:
        return "bg-white";
    }
  };

  const handleFilterChange = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openNoteModal = (item) => {
    setCurrentNoteRoute(item);
    setNoteText(item.note || "");
    setIsNoteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveNote = async () => {
    if (!currentNoteRoute) return;
    try {
      await apiClient.put(`/api/routes/${currentNoteRoute.routeId}`, {
        notes: noteText,
      });
      setIsNoteModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save note", err);
      alert("Failed to save note.");
    }
  };

  const openRescueModal = (item) => {
    setCurrentRescuer(item);
    setRescueStopCount("");
    setSelectedRescueeId("");
    setIsRescueModalOpen(true);
    setOpenMenuId(null);
  };

  return (
    <PageShell title="Dispatch - Today's Metrics">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            {/* Filters */}
            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1 rounded border">
              <input
                type="checkbox"
                checked={filters.behindAtRisk}
                onChange={() => handleFilterChange("behindAtRisk")}
                className="text-red-600"
              />
              <span className="text-sm">Behind/Risk</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1 rounded border">
              <input
                type="checkbox"
                checked={filters.onTime}
                onChange={() => handleFilterChange("onTime")}
                className="text-yellow-600"
              />
              <span className="text-sm">On Time</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1 rounded border">
              <input
                type="checkbox"
                checked={filters.ahead}
                onChange={() => handleFilterChange("ahead")}
                className="text-blue-600"
              />
              <span className="text-sm">Ahead</span>
            </label>
          </div>

          <div>
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Update Data (Excel)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx"
              className="hidden"
            />
          </div>
        </div>

        {/* Unknown Entities Modal */}
        {unknownEntities && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-red-600">
                Unknown Entities Detected
              </h3>
              <p className="mb-4">
                The following entities are not in the database. Do you want to
                add them to the fleet?
              </p>

              {unknownEntities.transporters.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold mb-2">New Employees</h4>
                  {newEntitiesForm.transporters.map((t, i) => (
                    <div
                      key={t.transporterId}
                      className="flex gap-2 mb-2 items-center"
                    >
                      <span className="w-32 text-sm font-mono">
                        {t.transporterId}
                      </span>
                      <input
                        placeholder="Name"
                        value={t.name}
                        onChange={(e) =>
                          handleEntityChange(
                            "transporters",
                            i,
                            "name",
                            e.target.value
                          )
                        }
                        className="border rounded p-1 flex-grow"
                      />
                    </div>
                  ))}
                </div>
              )}

              {unknownEntities.vins.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold mb-2">New Vans</h4>
                  {newEntitiesForm.vins.map((v, i) => (
                    <div
                      key={v.vin}
                      className="flex gap-2 mb-2 items-center flex-wrap"
                    >
                      <span className="w-48 text-sm font-mono">{v.vin}</span>
                      <input
                        placeholder="Van Name/ID"
                        value={v.name}
                        onChange={(e) =>
                          handleEntityChange("vins", i, "name", e.target.value)
                        }
                        className="border rounded p-1 w-32"
                      />
                      <select
                        value={v.serviceType}
                        onChange={(e) =>
                          handleEntityChange(
                            "vins",
                            i,
                            "serviceType",
                            e.target.value
                          )
                        }
                        className="border rounded p-1 w-40"
                      >
                        <option value="">Select Type</option>
                        {serviceTypes.map((st) => (
                          <option key={st._id} value={st._id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={cancelImport}
                  className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                >
                  No, Cancel Import
                </button>
                <button
                  onClick={confirmNewEntities}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Yes, Add & Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedData.map((item) => (
            <div
              key={item.routeId}
              className={`p-4 rounded shadow ${getStatusColor(
                item.progressStatus
              )}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h3 className="font-bold text-lg">{item.driverName}</h3>
                  <p className="text-sm text-gray-500">
                    {item.routeCode} / {item.vin}
                  </p>
                  <p className="text-sm">Pace: {item.avgPace}</p>
                  <p className="text-sm">RTS: {item.projectedRTS}</p>
                  <p className="text-sm">
                    Stops: {item.stopsComplete} / {item.allStops}
                    {(item.rescueStops > 0 || item.rescuedStops > 0) && (
                      <span className="ml-2 font-bold">
                        {item.rescueStops > 0
                          ? `+${item.rescueStops}`
                          : `-${item.rescuedStops}`}
                      </span>
                    )}
                  </p>
                  {item.note && (
                    <p className="text-sm text-gray-600 mt-1 italic border-t pt-1">
                      {item.note}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === item.routeId ? null : item.routeId
                      )
                    }
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    ...
                  </button>
                  {openMenuId === item.routeId && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-10 py-1">
                      <button
                        onClick={() => openNoteModal(item)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Add Note
                      </button>
                      <button
                        onClick={() => openRescueModal(item)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Rescue
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note Modal */}
        {isNoteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h3 className="text-lg font-bold mb-4">
                Note for {currentNoteRoute?.driverName}
              </h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full border rounded p-2 h-32 mb-4"
                placeholder="Enter note..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rescue Modal */}
        {isRescueModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h3 className="text-lg font-bold mb-4">
                Rescue for {currentRescuer?.driverName}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Select Driver to Rescue
                </label>
                <select
                  value={selectedRescueeId}
                  onChange={(e) => setSelectedRescueeId(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">-- Select Driver --</option>
                  {displayData
                    .filter((d) => d._id !== currentRescuer?._id)
                    .map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.driverName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Stops</label>
                <input
                  type="number"
                  value={rescueStopCount}
                  onChange={(e) => setRescueStopCount(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsRescueModalOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescue}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Progress;
