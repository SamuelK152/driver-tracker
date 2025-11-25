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
  const fileInputRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();

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
    if (key === "projectedRTS" || key === "allStops") {
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
    let sortableItems = [...driverData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

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
    return sortableItems;
  }, [driverData, sortConfig]);

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
        <div className="mb-4 flex flex-wrap gap-2">
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
              sortConfig.key === "stops" ? "bg-blue-500 text-white" : "bg-white"
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
                  <h3 className="font-bold text-lg">{driver.driverName}</h3>
                  <p className="text-sm text-gray-500">
                    {driver.routeCode} / {driver.vin}
                  </p>
                  <p className="text-sm">Avg Pace: {driver.avgPace}</p>
                  <p className="text-sm">
                    Projected RTS: {driver.projectedRTS}
                  </p>
                  <p className="text-sm">
                    Stops: {driver.stopsComplete} / {driver.allStops}
                  </p>
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dispatch;
