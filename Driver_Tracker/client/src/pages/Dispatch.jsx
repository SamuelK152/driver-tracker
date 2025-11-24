import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { read, utils } from "xlsx";

const Dispatch = () => {
  const [driverData, setDriverData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "driverName",
    direction: "ascending",
  });
  const fileInputRef = useRef(null);

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const wb = read(event.target.result, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = utils.sheet_to_json(ws);

        // Send to backend
        const token = localStorage.getItem("token");
        await axios.post(
          "http://localhost:5000/api/drivers",
          { metrics: data, date: new Date().toISOString().split("T")[0] },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Refresh data
        fetchData();
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
              <h3 className="font-bold text-lg">{driver.driverName}</h3>
              <p className="text-sm text-gray-500">
                {driver.routeCode} / {driver.vin}
              </p>
              <p className="text-sm">Avg Pace: {driver.avgPace}</p>
              <p className="text-sm">Projected RTS: {driver.projectedRTS}</p>
              <p className="text-sm">
                Stops: {driver.stopsComplete} / {driver.allStops}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dispatch;
