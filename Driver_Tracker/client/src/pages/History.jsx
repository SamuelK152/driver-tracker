import { useState, useEffect } from "react";
import axios from "axios";

const History = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/drivers/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedDrivers = res.data.sort((a, b) => 
        a.driverName.localeCompare(b.driverName)
      );
      setDrivers(sortedDrivers);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDriverClick = async (driver) => {
    setSelectedDriver(driver);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/drivers/${driver.transporterId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistory(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 flex gap-4">
      <div className="w-1/3 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Drivers</h2>
        <ul>
          {drivers.map((driver) => (
            <li
              key={driver.transporterId}
              onClick={() => handleDriverClick(driver)}
              className={`p-2 cursor-pointer hover:bg-gray-100 ${
                selectedDriver?.transporterId === driver.transporterId
                  ? "bg-blue-50"
                  : ""
              }`}
            >
              <div className="font-semibold">{driver.driverName}</div>
              <div className="text-sm text-gray-500">
                {driver.transporterId}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-2/3 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">
          {selectedDriver
            ? `History for ${selectedDriver.driverName}`
            : "Select a driver to view history"}
        </h2>

        {selectedDriver && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Route</th>
                  <th className="px-4 py-2">Stops</th>
                  <th className="px-4 py-2">Packages</th>
                  <th className="px-4 py-2">Pace</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record._id} className="border-b">
                    <td className="px-4 py-2">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{record.routeCode}</td>
                    <td className="px-4 py-2">
                      {record.stopsComplete}/{record.allStops}
                    </td>
                    <td className="px-4 py-2">{record.totalPackages}</td>
                    <td className="px-4 py-2">{record.avgPace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
