import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import apiClient from "../lib/apiClient";
import PageShell from "../lib/PageShell";

const ImportMetrics = () => {
  const [data, setData] = useState([]);
  const [unknownEntities, setUnknownEntities] = useState(null);
  const [newEntitiesForm, setNewEntitiesForm] = useState({
    transporters: [],
    vins: [],
  });
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    apiClient
      .get("/api/service-types")
      .then((res) => setServiceTypes(res.data))
      .catch(console.error);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws);

      // Map data
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

      setData(mappedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async (newEntities = null) => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        metrics: data,
        date: selectedDate,
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

        // Initialize form
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
      } else {
        setMessage(`Success! Imported ${res.data.count} records.`);
        setUnknownEntities(null);
        setData([]);
      }
    } catch (err) {
      console.error(err);
      setMessage("Error importing data.");
    } finally {
      setLoading(false);
    }
  };

  const handleEntityChange = (type, index, field, value) => {
    const updated = { ...newEntitiesForm };
    updated[type][index][field] = value;
    setNewEntitiesForm(updated);
  };

  const confirmNewEntities = () => {
    handleImport(newEntitiesForm);
  };

  const cancelImport = () => {
    setUnknownEntities(null);
    setNewEntitiesForm({ transporters: [], vins: [] });
  };

  return (
    <PageShell title="Import Metrics">
      <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel File
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {data.length > 0 && !unknownEntities && (
          <div className="mb-6">
            <p className="mb-2">{data.length} records ready to import.</p>
            <button
              onClick={() => handleImport()}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Importing..." : "Import Data"}
            </button>
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded mb-4 ${
              message.includes("Error")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

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
      </div>
    </PageShell>
  );
};

export default ImportMetrics;
