import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { read, utils } from "xlsx";

const Dispatch = () => {
  const [driverData, setDriverData] = useState([]);
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
    over: true,
    under: true,
    par: true,
  });
  const fileInputRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentNoteDriver, setCurrentNoteDriver] = useState(null);
  const [noteText, setNoteText] = useState("");

  // Rescue Modal State
  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [currentRescuer, setCurrentRescuer] = useState(null);
  const [selectedRescueeId, setSelectedRescueeId] = useState("");
  const [rescueStopCount, setRescueStopCount] = useState("");

  const navigate = useNavigate();

  const openRescueModal = (driver) => {
    setCurrentRescuer(driver);
    setRescueStopCount("");
    setSelectedRescueeId("");
    setIsRescueModalOpen(true);
    setOpenMenuId(null);
  };

  const handleRescue = async () => {
    if (!selectedRescueeId || !rescueStopCount || rescueStopCount <= 0) {
      alert(
        "Please select a driver to rescue and enter a valid number of stops."
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/drivers/rescue",
        {
          rescuerId: currentRescuer._id,
          rescueeId: selectedRescueeId,
          stopCount: rescueStopCount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsRescueModalOpen(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Rescue failed:", err);
      alert("Failed to process rescue.");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/drivers/today", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDriverData(res.data);
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
  }, []);

  const validateData = (processedData) => {
    const newErrors = [];

    // Route code validation
    const keys = Object.keys(processedData[0] || {});
    const routeCodeKey =
      keys.find((k) => k.toLowerCase() === "route code") || "Route Code";

    processedData.forEach((row, index) => {
      const routeCode = row[routeCodeKey];
      if (
        routeCode &&
        typeof routeCode === "string" &&
        routeCode.includes("|")
      ) {
        newErrors.push({
          rowIndex: index,
          field: routeCodeKey,
          driverName: row["Driver name"] || row["Driver Name"] || "Unknown",
        });
      }
    });

    setValidationErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleCorrection = (rowIndex, field, newValue) => {
    const newData = [...pendingData];
    newData[rowIndex][field] = newValue;
    setPendingData(newData);
  };

  const uploadData = async (dataToUpload) => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const localDate = `${year}-${month}-${day}`;

      await axios.post(
        "http://localhost:5000/api/drivers",
        { metrics: dataToUpload, date: localDate },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPendingData([]);
      setValidationErrors([]);
      fetchData();
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

        const keys = Object.keys(jsonData[0] || {});
        const routeCodeKey =
          keys.find((k) => k.toLowerCase() === "route code") || "Route Code";

        // Identify claimed routes (single routes assigned to drivers)
        const claimedRoutes = new Set();
        jsonData.forEach((row) => {
          const routeCode = row[routeCodeKey];
          if (
            routeCode &&
            typeof routeCode === "string" &&
            !routeCode.includes("|")
          ) {
            claimedRoutes.add(routeCode.trim());
          }
        });

        // Process drivers with multiple routes
        const processedData = jsonData.map((row) => {
          const routeCode = row[routeCodeKey];
          if (
            routeCode &&
            typeof routeCode === "string" &&
            routeCode.includes("|")
          ) {
            const codes = routeCode.split("|").map((c) => c.trim());
            // Filter out codes that are claimed by other drivers
            const remainingCodes = codes.filter(
              (code) => !claimedRoutes.has(code)
            );

            if (remainingCodes.length === 0) {
              return { ...row, [routeCodeKey]: "RESCUE" };
            } else {
              return { ...row, [routeCodeKey]: remainingCodes.join("|") };
            }
          }
          return row;
        });

        setPendingData(processedData);

        if (validateData(processedData)) {
          uploadData(processedData);
        }
      } catch (err) {
        setError("Failed to process file.");
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (key === "projectedRTS" || key === "allStops" || key === "timeSummary") {
      const startDirection = "descending";
      if (sortConfig.key !== key) {
        direction = startDirection;
      } else if (sortConfig.direction === "descending") {
        direction = "ascending";
      } else {
        key = "driverName";
        direction = "ascending";
      }
    } else {
      if (sortConfig.key === key && sortConfig.direction === "ascending") {
        direction = "descending";
      } else if (
        sortConfig.key === key &&
        sortConfig.direction === "descending"
      ) {
        key = "driverName";
        direction = "ascending";
      }
    }
    setSortConfig({ key, direction });
  };

  const sortedDriverData = useMemo(() => {
    const filteredData = driverData.filter((driver) => {
      const status = driver.progressStatus;
      let statusMatch = false;
      if (
        filters.behindAtRisk &&
        (status === "BEHIND" || status === "AT_RISK")
      ) {
        statusMatch = true;
      }
      if (filters.onTime && status === "ON_TIME") statusMatch = true;
      if (filters.ahead && (status === "AHEAD" || status === "COMPLETE")) {
        statusMatch = true;
      }
      if (filters.other && (status === "NOT_APPLICABLE" || !status)) {
        statusMatch = true;
      }

      const netMinutes = driver.weeklyNetMinutes || 0;
      let timeMatch = false;
      if (filters.over && netMinutes > 0) timeMatch = true;
      if (filters.under && netMinutes < 0) timeMatch = true;
      if (filters.par && netMinutes === 0) timeMatch = true;

      return statusMatch && timeMatch;
    });

    let sortableItems = [...filteredData];
    if (sortConfig.key) {
      if (sortConfig.key === "timeSummary") {
        const over = sortableItems.filter((d) => (d.weeklyNetMinutes || 0) > 0);
        const under = sortableItems.filter(
          (d) => (d.weeklyNetMinutes || 0) < 0
        );
        const par = sortableItems.filter(
          (d) => (d.weeklyNetMinutes || 0) === 0
        );

        if (sortConfig.direction === "descending") {
          // Overtime Focus: Most Overtime -> Least Overtime, then Least Undertime -> Most Undertime
          over.sort((a, b) => b.weeklyNetMinutes - a.weeklyNetMinutes);
          under.sort((a, b) => b.weeklyNetMinutes - a.weeklyNetMinutes);
          sortableItems = [...over, ...under, ...par];
        } else {
          // Undertime Focus: Most Undertime -> Least Undertime, then Least Overtime -> Most Overtime
          under.sort((a, b) => a.weeklyNetMinutes - b.weeklyNetMinutes);
          over.sort((a, b) => a.weeklyNetMinutes - b.weeklyNetMinutes);
          sortableItems = [...under, ...over, ...par];
        }
      } else {
        sortableItems.sort((a, b) => {
          let aValue = a[sortConfig.key];
          let bValue = b[sortConfig.key];

          if (sortConfig.key === "driverName") {
            aValue = a.driverName || a.driverId?.name || "";
            bValue = b.driverName || b.driverId?.name || "";
          }

          // Custom sort logic
          if (sortConfig.key === "projectedRTS") {
            const parseTime = (timeStr) => {
              if (!timeStr || timeStr === "Missing") return 0;
              const match = timeStr.match(/(\d{1,2}):(\d{2})(am|pm)/i);
              if (!match) return 0;
              let [_, hours, minutes, period] = match;
              hours = parseInt(hours);
              if (period.toLowerCase() === "pm" && hours !== 12) hours += 12;
              if (period.toLowerCase() === "am" && hours === 12) hours = 0;
              return hours * 60 + parseInt(minutes);
            };
            aValue = parseTime(a.projectedRTS);
            bValue = parseTime(b.projectedRTS);
          } else if (sortConfig.key === "stops") {
            aValue = a.allStops > 0 ? a.stopsComplete / a.allStops : 0;
            bValue = b.allStops > 0 ? b.stopsComplete / b.allStops : 0;
          }

          if (aValue < bValue) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        });
      }
    }
    return sortableItems;
  }, [driverData, sortConfig, filters]);

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
      case "NOT_APPLICABLE":
        return "bg-gray-100 border border-gray-200";
      default:
        return "bg-white";
    }
  };

  const formatTimeSummary = (minutes) => {
    if (!minutes) return "0m";
    const absMinutes = Math.abs(minutes);
    const h = Math.floor(absMinutes / 60);
    const m = absMinutes % 60;
    const sign = minutes > 0 ? "+" : "-";
    if (h > 0) return `${sign}${h}h ${m}m`;
    return `${sign}${m}m`;
  };

  const getTimeSummaryColor = (minutes) => {
    if (!minutes || minutes === 0) return "text-gray-900";
    if (minutes > 0) return "text-red-600 font-bold";
    return "text-blue-600 font-bold";
  };

  const handleFilterChange = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllFilters = () => {
    const allChecked = Object.values(filters).every(Boolean);
    const newState = !allChecked;
    setFilters({
      behindAtRisk: newState,
      onTime: newState,
      ahead: newState,
      other: newState,
      over: newState,
      under: newState,
      par: newState,
    });
  };

  const openNoteModal = (driver) => {
    setCurrentNoteDriver(driver);
    setNoteText(driver.note || "");
    setIsNoteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveNote = async () => {
    if (!currentNoteDriver) return;

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/drivers/${currentNoteDriver._id}/note`,
        { note: noteText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setDriverData((prevData) =>
        prevData.map((d) =>
          d._id === currentNoteDriver._id ? { ...d, note: noteText } : d
        )
      );

      setIsNoteModalOpen(false);
      setCurrentNoteDriver(null);
      setNoteText("");
    } catch (err) {
      console.error("Failed to save note", err);
      alert("Failed to save note. Please try again.");
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dispatch - Today's Metrics</h1>
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Update Data
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx"
          className="hidden"
        />
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 p-4 mb-4 border border-red-200 rounded shadow">
          <h3 className="text-lg font-bold text-red-700 mb-2">
            Invalid Data Detected
          </h3>
          <p className="text-sm text-red-600 mb-4">
            Some records have invalid formats (e.g. dates in time fields or
            multiple route codes). Please correct them.
          </p>
          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {validationErrors.map((error, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2 rounded border border-red-100"
              >
                <span className="font-semibold min-w-[150px]">
                  {error.driverName}
                </span>
                <span className="text-gray-500 text-sm min-w-[200px]">
                  {error.field}
                </span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={pendingData[error.rowIndex][error.field]}
                    onChange={(e) =>
                      handleCorrection(
                        error.rowIndex,
                        error.field,
                        e.target.value
                      )
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full focus:border-blue-500 focus:outline-none"
                    placeholder={
                      error.field.toLowerCase().includes("route")
                        ? "e.g. CX53"
                        : "e.g. 7:41pm"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={revalidateAndUpload}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-medium"
          >
            Validate & Upload
          </button>
        </div>
      )}

      {driverData.length > 0 && (
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => requestSort("projectedRTS")}
              className={`px-3 py-1 rounded text-sm font-medium border ${
                sortConfig.key === "projectedRTS"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              Sort by RTS
            </button>
            <button
              onClick={() => requestSort("stops")}
              className={`px-3 py-1 rounded text-sm font-medium border ${
                sortConfig.key === "stops"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              Sort by Progress
            </button>
            <button
              onClick={() => requestSort("allStops")}
              className={`px-3 py-1 rounded text-sm font-medium border ${
                sortConfig.key === "allStops"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              Sort by Stops
            </button>
            <button
              onClick={() => requestSort("avgPace")}
              className={`px-3 py-1 rounded text-sm font-medium border ${
                sortConfig.key === "avgPace"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              Sort by Pace
            </button>
            <button
              onClick={() => requestSort("timeSummary")}
              className={`px-3 py-1 rounded text-sm font-medium border ${
                sortConfig.key === "timeSummary"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              Sort by Time Summary
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-2 rounded border">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Object.values(filters).every(Boolean)}
                onChange={toggleAllFilters}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-sm font-medium">All</span>
            </label>
            <div className="h-4 w-px bg-gray-300 mx-2"></div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.behindAtRisk}
                onChange={() => handleFilterChange("behindAtRisk")}
                className="form-checkbox h-4 w-4 text-red-600"
              />
              <span className="text-sm">BEHIND/AT_RISK</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onTime}
                onChange={() => handleFilterChange("onTime")}
                className="form-checkbox h-4 w-4 text-yellow-600"
              />
              <span className="text-sm">ON_TIME</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.ahead}
                onChange={() => handleFilterChange("ahead")}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-sm">AHEAD</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.ahead}
                onChange={() => handleFilterChange("ahead")}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-sm">AHEAD</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.other}
                onChange={() => handleFilterChange("other")}
                className="form-checkbox h-4 w-4 text-gray-600"
              />
              <span className="text-sm">Other</span>
            </label>

            <div className="h-4 w-px bg-gray-300 mx-2"></div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.over}
                onChange={() => handleFilterChange("over")}
                className="form-checkbox h-4 w-4 text-red-600"
              />
              <span className="text-sm">Over</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.under}
                onChange={() => handleFilterChange("under")}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-sm">Under</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.par}
                onChange={() => handleFilterChange("par")}
                className="form-checkbox h-4 w-4 text-gray-600"
              />
              <span className="text-sm">Par</span>
            </label>
          </div>
        </div>
      )}

      {driverData.length === 0 ? (
        <div className="bg-white p-6 rounded shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4">
            No Driver Data for Today
          </h2>
          <p className="text-gray-600 mb-4">
            Please import the .xlsx file to see today's dispatch data.
          </p>
          {/* The main button now handles the import */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedDriverData.map((driver) => (
            <div
              key={driver.transporterId}
              className={`p-4 rounded shadow ${getStatusColor(
                driver.progressStatus
              )}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h3 className="font-bold text-lg">
                    {driver.driverName || driver.driverId?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {driver.routeCode} / {driver.vanId?.vin || driver.vin}
                  </p>
                  <p className="text-sm">Avg Pace: {driver.avgPace}</p>
                  <p className="text-sm">
                    Projected RTS: {driver.projectedRTS}
                  </p>
                  <p className="text-sm">
                    Stops: {driver.stopsComplete} /{" "}
                    {driver.originalStops ||
                      driver.allStops -
                        (driver.rescueStops || 0) +
                        (driver.rescuedStops || 0)}
                    {(driver.rescueStops > 0 || driver.rescuedStops > 0) && (
                      <>
                        <span className="text-gray-700 ml-1">|</span>
                        <span
                          className={`text-xs font-semibold ml-1 ${
                            driver.rescueStops > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {driver.rescueStops > 0
                            ? `+${driver.rescueStops}`
                            : `-${driver.rescuedStops}`}{" "}
                          ({driver.allStops})
                        </span>
                      </>
                    )}
                  </p>
                  <p
                    className={`text-sm ${getTimeSummaryColor(
                      driver.weeklyNetMinutes
                    )}`}
                  >
                    Time Summary: {formatTimeSummary(driver.weeklyNetMinutes)}
                  </p>
                  {driver.note && (
                    <p className="text-sm text-gray-600 mt-1 italic border-t pt-1">
                      Note: {driver.note}
                    </p>
                  )}
                </div>
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === driver.transporterId
                          ? null
                          : driver.transporterId
                      )
                    }
                    className="p-1 rounded-full hover:bg-gray-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  {openMenuId === driver.transporterId && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate("/history", {
                              state: { selectedDriver: driver },
                            });
                          }}
                          className="text-left w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          History
                        </button>
                        <button
                          onClick={() => openNoteModal(driver)}
                          className="text-left w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Add Note
                        </button>
                        <button
                          onClick={() => openRescueModal(driver)}
                          className="text-left w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Rescue
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isNoteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              Note for{" "}
              {currentNoteDriver?.driverName ||
                currentNoteDriver?.driverId?.name}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full h-24 resize-none focus:border-blue-500 focus:outline-none"
              placeholder="Enter your note here..."
            ></textarea>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">
              Add Note for{" "}
              {currentNoteDriver?.driverName ||
                currentNoteDriver?.driverId?.name}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mb-4 h-32 focus:outline-none focus:border-blue-500"
              placeholder="Enter note here..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isRescueModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">
              Assign Rescue for{" "}
              {currentRescuer?.driverName || currentRescuer?.driverId?.name}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Driver to Rescue (Giver)
              </label>
              <select
                value={selectedRescueeId}
                onChange={(e) => setSelectedRescueeId(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select Driver --</option>
                {driverData
                  .filter((d) => d._id !== currentRescuer?._id)
                  .sort((a, b) =>
                    (a.driverName || "").localeCompare(b.driverName || "")
                  )
                  .map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.driverName || d.driverId?.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Stops
              </label>
              <input
                type="number"
                value={rescueStopCount}
                onChange={(e) => setRescueStopCount(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
                placeholder="e.g. 20"
                min="1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsRescueModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRescue}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm Rescue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dispatch;
