import { useState, useEffect, useRef } from "react";
import axios from "axios";

const MetricsGraph = ({ data, viewMode }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth - 32); // Subtract padding
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!data || data.length === 0) return null;

  // Sort data by date ascending
  const sortedData = [...data].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Helper to get minutes
  const getMinutes = (signOut) => {
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
    return currentMinutes - deadlineMinutes;
  };

  const graphData = sortedData.map((d) => {
    let label = d.routeCode;
    if (viewMode === "routes") {
      label = d.driverNames ? d.driverNames.join("|") : d.driverName;
    }
    return {
      date: new Date(d.createdAt).toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
      }),
      label,
      packages: d.totalPackages || 0,
      stops: d.stopsComplete || 0,
      pace: parseFloat(d.avgPace || 0),
      targetDiff: getMinutes(d.signOut),
      raw: d,
    };
  });

  const height = 350;
  const margin = { top: 40, right: 20, bottom: 40, left: 60 };
  const chartWidth = Math.max(0, width - margin.left - margin.right);
  const chartHeight = height - margin.top - margin.bottom;

  // 4 Sections: Bar (Target), Line (Packages), Line (Stops), Line (Pace)
  const sectionH = chartHeight / 4;

  // Scales - Dynamic Range to exaggerate change
  const getRange = (key, minDiff = 10) => {
    const values = graphData.map((d) => d[key]);
    let min = Math.min(...values);
    let max = Math.max(...values);

    if (max - min < minDiff) {
      const center = (max + min) / 2;
      min = center - minDiff / 2;
      max = center + minDiff / 2;
    }

    const padding = (max - min) * 0.1;
    return { min: min - padding, max: max + padding };
  };

  const pkgRange = getRange("packages", 10);
  const stpRange = getRange("stops", 5);
  const paceRange = getRange("pace", 2);

  const maxTargetDiff = Math.max(
    ...graphData.map((d) => Math.abs(d.targetDiff)),
    10
  );

  const slotWidth = chartWidth / (graphData.length || 1);
  const maxBarWidth = 50;
  const colWidth = Math.min(slotWidth * 0.8, maxBarWidth);

  const getX = (i) => margin.left + i * slotWidth + slotWidth / 2;

  // Y positions for sections
  const yBar = margin.top;
  const yPkg = margin.top + sectionH;
  const yStp = margin.top + sectionH * 2;
  const yPace = margin.top + sectionH * 3;

  // Points for lines
  const getPoints = (metric, range, yOffset) => {
    return graphData
      .map((d, i) => {
        const x = getX(i);
        const ratio = (d[metric] - range.min) / (range.max - range.min);
        const y = yOffset + sectionH - 10 - ratio * (sectionH - 20);
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-white border rounded p-4 mb-4"
    >
      <svg
        width={width}
        height={height}
        className="block"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const idx = Math.floor((x - margin.left) / slotWidth);
          if (idx >= 0 && idx < graphData.length) {
            setHoverIndex(idx);
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          } else {
            setHoverIndex(null);
          }
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Grid Lines & Labels */}
        {[yBar, yPkg, yStp, yPace].map((y, i) => (
          <line
            key={i}
            x1={margin.left}
            y1={y + sectionH}
            x2={width - margin.right}
            y2={y + sectionH}
            stroke="#eee"
          />
        ))}

        {/* Section Labels */}
        <text
          x={10}
          y={yBar + sectionH / 2}
          className="text-xs font-bold fill-gray-500"
        >
          Target
        </text>
        <text
          x={10}
          y={yPkg + sectionH / 2}
          className="text-xs font-bold fill-gray-500"
        >
          Pkgs
        </text>
        <text
          x={10}
          y={yStp + sectionH / 2}
          className="text-xs font-bold fill-gray-500"
        >
          Stops
        </text>
        <text
          x={10}
          y={yPace + sectionH / 2}
          className="text-xs font-bold fill-gray-500"
        >
          Pace
        </text>

        {/* Data Columns */}
        {graphData.map((d, i) => {
          const x = getX(i);
          const isHovered = hoverIndex === i;

          const barHeight =
            (Math.abs(d.targetDiff) / maxTargetDiff) * (sectionH - 10);

          return (
            <g key={i}>
              {/* Column Background for Hover */}
              <rect
                x={getX(i) - slotWidth / 2}
                y={margin.top}
                width={slotWidth}
                height={chartHeight}
                fill={isHovered ? "#f3f4f6" : "transparent"}
              />

              {/* Top Label (Route/Driver) */}
              <text
                x={x}
                y={margin.top - 10}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-600"
              >
                {d.label}
              </text>

              {/* Bottom Label (Date) */}
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-600"
              >
                {d.date}
              </text>

              {/* Bar Chart (Target) */}
              <rect
                x={x - colWidth / 2}
                y={yBar}
                width={colWidth}
                height={Math.max(barHeight, 2)} // Min height 2
                fill={d.targetDiff >= 0 ? "#ef4444" : "#3b82f6"}
                opacity={0.8}
              />
              {/* Value Label for Bar */}
              <text
                x={x}
                y={yBar + barHeight + 12}
                textAnchor="middle"
                className="text-[10px] fill-gray-500"
              >
                {Math.floor(Math.abs(d.targetDiff))}m
              </text>
            </g>
          );
        })}

        {/* Line Charts */}
        <polyline
          points={getPoints("packages", pkgRange, yPkg)}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
        />
        <polyline
          points={getPoints("stops", stpRange, yStp)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        <polyline
          points={getPoints("pace", paceRange, yPace)}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
        />

        {/* Dots for Lines */}
        {graphData.map((d, i) => {
          const x = getX(i);
          const getDotY = (val, range, yOffset) => {
            const ratio = (val - range.min) / (range.max - range.min);
            return yOffset + sectionH - 10 - ratio * (sectionH - 20);
          };
          const yP = getDotY(d.packages, pkgRange, yPkg);
          const yS = getDotY(d.stops, stpRange, yStp);
          const yPa = getDotY(d.pace, paceRange, yPace);
          return (
            <g key={i}>
              <circle cx={x} cy={yP} r="3" fill="#10b981" />
              <circle cx={x} cy={yS} r="3" fill="#3b82f6" />
              <circle cx={x} cy={yPa} r="3" fill="#8b5cf6" />
            </g>
          );
        })}

        {/* Tooltip */}
        {hoverIndex !== null && (
          <g transform={`translate(${mousePos.x + 10}, ${mousePos.y + 10})`}>
            <rect
              width="140"
              height="110"
              fill="white"
              stroke="#ccc"
              rx="4"
              filter="drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))"
            />
            <text x="10" y="20" className="text-xs font-bold">
              {graphData[hoverIndex].date} - {graphData[hoverIndex].label}
            </text>
            <text x="10" y="40" className="text-xs fill-red-600">
              Target: {graphData[hoverIndex].targetDiff > 0 ? "+" : ""}
              {graphData[hoverIndex].targetDiff}m
            </text>
            <text x="10" y="60" className="text-xs fill-green-600">
              Packages: {graphData[hoverIndex].packages}
            </text>
            <text x="10" y="80" className="text-xs fill-blue-600">
              Stops: {graphData[hoverIndex].stops}
            </text>
            <text x="10" y="100" className="text-xs fill-purple-600">
              Pace: {graphData[hoverIndex].pace}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

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

  const getFilteredHistory = () => {
    return history.filter((record) => {
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
  };

  const renderTableRows = () => {
    const filteredHistory = getFilteredHistory();

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

    const filteredHistory = getFilteredHistory();

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

        {renderSummary()}

        {selectedItem &&
          (viewMode === "drivers" || viewMode === "routes") &&
          (timeRange === "week" || timeRange === "month") && (
            <MetricsGraph data={getFilteredHistory()} viewMode={viewMode} />
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
