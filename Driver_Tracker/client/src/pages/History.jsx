import { useState, useEffect } from "react";
import axios from "axios";

const History = () => {
  const [viewMode, setViewMode] = useState("drivers"); // 'drivers', 'routes', 'dates'
  const [listData, setListData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [timeRange, setTimeRange] = useState("week");
  const [currentPeriodStart, setCurrentPeriodStart] = useState(null);

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const start = new Date(d);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getStartOfMonth = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };

  useEffect(() => {
    if (currentPeriodStart) {
      if (timeRange === "week") {
        setCurrentPeriodStart(getStartOfWeek(currentPeriodStart));
      } else if (timeRange === "month") {
        setCurrentPeriodStart(getStartOfMonth(currentPeriodStart));
      }
    }
  }, [timeRange]);

  useEffect(() => {
    setListData([]); // Clear list data to avoid type mismatches during view switch
    fetchListData();
    setSelectedItem(null);
    setHistory([]);
  }, [viewMode]);

  const fetchListData = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = "http://localhost:5000/api/drivers/list";
      if (viewMode === "routes")
        url = "http://localhost:5000/api/drivers/routes";
      if (viewMode === "dates") url = "http://localhost:5000/api/drivers/dates";

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = res.data;
      if (viewMode === "drivers") {
        data = data.sort((a, b) => a.driverName.localeCompare(b.driverName));
      }
      setListData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    try {
      const token = localStorage.getItem("token");
      let url = "";
      if (viewMode === "drivers")
        url = `http://localhost:5000/api/drivers/${encodeURIComponent(
          item.transporterId
        )}`;
      if (viewMode === "routes")
        url = `http://localhost:5000/api/drivers/route/${encodeURIComponent(
          item
        )}`;
      if (viewMode === "dates")
        url = `http://localhost:5000/api/drivers/date/${encodeURIComponent(
          item
        )}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Process data for Route view to group by date
      if (viewMode === "routes") {
        const grouped = res.data.reduce((acc, curr) => {
          const date = new Date(curr.createdAt).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { ...curr, driverNames: [curr.driverName] };
          } else {
            acc[date].driverNames.push(curr.driverName);
            // Aggregate other metrics if needed, or just take the first one found
            // Assuming route metrics are similar for the route, but stops/packages might differ per driver?
            // The request says "daily metrics for that specific route".
            // Usually a route is assigned to one driver per day, but if split, we might need to sum?
            // For now, let's just list drivers.
          }
          return acc;
        }, {});
        setHistory(
          Object.values(grouped).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );

        // Set initial period for routes
        const dates = Object.values(grouped).map((d) => new Date(d.createdAt));
        if (dates.length > 0) {
          const maxDate = new Date(Math.max.apply(null, dates));
          setCurrentPeriodStart(
            timeRange === "month"
              ? getStartOfMonth(maxDate)
              : getStartOfWeek(maxDate)
          );
        } else {
          setCurrentPeriodStart(
            timeRange === "month"
              ? getStartOfMonth(new Date())
              : getStartOfWeek(new Date())
          );
        }
      } else {
        setHistory(res.data);

        // Set initial period for drivers
        if (viewMode === "drivers" && res.data.length > 0) {
          const dates = res.data.map((d) => new Date(d.createdAt));
          const maxDate = new Date(Math.max.apply(null, dates));
          setCurrentPeriodStart(
            timeRange === "month"
              ? getStartOfMonth(maxDate)
              : getStartOfWeek(maxDate)
          );
        } else if (viewMode === "drivers") {
          setCurrentPeriodStart(
            timeRange === "month"
              ? getStartOfMonth(new Date())
              : getStartOfWeek(new Date())
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderList = () => {
    return (
      <ul>
        {listData.map((item, index) => {
          // Safety check for data type mismatch during view transition
          if (viewMode === "drivers" && typeof item !== "object") return null;
          if (viewMode !== "drivers" && typeof item === "object") return null;

          // Ensure key is a string or number, not an object
          const key = viewMode === "drivers" ? item.transporterId : item;

          // Ensure label is a string
          const label = viewMode === "drivers" ? item.driverName : item;

          const subLabel = viewMode === "drivers" ? item.transporterId : "";

          const isSelected =
            viewMode === "drivers"
              ? selectedItem?.transporterId === item.transporterId
              : selectedItem === item;

          return (
            <li
              key={String(key || index)}
              onClick={() => handleItemClick(item)}
              className={`p-2 cursor-pointer hover:bg-gray-100 ${
                isSelected ? "bg-blue-50" : ""
              }`}
            >
              <div className="font-semibold">{String(label)}</div>
              {subLabel && (
                <div className="text-sm text-gray-500">{subLabel}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderTableHeaders = () => {
    if (viewMode === "drivers") {
      return (
        <tr>
          <th className="px-4 py-2">Date</th>
          <th className="px-4 py-2">Route</th>
          <th className="px-4 py-2">Stops</th>
          <th className="px-4 py-2">Packages</th>
          <th className="px-4 py-2">Pace</th>
          <th className="px-4 py-2">Sign Out</th>
          <th className="px-4 py-2">Target</th>
          <th className="px-4 py-2">Last Stop</th>
          <th className="px-4 py-2">Break Time</th>
        </tr>
      );
    } else if (viewMode === "routes") {
      return (
        <tr>
          <th className="px-4 py-2">Date</th>
          <th className="px-4 py-2">Driver</th>
          <th className="px-4 py-2">Stops</th>
          <th className="px-4 py-2">Packages</th>
          <th className="px-4 py-2">Pace</th>
          <th className="px-4 py-2">Sign Out</th>
          <th className="px-4 py-2">Target</th>
          <th className="px-4 py-2">Last Stop</th>
          <th className="px-4 py-2">Break Time</th>
        </tr>
      );
    } else if (viewMode === "dates") {
      return (
        <tr>
          <th className="px-4 py-2">Driver</th>
          <th className="px-4 py-2">Route</th>
          <th className="px-4 py-2">Stops</th>
          <th className="px-4 py-2">Packages</th>
          <th className="px-4 py-2">Pace</th>
          <th className="px-4 py-2">Sign Out</th>
          <th className="px-4 py-2">Target</th>
          <th className="px-4 py-2">Last Stop</th>
          <th className="px-4 py-2">Break Time</th>
        </tr>
      );
    }
  };

  const renderTableRows = () => {
    const filteredHistory = history.filter((record) => {
      if (viewMode === "dates") return true;
      if (timeRange === "all") return true;
      if (!currentPeriodStart) return true;

      const recordDate = new Date(record.createdAt);

      if (timeRange === "week") {
        const weekEnd = new Date(currentPeriodStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return recordDate >= currentPeriodStart && recordDate <= weekEnd;
      } else if (timeRange === "month") {
        const monthEnd = new Date(currentPeriodStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        return recordDate >= currentPeriodStart && recordDate <= monthEnd;
      }
      return true;
    });

    if (filteredHistory.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="px-4 py-2 text-center text-gray-500">
            No records found for this period.
          </td>
        </tr>
      );
    }

    return filteredHistory.map((record, index) => {
      const date = new Date(record.createdAt).toLocaleDateString();

      if (viewMode === "drivers") {
        return (
          <tr key={record._id} className="border-b">
            <td className="px-4 py-2">{date}</td>
            <td className="px-4 py-2">{record.routeCode}</td>
            <td className="px-4 py-2">
              {record.stopsComplete}/{record.allStops}
            </td>
            <td className="px-4 py-2">{record.totalPackages}</td>
            <td className="px-4 py-2">{record.avgPace}</td>
            <td className="px-4 py-2">{record.signOut}</td>
            <td className="px-4 py-2">
              {calculateTarget(record.signOut)}
            </td>
            <td className="px-4 py-2">{record.lastStopExecution}</td>
            <td className="px-4 py-2">{record.breakTimeUsed}</td>
          </tr>
        );
      } else if (viewMode === "routes") {
        const drivers = record.driverNames
          ? record.driverNames.join(" | ")
          : record.driverName;
        return (
          <tr key={record._id || index} className="border-b">
            <td className="px-4 py-2">{date}</td>
            <td className="px-4 py-2">{drivers}</td>
            <td className="px-4 py-2">
              {record.stopsComplete}/{record.allStops}
            </td>
            <td className="px-4 py-2">{record.totalPackages}</td>
            <td className="px-4 py-2">{record.avgPace}</td>
            <td className="px-4 py-2">{record.signOut}</td>
            <td className="px-4 py-2">
              {calculateTarget(record.signOut)}
            </td>
            <td className="px-4 py-2">{record.lastStopExecution}</td>
            <td className="px-4 py-2">{record.breakTimeUsed}</td>
          </tr>
        );
      } else if (viewMode === "dates") {
        return (
          <tr key={record._id} className="border-b">
            <td className="px-4 py-2">{record.driverName}</td>
            <td className="px-4 py-2">{record.routeCode}</td>
            <td className="px-4 py-2">
              {record.stopsComplete}/{record.allStops}
            </td>
            <td className="px-4 py-2">{record.totalPackages}</td>
            <td className="px-4 py-2">{record.avgPace}</td>
            <td className="px-4 py-2">{record.signOut}</td>
            <td className="px-4 py-2">
              {calculateTarget(record.signOut)}
            </td>
            <td className="px-4 py-2">{record.lastStopExecution}</td>
            <td className="px-4 py-2">{record.breakTimeUsed}</td>
          </tr>
        );
      }
    });
  };

  const getTitle = () => {
    if (!selectedItem) return "Select an item to view history";
    if (viewMode === "drivers") return `History for ${selectedItem.driverName}`;
    if (viewMode === "routes") return `History for ${selectedItem}`;
    if (viewMode === "dates") return `Metrics for ${selectedItem}`;
  };

  const handlePrevPeriod = () => {
    if (!currentPeriodStart) return;
    const newDate = new Date(currentPeriodStart);
    if (timeRange === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (timeRange === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentPeriodStart(newDate);
  };

  const handleNextPeriod = () => {
    if (!currentPeriodStart) return;
    const newDate = new Date(currentPeriodStart);
    if (timeRange === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (timeRange === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentPeriodStart(newDate);
  };

  const calculateTarget = (signOut) => {
    if (!signOut) return "-";

    // Try to parse the time string
    // Supported formats: "HH:MM", "HH:MM:SS", "HH:MM AM/PM"
    const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/;
    const match = signOut.match(timeRegex);

    if (!match) return "-";

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[4] ? match[4].toUpperCase() : null;

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    // Deadline: 20:05 (8:05 PM)
    const deadlineMinutes = 20 * 60 + 5;
    const currentMinutes = hours * 60 + minutes;

    if (currentMinutes > deadlineMinutes) {
      const diff = currentMinutes - deadlineMinutes;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return <span className="text-red-600 font-medium">{`${h}h ${m}m`}</span>;
    } else {
      const diff = deadlineMinutes - currentMinutes;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return <span className="text-blue-600 font-medium">{`${h}h ${m}m`}</span>;
    }
  };

  const getTargetMinutes = (signOut) => {
    if (!signOut) return 0;

    const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/;
    const match = signOut.match(timeRegex);

    if (!match) return 0;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[4] ? match[4].toUpperCase() : null;

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const deadlineMinutes = 20 * 60 + 5;
    const currentMinutes = hours * 60 + minutes;

    // Positive for OT, Negative for Undertime
    return currentMinutes - deadlineMinutes;
  };

  const renderSummary = () => {
    if (!selectedItem) return null;

    const filteredHistory = history.filter((record) => {
      if (viewMode === "dates") return true;
      if (timeRange === "all") return true;
      if (!currentPeriodStart) return true;

      const recordDate = new Date(record.createdAt);

      if (timeRange === "week") {
        const weekEnd = new Date(currentPeriodStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return recordDate >= currentPeriodStart && recordDate <= weekEnd;
      } else if (timeRange === "month") {
        const monthEnd = new Date(currentPeriodStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        return recordDate >= currentPeriodStart && recordDate <= monthEnd;
      }
      return true;
    });

    if (filteredHistory.length === 0) return null;

    const totalStops = filteredHistory.reduce(
      (sum, r) => sum + (r.stopsComplete || 0),
      0
    );
    const totalPackages = filteredHistory.reduce(
      (sum, r) => sum + (r.totalPackages || 0),
      0
    );
    const avgPace =
      filteredHistory.length > 0
        ? (
            filteredHistory.reduce((sum, r) => sum + (r.avgPace || 0), 0) /
            filteredHistory.length
          ).toFixed(2)
        : 0;

    let totalOvertimeMinutes = 0;
    let totalUndertimeMinutes = 0;
    let netMinutes = 0;

    filteredHistory.forEach((r) => {
      const minutes = getTargetMinutes(r.signOut);
      netMinutes += minutes;
      if (minutes > 0) {
        totalOvertimeMinutes += minutes;
      } else {
        totalUndertimeMinutes += Math.abs(minutes);
      }
    });

    const formatTime = (totalMinutes) => {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${h}h ${m}m`;
    };

    const totalOvertime = formatTime(totalOvertimeMinutes);
    const totalUndertime = formatTime(totalUndertimeMinutes);

    const netAbs = Math.abs(netMinutes);
    const netTime = formatTime(netAbs);
    const netLabel = netMinutes >= 0 ? "Over" : "Under";
    const netColor = netMinutes >= 0 ? "text-red-700" : "text-blue-700";
    const netBg =
      netMinutes >= 0 ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100";

    return (
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
          <div className="text-xs text-gray-500 uppercase font-bold">
            Total Stops
          </div>
          <div className="text-xl font-bold text-blue-700">{totalStops}</div>
        </div>
        <div className="bg-green-50 p-3 rounded border border-green-100">
          <div className="text-xs text-gray-500 uppercase font-bold">
            Total Packages
          </div>
          <div className="text-xl font-bold text-green-700">
            {totalPackages}
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded border border-purple-100">
          <div className="text-xs text-gray-500 uppercase font-bold">
            Avg Pace
          </div>
          <div className="text-xl font-bold text-purple-700">{avgPace}</div>
        </div>
        <div className="bg-red-50 p-3 rounded border border-red-100">
          <div className="text-xs text-gray-500 uppercase font-bold">
            Total Overtime
          </div>
          <div className="text-xl font-bold text-red-700">{totalOvertime}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
          <div className="text-xs text-gray-500 uppercase font-bold">
            Time Spared
          </div>
          <div className="text-xl font-bold text-blue-700">{totalUndertime}</div>
        </div>
        <div className={`p-3 rounded border ${netBg}`}>
          <div className="text-xs text-gray-500 uppercase font-bold">
            Time Summary
          </div>
          <div className={`text-xl font-bold ${netColor}`}>
            {netTime} <span className="text-sm font-normal">({netLabel})</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 flex gap-4">
      <div className="w-1/3 bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {viewMode === "drivers"
              ? "Drivers"
              : viewMode === "routes"
              ? "Routes"
              : "Dates"}
          </h2>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="drivers">Drivers</option>
            <option value="routes">Route Code</option>
            <option value="dates">Date</option>
          </select>
        </div>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {renderList()}
        </div>
      </div>

      <div className="w-2/3 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">{getTitle()}</h2>

        {renderSummary()}

        {selectedItem && viewMode !== "dates" && (
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              {["week", "month", "all"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm font-medium border ${
                    timeRange === range
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            {timeRange !== "all" && currentPeriodStart && (
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <button
                  onClick={handlePrevPeriod}
                  className="bg-white border px-3 py-1 rounded hover:bg-gray-100 text-sm font-medium"
                >
                  &larr; Previous
                </button>
                <span className="font-semibold text-gray-700">
                  {timeRange === "week" &&
                    currentPeriodStart &&
                    `${currentPeriodStart.toLocaleDateString()} - ${new Date(
                      new Date(currentPeriodStart).setDate(
                        currentPeriodStart.getDate() + 6
                      )
                    ).toLocaleDateString()}`}
                  {timeRange === "month" &&
                    currentPeriodStart &&
                    currentPeriodStart.toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                </span>
                <button
                  onClick={handleNextPeriod}
                  className="bg-white border px-3 py-1 rounded hover:bg-gray-100 text-sm font-medium"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {selectedItem && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200">{renderTableHeaders()}</thead>
              <tbody>{renderTableRows()}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
