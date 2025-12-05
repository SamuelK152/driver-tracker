import { useState } from "react";
import * as XLSX from "xlsx";
import apiClient from "../lib/apiClient";
import {
  collectClaimedRoutes,
  normalizeRouteCode,
  validateRouteCodes,
} from "@shared/routeCodes";
import { findInvalidTimeFields } from "@shared/time";

const DISPLAY_FIELDS = [
  "Transporter Id",
  "Driver name",
  "Route code",
  "Projected Return to Station",
  "Delivery Service Type",
  "cortex_vin_number",
  "All stops",
  "Stops complete",
  "not started stops",
  "total packages",
  "cortex_avg_pace_stops_per_hour",
  "App sign in:",
  "App sign out:",
  "cortex_last_stop_execution_time",
  "cortex_total_break_time_used",
];

const ImportMetrics = () => {
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  // Initialize with local date instead of UTC to avoid "tomorrow" appearing late at night
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const validateData = (processedData) => {
    const timeErrors = findInvalidTimeFields(processedData, [
      "App sign out:",
      "cortex_last_stop_execution_time",
    ]);
    const routeErrors = validateRouteCodes(processedData);
    const newErrors = [...timeErrors, ...routeErrors];
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleCorrection = (rowIndex, field, newValue) => {
    const newData = [...data];
    newData[rowIndex][field] = newValue;
    setData(newData);
  };

  const revalidate = () => {
    validateData(data);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws);

      const claimedRoutes = collectClaimedRoutes(jsonData, "Route code");

      const processedData = jsonData.map((row) => {
        const updatedRoute = normalizeRouteCode(
          row["Route code"],
          claimedRoutes
        );
        return updatedRoute ? { ...row, "Route code": updatedRoute } : row;
      });

      setData(processedData);
      validateData(processedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    try {
      const res = await apiClient.post("/api/drivers", {
        metrics: data,
        date: selectedDate,
      });

      const saved = res.data.count || 0;
      const skipped = res.data.skipped || 0;
      const total = saved + skipped;

      alert(`Updated ${saved}/${total} Drivers`);
      setData([]);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Error saving data";
      console.error("Save Error:", error);
      alert(message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Dashboard - Import Driver Metrics
      </h1>
      <div className="mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload File
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="border p-2 rounded"
          />
        </div>
        {data.length > 0 && errors.length === 0 && (
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 h-[42px]"
          >
            Save to Database
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 p-4 mb-4 border border-red-200 rounded shadow">
          <h3 className="text-lg font-bold text-red-700 mb-2">
            Invalid Data Detected
          </h3>
          <p className="text-sm text-red-600 mb-4">
            Some records have invalid formats (e.g. dates in time fields or
            multiple route codes). Please correct them.
          </p>
          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {errors.map((error, i) => (
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
                    value={data[error.rowIndex][error.field]}
                    onChange={(e) =>
                      handleCorrection(
                        error.rowIndex,
                        error.field,
                        e.target.value
                      )
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full focus:border-blue-500 focus:outline-none"
                    placeholder={
                      error.field === "Route code" ? "e.g. CX53" : "e.g. 7:41pm"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={revalidate}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-medium"
          >
            Validate & Fix
          </button>
        </div>
      )}

      {data.length > 0 && (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200">
              <tr>
                {DISPLAY_FIELDS.map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index}>
                  {DISPLAY_FIELDS.map((key) => (
                    <td
                      key={key}
                      className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                    >
                      {row[key] !== undefined ? row[key] : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ImportMetrics;
