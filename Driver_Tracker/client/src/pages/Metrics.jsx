import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../lib/apiClient";
import DetailedView from "../components/DetailedView";

const getWeekNumber = (d) => {
  if (!d) return 0;
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const getMonthsInYear = (year) => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    months.push(new Date(year, i, 1));
  }
  return months;
};

const getWeeksInMonth = (year, month) => {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let d = new Date(firstDay);
  d.setDate(d.getDate() - d.getDay()); // Start at Sunday

  while (d <= lastDay) {
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);

    if (start <= lastDay && end >= firstDay) {
      weeks.push({ start, end });
    }
    d.setDate(d.getDate() + 7);
  }
  return weeks;
};

const getDaysInWeek = (startOfWeek) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

const CalendarNavigation = ({
  viewMode,
  currentDate,
  onDateSelect,
  onViewChange,
  onNavigate,
  data = [],
  targetClockOutTime = "20:05",
}) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getMetrics = (date) => {
    const dateStr = date.toLocaleDateString();
    const item = data.find(
      (d) => new Date(d.date).toLocaleDateString() === dateStr
    );
    if (!item) return null;

    let diff = item.targetDiff;
    if (diff === undefined && item.signOut) {
      const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/;
      const match = item.signOut.match(timeRegex);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[4] ? match[4].toUpperCase() : null;
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        const [tH, tM] = targetClockOutTime.split(":").map(Number);
        const deadline = tH * 60 + tM;
        const current = hours * 60 + minutes;
        diff = current - deadline;
      } else {
        diff = 0;
      }
    }
    return { ...item, targetDiff: diff };
  };

  const renderHeader = () => {
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };

    const year = currentDate.getFullYear();
    const month = currentDate.toLocaleDateString(undefined, { month: "long" });

    let weekNum = getWeekNumber(currentDate);
    if (viewMode === "week") {
      const d = new Date(currentDate);
      const dayOfWeek = d.getDay();
      const targetMonday = new Date(d);
      targetMonday.setDate(d.getDate() - dayOfWeek + 1);
      weekNum = getWeekNumber(targetMonday);
    }

    const day = currentDate.getDate();

    // Breadcrumb items
    const breadcrumbs = [];

    // Year is always the root
    breadcrumbs.push({
      label: year,
      onClick: () => onViewChange("year"),
      active: viewMode === "year",
    });

    if (viewMode === "month" || viewMode === "week" || viewMode === "day") {
      breadcrumbs.push({
        label: month,
        onClick: () => onViewChange("month"),
        active: viewMode === "month",
      });
    }

    if (viewMode === "week" || viewMode === "day") {
      breadcrumbs.push({
        label: `Week ${weekNum}`,
        onClick: () => onViewChange("week"),
        active: viewMode === "week",
      });
    }

    if (viewMode === "day") {
      breadcrumbs.push({
        label: `${day}${getOrdinal(day)}`,
        onClick: () => {},
        active: true,
      });
    }

    // Title logic
    let title = "";
    if (viewMode === "year") title = year;
    else if (viewMode === "month") title = `${month} ${year}`;
    else if (viewMode === "week") {
      const d = new Date(currentDate);
      const dayOfWeek = d.getDay();
      const start = new Date(d);
      start.setDate(d.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      title = `${start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    } else if (viewMode === "day") {
      title = currentDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-1 text-gray-400">&gt;</span>}
              <button
                onClick={item.onClick}
                disabled={item.active}
                className={`${
                  item.active
                    ? "font-bold text-gray-800 cursor-default"
                    : "hover:text-blue-600 hover:underline"
                }`}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => onNavigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            &larr; Previous
          </button>
          <div className="font-bold text-xl text-gray-800">{title}</div>
          <button
            onClick={() => onNavigate(1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    );
  };

  const renderDayCard = (date, isCurrentMonth = true) => {
    if (!date)
      return (
        <div className="bg-gray-50/50 rounded border border-transparent"></div>
      );

    const metrics = getMetrics(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected =
      viewMode === "day" && date.toDateString() === currentDate.toDateString();
    const isMonthView = viewMode === "month";

    return (
      <div
        className={`rounded border cursor-pointer transition-all flex flex-col justify-between ${
          isMonthView ? "p-1 h-16" : "p-2 h-24"
        } ${
          isSelected
            ? "bg-blue-100 border-blue-600 ring-2 ring-blue-400 shadow-md"
            : isToday
            ? "bg-blue-50 border-blue-500 ring-1 ring-blue-200"
            : isCurrentMonth
            ? "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
            : "bg-gray-50 border-gray-100 text-gray-400"
        }`}
        onClick={() => {
          if (viewMode === "month") {
            onDateSelect(date, "day");
          } else if (viewMode === "week" || viewMode === "day") {
            onDateSelect(date, "day");
          }
        }}
      >
        <div
          className={`font-bold text-center text-sm ${
            isSelected
              ? "text-blue-900"
              : isToday
              ? "text-blue-700"
              : "text-gray-700"
          }`}
        >
          {(viewMode === "week" || viewMode === "day") && (
            <span className="mr-1">
              {date.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
          )}
          {date.getDate()}
        </div>

        {metrics ? (
          <div className="text-[10px]">
            {isMonthView ? (
              <>
                <div className="flex justify-between px-1">
                  <span title="Stops">S:{metrics.stopsComplete}</span>
                  <span title="Packages">P:{metrics.totalPackages}</span>
                </div>
                <div
                  className={`text-center font-medium ${
                    metrics.targetDiff > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {metrics.targetDiff > 0 ? "+" : ""}
                  {Math.floor(metrics.targetDiff || 0)}m
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Stops</span>
                  <span className="font-medium">{metrics.stopsComplete}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pkgs</span>
                  <span className="font-medium">{metrics.totalPackages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Net</span>
                  <span
                    className={`font-medium ${
                      metrics.targetDiff > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {metrics.targetDiff > 0 ? "+" : ""}
                    {Math.floor(metrics.targetDiff || 0)}m
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-gray-300 text-xs">-</span>
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    // If viewMode is 'day', currentDate is the selected day.
    // We want to show the week containing that day.
    const d = new Date(currentDate);
    const day = d.getDay();
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => (
          <div key={i}>{renderDayCard(d)}</div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    // Padding for start
    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, 0 - (startDay - 1 - i));
      days.push({ date: d, isCurrentMonth: false });
    }
    // Days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Padding for end (to complete rows)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }
    }

    // Chunk into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div>
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] gap-2 text-center mb-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center justify-center">
            Wk
          </div>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-xs font-bold text-gray-500 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] gap-2">
          {weeks.map((week, weekIndex) => {
            const weekNum = getWeekNumber(week[1].date);
            return (
              <div key={weekIndex} className="contents">
                <div
                  className="flex items-center justify-center font-bold text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors text-sm"
                  onClick={() => {
                    onDateSelect(week[1].date, "week");
                  }}
                  title={`View Week ${weekNum}`}
                >
                  {weekNum}
                </div>
                {week.map((d, i) => (
                  <div key={i}>{renderDayCard(d.date, d.isCurrentMonth)}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    return (
      <div className="grid grid-cols-4 gap-4">
        {monthNames.map((name, index) => (
          <div
            key={name}
            className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer text-center transition-all shadow-sm hover:shadow-md bg-white"
            onClick={() => {
              const d = new Date(currentDate.getFullYear(), index, 1);
              onDateSelect(d, "month");
            }}
          >
            <div className="font-bold text-gray-800">{name}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
      {renderHeader()}
      {(viewMode === "week" || viewMode === "day") && renderWeekView()}
      {viewMode === "month" && renderMonthView()}
      {viewMode === "year" && renderYearView()}
    </div>
  );
};

const MetricsGraph = ({
  data,
  viewMode,
  timeRange,
  periodStart,
  targetClockOutTime,
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [hoverMetric, setHoverMetric] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);

  const [activeTab, setActiveTab] = useState("table");

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

  // Generate full date range data
  const graphData = useMemo(() => {
    if (!periodStart || !timeRange) return [];

    const dates = [];
    const startDate = new Date(periodStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysCount = 7;
    if (timeRange === "month") {
      const year = startDate.getFullYear();
      const month = startDate.getMonth();
      daysCount = new Date(year, month + 1, 0).getDate();
    } else if (timeRange === "year") {
      const year = startDate.getFullYear();
      daysCount =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
    } else if (timeRange === "day") {
      daysCount = 1;
    }

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    const dataMap = {};
    data.forEach((item) => {
      const d = new Date(item.date);
      // Normalize to local date string for comparison
      const dateStr = d.toLocaleDateString();
      dataMap[dateStr] = item;
    });

    return dates.map((date) => {
      const dateStr = date.toLocaleDateString();
      const d = dataMap[dateStr];
      const isMissing = !d;
      const isPast = date < today;

      let label = "";
      if (!isMissing) {
        label = d.routeCode;
        if (viewMode === "routes") {
          const name = d.driverName || d.driverId?.name;
          label = d.driverNames ? d.driverNames.join("|") : name;
        }
      }

      if (timeRange === "year") {
        if (date.getDate() === 1) {
          label = date.toLocaleDateString(undefined, { month: "short" });
        } else {
          label = "";
        }
      }

      // Helper to get minutes (copied from original)
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

        const [targetHours, targetMinutes] = (targetClockOutTime || "20:05")
          .split(":")
          .map(Number);
        const deadlineMinutes = targetHours * 60 + targetMinutes;

        const currentMinutes = hours * 60 + minutes;
        return currentMinutes - deadlineMinutes;
      };

      return {
        date:
          timeRange === "month"
            ? date.getDate().toString()
            : timeRange === "year"
            ? date.toLocaleDateString(undefined, {
                month: "numeric",
                day: "numeric",
              })
            : date.toLocaleDateString(undefined, {
                month: "numeric",
                day: "numeric",
              }),
        label,
        packages: d ? d.totalPackages || 0 : 0,
        stops: d ? d.stopsComplete || 0 : 0,
        pace: d ? parseFloat(d.avgPace || 0) : 0,
        targetDiff: d ? getMinutes(d.signOut) : 0,
        raw: d,
        isMissing,
        isPast,
      };
    });
  }, [data, timeRange, periodStart, viewMode, targetClockOutTime]);

  if (!graphData.length) return null;

  const height = 350;
  const margin = { top: 40, right: 20, bottom: 40, left: 60 };
  const chartWidth = Math.max(0, width - margin.left - margin.right);
  const chartHeight = height - margin.top - margin.bottom;

  // 4 Sections: Bar (Target), Line (Packages), Line (Stops), Line (Pace)
  const sectionH = chartHeight / 4;

  // Scales - Calculate based on EXISTING data only
  const validData = graphData.filter((d) => !d.isMissing);

  const getRange = (key, minDiff = 10) => {
    if (validData.length === 0) return { min: 0, max: 100 };
    const values = validData.map((d) => d[key]);
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

  const maxTargetDiff =
    validData.length > 0
      ? Math.max(...validData.map((d) => Math.abs(d.targetDiff)), 10)
      : 10;

  const slotWidth = chartWidth / (graphData.length || 1);
  const maxBarWidth = 50;
  const colWidth = Math.min(slotWidth * 0.8, maxBarWidth);

  const getX = (i) => margin.left + i * slotWidth + slotWidth / 2;

  // Y positions for sections
  const yBar = margin.top;
  const yPkg = margin.top + sectionH;
  const yStp = margin.top + sectionH * 2;
  const yPace = margin.top + sectionH * 3;

  // Points for lines - Skip missing
  const getPoints = (metric, range, yOffset) => {
    return graphData
      .map((d, i) => {
        if (d.isMissing) return null;
        const x = getX(i);
        const ratio = (d[metric] - range.min) / (range.max - range.min);
        const y = yOffset + sectionH - 10 - ratio * (sectionH - 20);
        return `${x},${y}`;
      })
      .filter((p) => p !== null)
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
          const y = e.clientY - rect.top;
          const idx = Math.floor((x - margin.left) / slotWidth);
          if (idx >= 0 && idx < graphData.length) {
            setHoverIndex(idx);
            setMousePos({ x, y });

            if (y >= yBar && y < yPkg) setHoverMetric("target");
            else if (y >= yPkg && y < yStp) setHoverMetric("packages");
            else if (y >= yStp && y < yPace) setHoverMetric("stops");
            else if (y >= yPace && y < yPace + sectionH) setHoverMetric("pace");
            else setHoverMetric(null);
          } else {
            setHoverIndex(null);
            setHoverMetric(null);
          }
        }}
        onMouseLeave={() => {
          setHoverIndex(null);
          setHoverMetric(null);
        }}
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

          if (d.isMissing) {
            if (d.isPast) {
              // Grey bar for past missing data
              return (
                <g key={i}>
                  <rect
                    x={getX(i) - slotWidth / 2}
                    y={margin.top}
                    width={slotWidth}
                    height={chartHeight}
                    fill="#f3f4f6" // Light grey
                    opacity={0.5}
                  />
                  {/* Date Label */}
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-400"
                  >
                    {d.date}
                  </text>
                </g>
              );
            } else {
              // Future missing data - just date label
              return (
                <g key={i}>
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-300"
                  >
                    {d.date}
                  </text>
                </g>
              );
            }
          }

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
              {timeRange !== "month" && (
                <text
                  x={x}
                  y={margin.top - 10}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-600"
                >
                  {d.label}
                </text>
              )}

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
          if (d.isMissing) return null;
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
        {hoverIndex !== null &&
          hoverMetric &&
          !graphData[hoverIndex].isMissing && (
            <g transform={`translate(${mousePos.x + 10}, ${mousePos.y + 10})`}>
              <rect
                width="140"
                height="50"
                fill="white"
                stroke="#ccc"
                rx="4"
                filter="drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))"
              />
              <text x="10" y="20" className="text-xs font-bold">
                {graphData[hoverIndex].date} - {graphData[hoverIndex].label}
              </text>
              {hoverMetric === "target" && (
                <text x="10" y="40" className="text-xs fill-red-600">
                  Target: {graphData[hoverIndex].targetDiff > 0 ? "+" : ""}
                  {graphData[hoverIndex].targetDiff}m
                </text>
              )}
              {hoverMetric === "packages" && (
                <text x="10" y="40" className="text-xs fill-green-600">
                  Packages: {graphData[hoverIndex].packages}
                </text>
              )}
              {hoverMetric === "stops" && (
                <text x="10" y="40" className="text-xs fill-blue-600">
                  Stops: {graphData[hoverIndex].stops}
                </text>
              )}
              {hoverMetric === "pace" && (
                <text x="10" y="40" className="text-xs fill-purple-600">
                  Pace: {graphData[hoverIndex].pace}
                </text>
              )}
            </g>
          )}
      </svg>
    </div>
  );
};

const History = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("dates"); // Default to dates
  const [listData, setListData] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [selectedDriverFilter, setSelectedDriverFilter] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [timeRange, setTimeRange] = useState("week");
  const [currentPeriodStart, setCurrentPeriodStart] = useState(null);
  const [targetClockOutTime, setTargetClockOutTime] = useState("20:05");
  const [activeTab, setActiveTab] = useState("table");

  // Date Navigation State
  const [dateNav, setDateNav] = useState({
    level: "year", // 'year', 'month', 'week', 'day'
    year: null,
    month: null,
    weekStart: null,
    day: null,
  });
  const [availableDates, setAvailableDates] = useState([]);
  const [summaryData, setSummaryData] = useState([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { data } = await apiClient.get("/api/metrics/list");
        setDriverList(
          data.sort((a, b) => a.driverName.localeCompare(b.driverName))
        );
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };
    fetchDrivers();
  }, []);

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

  const getStartOfYear = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), 0, 1);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/settings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok && data.targetClockOutTime) {
          setTargetClockOutTime(data.targetClockOutTime);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const driverFromState = location.state?.selectedDriver;
    if (driverFromState) {
      setViewMode("drivers");
      fetchListData(); // Fetch the list of all drivers
      handleItemClick(driverFromState); // Then select the specific driver
    } else {
      fetchListData(); // Default behavior
    }
  }, [location.state]);

  useEffect(() => {
    if (currentPeriodStart) {
      if (timeRange === "week") {
        setCurrentPeriodStart(getStartOfWeek(currentPeriodStart));
      } else if (timeRange === "month") {
        setCurrentPeriodStart(getStartOfMonth(currentPeriodStart));
      } else if (timeRange === "year") {
        setCurrentPeriodStart(getStartOfYear(currentPeriodStart));
      }
    }
  }, [timeRange]);

  useEffect(() => {
    // This effect should now only handle resets when the viewMode is changed MANUALLY,
    // not when the component first loads with state from another page.
    if (location.state?.selectedDriver) {
      // On initial load from Dispatch, we've already handled this, so we clear the state
      // to allow normal operation afterward.
      window.history.replaceState({}, document.title);
      return;
    }
    setListData([]); // Clear list data
    setSelectedItem(null);
    setHistory([]);
    setSummaryData([]);
    setDateNav({
      level: "year",
      year: null,
      month: null,
      weekStart: null,
      day: null,
    });

    // Initialize calendar for dates view
    if (viewMode === "dates" || viewMode === "rescues") {
      if (!currentPeriodStart) {
        setCurrentPeriodStart(getStartOfWeek(new Date()));
      }
    }

    fetchListData();
  }, [viewMode]);

  // Fetch summary when calendar changes in dates view
  useEffect(() => {
    if (
      (viewMode === "dates" || viewMode === "rescues") &&
      currentPeriodStart
    ) {
      let start = new Date(currentPeriodStart);
      let end = new Date(currentPeriodStart);

      if (timeRange === "week") {
        end.setDate(end.getDate() + 6);
      } else if (timeRange === "month") {
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
      } else if (timeRange === "year") {
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(0);
      } else if (timeRange === "day") {
        // end is same as start for day view
      }

      // Set end of day
      end.setHours(23, 59, 59, 999);

      fetchSummary(start, end);
    }
  }, [viewMode, currentPeriodStart, timeRange]);

  const fetchListData = async () => {
    try {
      let url = "/api/metrics/list";
      if (viewMode === "routes") url = "/api/metrics/routes";
      if (viewMode === "dates" || viewMode === "rescues")
        url = "/api/metrics/dates";

      const { data: responseData } = await apiClient.get(url);

      let data = responseData;
      if (viewMode === "drivers") {
        data = data.sort((a, b) => a.driverName.localeCompare(b.driverName));
      }

      if (viewMode === "dates" || viewMode === "rescues") {
        setAvailableDates(data); // Store raw date strings
      } else {
        setListData(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Helper to fetch summary data
  const fetchSummary = async (start, end) => {
    try {
      const { data } = await apiClient.get("/api/metrics/summary", {
        params: { start: start.toISOString(), end: end.toISOString() },
      });

      // Aggregate data by driver
      const aggregated = data.reduce((acc, curr) => {
        const id = curr.transporterId;
        if (!acc[id]) {
          acc[id] = {
            transporterId: id,
            driverName: curr.driverName,
            totalStops: 0,
            totalPackages: 0,
            paceSum: 0,
            paceCount: 0,
            targetDiff: 0,
            totalRescueStops: 0,
            totalRescuedStops: 0,
          };
        }

        acc[id].totalStops += curr.stopsComplete || 0;
        acc[id].totalPackages += curr.totalPackages || 0;
        if (curr.avgPace) {
          acc[id].paceSum += curr.avgPace;
          acc[id].paceCount++;
        }
        acc[id].targetDiff += getTargetMinutes(curr.signOut);

        if (curr.rescueLog) {
          curr.rescueLog.forEach((log) => {
            if (log.type === "GAVE") acc[id].totalRescueStops += log.count;
            if (log.type === "RECEIVED") acc[id].totalRescuedStops += log.count;
          });
        }

        return acc;
      }, {});

      const result = Object.values(aggregated).map((d) => ({
        ...d,
        avgPace: d.paceCount > 0 ? d.paceSum / d.paceCount : 0,
      }));

      setSummaryData(result);
      setHistory(data); // Store raw data
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleItemClick = async (item) => {
    if (viewMode === "dates" || viewMode === "rescues") {
      // Handle Date Navigation
      // item is the clicked value (year number, month index, week string, or day string)

      const newNav = { ...dateNav };
      let start, end;

      if (dateNav.level === "year") {
        newNav.level = "month";
        newNav.year = item;
        // Fetch summary for the year
        start = new Date(item, 0, 1);
        end = new Date(item, 11, 31);
        fetchSummary(start, end);
      } else if (dateNav.level === "month") {
        newNav.level = "week";
        newNav.month = item; // 0-11
        // Fetch summary for the month
        start = new Date(newNav.year, item, 1);
        end = new Date(newNav.year, item + 1, 0);
        fetchSummary(start, end);
      } else if (dateNav.level === "week") {
        newNav.level = "day";
        newNav.weekStart = item; // Date object or string
        // Fetch summary for the week
        start = new Date(item);
        end = new Date(item);
        end.setDate(end.getDate() + 6);
        fetchSummary(start, end);
      } else if (dateNav.level === "day") {
        // Fetch details for the day
        // item is the date string YYYY-MM-DD
        setSelectedItem(item); // For title
        try {
          const { data } = await apiClient.get(
            `/api/metrics/date/${encodeURIComponent(item)}`
          );
          setHistory(data);
        } catch (error) {
          console.error(error);
        }
      }

      setDateNav(newNav);
      return;
    }

    setSelectedItem(item);
    try {
      let url = "";
      if (viewMode === "drivers")
        url = `/api/metrics/driver/${encodeURIComponent(item.transporterId)}`;
      if (viewMode === "routes")
        url = `/api/metrics/route/${encodeURIComponent(item)}`;

      const { data } = await apiClient.get(url);

      // Process data for Route view to group by date
      if (viewMode === "routes") {
        const grouped = data.reduce((acc, curr) => {
          const date = new Date(curr.date).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { ...curr, driverNames: [curr.driverName] };
          } else {
            acc[date].driverNames.push(curr.driverName);
          }
          return acc;
        }, {});
        setHistory(
          Object.values(grouped).sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )
        );

        // Set initial period for routes
        const dates = Object.values(grouped).map((d) => new Date(d.date));
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
        setHistory(data);

        // Set initial period for drivers
        if (
          (viewMode === "drivers" || viewMode === "rescues") &&
          data.length > 0
        ) {
          const dates = data.map((d) => new Date(d.date));
          const maxDate = new Date(Math.max.apply(null, dates));
          setCurrentPeriodStart(
            timeRange === "month"
              ? getStartOfMonth(maxDate)
              : getStartOfWeek(maxDate)
          );
        } else if (viewMode === "drivers" || viewMode === "rescues") {
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

  const handleBack = () => {
    const newNav = { ...dateNav };
    if (dateNav.level === "month") {
      newNav.level = "year";
      newNav.year = null;
      setSummaryData([]);
    } else if (dateNav.level === "week") {
      newNav.level = "month";
      newNav.month = null;
      // Re-fetch year summary
      const start = new Date(newNav.year, 0, 1);
      const end = new Date(newNav.year, 11, 31);
      fetchSummary(start, end);
    } else if (dateNav.level === "day") {
      newNav.level = "week";
      newNav.weekStart = null;
      // Re-fetch month summary
      const start = new Date(newNav.year, newNav.month, 1);
      const end = new Date(newNav.year, newNav.month + 1, 0);
      fetchSummary(start, end);
    }
    setDateNav(newNav);
    setHistory([]);
    setSelectedItem(null);
  };

  // Helper to parse YYYY-MM-DD or ISO string to local Date object (preserving calendar day)
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date();
    // If it's an ISO string (UTC), convert to local date with same calendar components
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };

  const renderList = () => {
    const currentYear = currentPeriodStart
      ? currentPeriodStart.getFullYear()
      : new Date().getFullYear();
    const currentMonth = currentPeriodStart
      ? currentPeriodStart.getMonth()
      : new Date().getMonth();

    if (timeRange === "year") {
      const months = getMonthsInYear(currentYear);
      return (
        <ul>
          {months.map((date, index) => (
            <li
              key={index}
              onClick={() => {
                setCurrentPeriodStart(date);
                setTimeRange("month");
              }}
              className="p-2 font-semibold cursor-pointer hover:bg-gray-100 border-b"
            >
              {date.toLocaleDateString(undefined, {
                month: "long",
              })}
            </li>
          ))}
        </ul>
      );
    } else if (timeRange === "month") {
      const weeks = getWeeksInMonth(currentYear, currentMonth);
      return (
        <ul>
          <li
            className="p-2 cursor-pointer hover:bg-gray-100 border-b font-bold text-gray-500 flex items-center gap-2"
            onClick={() => setTimeRange("year")}
          >
            <span>&larr;</span> Back to Year
          </li>
          {weeks.map((week, index) => {
            return (
              <li
                key={index}
                onClick={() => {
                  setCurrentPeriodStart(week.start);
                  setTimeRange("week");
                }}
                className="p-2 cursor-pointer hover:bg-gray-100 border-b"
              >
                <div className="font-semibold">
                  Week {getWeekNumber(week.start)}
                </div>
                <div className="text-xs text-gray-500">
                  {week.start.toLocaleDateString()} -{" "}
                  {week.end.toLocaleDateString()}
                </div>
              </li>
            );
          })}
        </ul>
      );
    } else if (timeRange === "week") {
      const days = getDaysInWeek(currentPeriodStart);
      return (
        <ul>
          <li
            className="p-2 cursor-pointer hover:bg-gray-100 border-b font-bold text-gray-500 flex items-center gap-2"
            onClick={() => setTimeRange("month")}
          >
            <span>&larr;</span> Back to Month
          </li>
          {days.map((date, index) => (
            <li
              key={index}
              onClick={() => {
                setCurrentPeriodStart(date);
                setTimeRange("day");
              }}
              className="p-2 cursor-pointer hover:bg-gray-100 border-b"
            >
              <div className="font-semibold">
                {date.toLocaleDateString(undefined, { weekday: "long" })}
              </div>

              <div className="text-xs text-gray-500">
                {date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </li>
          ))}
        </ul>
      );
    } else if (timeRange === "day") {
      const startOfWeek = getStartOfWeek(currentPeriodStart);
      const days = getDaysInWeek(startOfWeek);

      return (
        <ul>
          <li
            className="p-2 cursor-pointer hover:bg-gray-100 border-b font-bold text-gray-500 flex items-center gap-2"
            onClick={() => {
              setCurrentPeriodStart(startOfWeek);
              setTimeRange("week");
            }}
          >
            <span>&larr;</span> Back to Week
          </li>
          {days.map((date, index) => {
            const isSelected =
              date.toDateString() === currentPeriodStart.toDateString();
            return (
              <li
                key={index}
                onClick={() => setCurrentPeriodStart(date)}
                className={`p-2 cursor-pointer hover:bg-gray-100 border-b ${
                  isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="font-semibold">
                  {date.toLocaleDateString(undefined, { weekday: "long" })}
                </div>

                <div className="text-xs text-gray-500">
                  {date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      );
    }
    // Fallback
    return null;
  };

  const renderTableHeaders = () => {
    if (viewMode === "drivers") {
      return (
        <tr>
          <th className="px-4 py-2">Date</th>
          <th className="px-4 py-2">Route</th>
          <th className="px-4 py-2">Van</th>
          <th className="px-4 py-2">Equipment</th>
          <th className="px-4 py-2">Stops</th>
          <th className="px-4 py-2">Packages</th>
          <th className="px-4 py-2">Pace</th>
          <th className="px-4 py-2">Break Time</th>
          <th className="px-4 py-2">Last Stop</th>
          <th className="px-4 py-2">Sign Out</th>
          <th className="px-4 py-2">Target</th>
          <th className="px-4 py-2">Note</th>
        </tr>
      );
    } else if (viewMode === "routes") {
      return (
        <tr>
          <th className="px-4 py-2">Date</th>
          <th className="px-4 py-2">Driver</th>
          <th className="px-4 py-2">Van</th>
          <th className="px-4 py-2">Equipment</th>
          <th className="px-4 py-2">Stops</th>
          <th className="px-4 py-2">Packages</th>
          <th className="px-4 py-2">Pace</th>
          <th className="px-4 py-2">Break Time</th>
          <th className="px-4 py-2">Last Stop</th>
          <th className="px-4 py-2">Sign Out</th>
          <th className="px-4 py-2">Target</th>
          <th className="px-4 py-2">Note</th>
        </tr>
      );
    } else if (viewMode === "rescues") {
      return (
        <tr>
          <th className="px-4 py-2">Driver</th>
          <th className="px-4 py-2">Rescue (+/-)</th>
          <th className="px-4 py-2">Rescue Details</th>
        </tr>
      );
    } else if (viewMode === "dates") {
      // Summary View Headers
      return (
        <tr>
          <th className="px-4 py-2">Driver</th>
          <th className="px-4 py-2">Total Stops</th>
          <th className="px-4 py-2">Total Packages</th>
          <th className="px-4 py-2">Avg Pace</th>
          <th className="px-4 py-2">Target (Net)</th>
        </tr>
      );
    }
  };

  const getFilteredHistory = () => {
    return history.filter((record) => {
      if (
        selectedDriverFilter &&
        record.transporterId !== selectedDriverFilter.transporterId
      ) {
        return false;
      }

      if (viewMode === "dates") return true;
      if (timeRange === "all") return true;
      if (!currentPeriodStart) return true;

      const recordDate = new Date(record.date);

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
      } else if (timeRange === "year") {
        const yearEnd = new Date(currentPeriodStart);
        yearEnd.setFullYear(yearEnd.getFullYear() + 1);
        yearEnd.setDate(0);
        yearEnd.setHours(23, 59, 59, 999);
        return recordDate >= currentPeriodStart && recordDate <= yearEnd;
      } else if (timeRange === "day") {
        const dayEnd = new Date(currentPeriodStart);
        dayEnd.setHours(23, 59, 59, 999);
        return recordDate >= currentPeriodStart && recordDate <= dayEnd;
      }
      return true;
    });
  };

  const renderTableRows = () => {
    if (viewMode === "dates" || viewMode === "rescues") {
      // Render Summary Rows
      if (summaryData.length === 0) {
        return (
          <tr>
            <td colSpan="5" className="px-4 py-2 text-center text-gray-500">
              No data available for this period.
            </td>
          </tr>
        );
      }

      // Filter by selected driver if set
      const dataToRender = selectedDriverFilter
        ? summaryData.filter(
            (d) => d.transporterId === selectedDriverFilter.transporterId
          )
        : summaryData;

      if (dataToRender.length === 0) {
        return (
          <tr>
            <td colSpan="5" className="px-4 py-2 text-center text-gray-500">
              No data available for this driver in this period.
            </td>
          </tr>
        );
      }

      return dataToRender.map((driver, index) => {
        if (viewMode === "rescues") {
          // Only show if there is rescue activity
          if (!driver.totalRescueStops && !driver.totalRescuedStops)
            return null;

          const netRescue =
            (driver.totalRescueStops || 0) - (driver.totalRescuedStops || 0);
          const netRescueDisplay =
            netRescue > 0 ? `+${netRescue}` : `${netRescue}`;
          const netColor = netRescue > 0 ? "text-green-600" : "text-red-600";

          return (
            <tr key={index} className="border-b">
              <td className="px-4 py-2 font-medium">
                <button
                  onClick={() => setSelectedDriverFilter(driver)}
                  className="text-blue-600 hover:underline text-left"
                >
                  {driver.driverName}
                </button>
              </td>
              <td className={`px-4 py-2 font-bold ${netColor}`}>
                {netRescueDisplay}
              </td>
              <td className="px-4 py-2 text-gray-500 italic">-</td>
            </tr>
          );
        }

        const netMinutes = driver.targetDiff || 0;
        const h = Math.floor(Math.abs(netMinutes) / 60);
        const m = netMinutes % 60;
        const timeStr = `${h}h ${m}m`;
        const isOver = netMinutes > 0;

        return (
          <tr key={index} className="border-b">
            <td className="px-4 py-2 font-medium">
              <button
                onClick={() => setSelectedDriverFilter(driver)}
                className="text-blue-600 hover:underline text-left"
              >
                {driver.driverName}
              </button>
            </td>
            <td className="px-4 py-2">{driver.totalStops}</td>
            <td className="px-4 py-2">{driver.totalPackages}</td>
            <td className="px-4 py-2">{driver.avgPace.toFixed(2)}</td>
            <td
              className={`px-4 py-2 font-medium ${
                isOver ? "text-red-600" : "text-blue-600"
              }`}
            >
              {isOver ? "+" : "-"}
              {timeStr}
            </td>
          </tr>
        );
      });
    }

    const filteredHistory = getFilteredHistory();
    // ... rest of renderTableRows

    if (filteredHistory.length === 0) {
      return (
        <tr>
          <td colSpan="9" className="px-4 py-2 text-center text-gray-500">
            No records found for this period.
          </td>
        </tr>
      );
    }

    return filteredHistory.map((record, index) => {
      const date = new Date(record.date).toLocaleDateString();

      // Helper to format equipment
      const formatEquipment = (equipList) => {
        if (!equipList || equipList.length === 0) return "-";
        return equipList.map((e) => `${e.type} (${e.serialNumber})`).join(", ");
      };

      // Helper to format Van
      const formatVan = (van, vin) => {
        if (van) return van.vin; // Or van.licensePlate
        return vin || "-";
      };

      if (viewMode === "drivers") {
        return (
          <tr key={record._id} className="border-b">
            <td className="px-4 py-2">{date}</td>
            <td className="px-4 py-2">{record.routeCode}</td>
            <td className="px-4 py-2">{formatVan(record.vanId, record.vin)}</td>
            <td className="px-4 py-2 text-xs">
              {formatEquipment(record.assignedEquipment)}
            </td>
            <td className="px-4 py-2">
              {record.stopsComplete}/{record.allStops}
            </td>
            <td className="px-4 py-2">{record.totalPackages}</td>
            <td className="px-4 py-2">{record.avgPace}</td>
            <td className="px-4 py-2">{record.breakTimeUsed}</td>
            <td className="px-4 py-2">{record.lastStopExecution}</td>
            <td className="px-4 py-2">{record.signOut}</td>
            <td className="px-4 py-2">{calculateTarget(record.signOut)}</td>
            <td className="px-4 py-2 text-sm text-gray-600 italic">
              {record.note}
            </td>
          </tr>
        );
      } else if (viewMode === "routes") {
        const name = record.driverName || record.driverId?.name;
        const drivers = record.driverNames
          ? record.driverNames.join(" | ")
          : name;
        return (
          <tr key={record._id || index} className="border-b">
            <td className="px-4 py-2">{date}</td>
            <td className="px-4 py-2">{drivers}</td>
            <td className="px-4 py-2">{formatVan(record.vanId, record.vin)}</td>
            <td className="px-4 py-2 text-xs">
              {formatEquipment(record.assignedEquipment)}
            </td>
            <td className="px-4 py-2">
              {record.stopsComplete}/{record.allStops}
            </td>
            <td className="px-4 py-2">{record.totalPackages}</td>
            <td className="px-4 py-2">{record.avgPace}</td>
            <td className="px-4 py-2">{record.breakTimeUsed}</td>
            <td className="px-4 py-2">{record.lastStopExecution}</td>
            <td className="px-4 py-2">{record.signOut}</td>
            <td className="px-4 py-2">{calculateTarget(record.signOut)}</td>
            <td className="px-4 py-2 text-sm text-gray-600 italic">
              {record.note}
            </td>
          </tr>
        );
      } else if (viewMode === "rescues") {
        // Only show rows if there was rescue activity
        if (!record.rescueStops && !record.rescuedStops) return null;

        // Calculate net rescue count for display
        const netRescue =
          (record.rescueStops || 0) - (record.rescuedStops || 0);
        const netRescueDisplay =
          netRescue > 0 ? `+${netRescue}` : `${netRescue}`;
        const netColor = netRescue > 0 ? "text-green-600" : "text-red-600";

        return (
          <tr key={record._id} className="border-b">
            <td className="px-4 py-2">
              {record.driverName || record.driverId?.name}
            </td>
            <td className={`px-4 py-2 font-bold ${netColor}`}>
              {netRescueDisplay}
            </td>
            <td className="px-4 py-2">
              {record.rescueLog && record.rescueLog.length > 0 ? (
                <ul className="text-sm">
                  {record.rescueLog.map((log, i) => (
                    <li
                      key={i}
                      className={
                        log.type === "RECEIVED"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {log.type === "RECEIVED" ? "From" : "To"}{" "}
                      {log.otherDriverName}:{" "}
                      {log.type === "RECEIVED" ? "+" : "-"}
                      {log.count}
                    </li>
                  ))}
                </ul>
              ) : (
                "-"
              )}
            </td>
          </tr>
        );
      } else if (viewMode === "dates") {
        return (
          <tr key={record._id} className="border-b">
            <td className="px-4 py-2">
              {record.driverName || record.driverId?.name}
            </td>
            <td className="px-4 py-2">{record.routeCode}</td>
            <td className="px-4 py-2">{formatVan(record.vanId, record.vin)}</td>
            <td className="px-4 py-2 text-xs">
              {formatEquipment(record.assignedEquipment)}
            </td>
            <td className="px-4 py-2">
              {record.stopsComplete}/{record.allStops}
            </td>
            <td className="px-4 py-2">{record.totalPackages}</td>
            <td className="px-4 py-2">{record.avgPace}</td>
            <td className="px-4 py-2">{record.breakTimeUsed}</td>
            <td className="px-4 py-2">{record.lastStopExecution}</td>
            <td className="px-4 py-2">{record.signOut}</td>
            <td className="px-4 py-2">{calculateTarget(record.signOut)}</td>
            <td className="px-4 py-2 text-sm text-gray-600 italic">
              {record.note}
            </td>
          </tr>
        );
      }
    });
  };

  const getTitle = () => {
    if (viewMode === "dates" || viewMode === "rescues") {
      if (selectedDriverFilter) {
        return `Metric Summary for ${selectedDriverFilter.driverName}`;
      }
      return "Metric Summary";
    }

    if (!selectedItem) return "Select an item to view history";
    if (viewMode === "drivers") return `History for ${selectedItem.driverName}`;
    if (viewMode === "routes") return `History for ${selectedItem}`;
    if (viewMode === "dates") return `Metrics for ${selectedItem}`;
    if (viewMode === "rescues") return `Metrics for ${selectedItem}`;
  };

  const handlePrevPeriod = () => {
    if (!currentPeriodStart) return;
    const newDate = new Date(currentPeriodStart);
    if (timeRange === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (timeRange === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (timeRange === "year") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else if (timeRange === "day") {
      newDate.setDate(newDate.getDate() - 1);
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
    } else if (timeRange === "year") {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else if (timeRange === "day") {
      newDate.setDate(newDate.getDate() + 1);
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
    const [targetHours, targetMinutes] = targetClockOutTime
      .split(":")
      .map(Number);
    const deadlineMinutes = targetHours * 60 + targetMinutes;
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

    const [targetHours, targetMinutes] = targetClockOutTime
      .split(":")
      .map(Number);
    const deadlineMinutes = targetHours * 60 + targetMinutes;
    const currentMinutes = hours * 60 + minutes;

    // Positive for OT, Negative for Undertime
    return currentMinutes - deadlineMinutes;
  };

  const renderSummary = () => {
    let dataToSummarize = [];
    let isAggregated = false;

    if (
      (viewMode === "dates" || viewMode === "rescues") &&
      (dateNav.level !== "day" || !selectedItem)
    ) {
      dataToSummarize = summaryData;
      isAggregated = true;
    } else {
      if (!selectedItem) return null;
      dataToSummarize = getFilteredHistory();
    }

    // Apply driver filter
    if (selectedDriverFilter && isAggregated) {
      dataToSummarize = dataToSummarize.filter(
        (d) => d.transporterId === selectedDriverFilter.transporterId
      );
    }

    if (dataToSummarize.length === 0) return null;

    let totalStops = 0;
    let totalPackages = 0;
    let avgPace = 0;
    let netMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalUndertimeMinutes = 0;

    if (isAggregated) {
      totalStops = dataToSummarize.reduce(
        (sum, r) => sum + (r.totalStops || 0),
        0
      );
      totalPackages = dataToSummarize.reduce(
        (sum, r) => sum + (r.totalPackages || 0),
        0
      );
      // Weighted average for pace? Or simple average of averages? Simple average for now.
      avgPace = (
        dataToSummarize.reduce((sum, r) => sum + (r.avgPace || 0), 0) /
        dataToSummarize.length
      ).toFixed(2);

      dataToSummarize.forEach((r) => {
        const minutes = r.targetDiff || 0;
        netMinutes += minutes;
        if (minutes > 0) totalOvertimeMinutes += minutes;
        else totalUndertimeMinutes += Math.abs(minutes);
      });
    } else {
      totalStops = dataToSummarize.reduce(
        (sum, r) => sum + (r.stopsComplete || 0),
        0
      );
      totalPackages = dataToSummarize.reduce(
        (sum, r) => sum + (r.totalPackages || 0),
        0
      );
      avgPace =
        dataToSummarize.length > 0
          ? (
              dataToSummarize.reduce((sum, r) => sum + (r.avgPace || 0), 0) /
              dataToSummarize.length
            ).toFixed(2)
          : 0;

      dataToSummarize.forEach((r) => {
        const minutes = getTargetMinutes(r.signOut);
        netMinutes += minutes;
        if (minutes > 0) {
          totalOvertimeMinutes += minutes;
        } else {
          totalUndertimeMinutes += Math.abs(minutes);
        }
      });
    }

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
      netMinutes >= 0
        ? "bg-red-50 border-red-100"
        : "bg-blue-50 border-blue-100";

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
          <div className="text-xl font-bold text-blue-700">
            {totalUndertime}
          </div>
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

  const leftPanelContent = (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {timeRange === "year" && currentPeriodStart?.getFullYear()}
          {timeRange === "month" &&
            currentPeriodStart?.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          {timeRange === "week" &&
            currentPeriodStart &&
            `Week ${getWeekNumber(currentPeriodStart)}`}
          {timeRange === "day" &&
            currentPeriodStart?.toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
            })}
          {!currentPeriodStart && "Navigation"}
        </h2>
      </div>
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {renderList()}
      </div>
    </>
  );

  const summaryContent = (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{getTitle()}</h2>
        {selectedDriverFilter && (
          <button
            onClick={() => setSelectedDriverFilter(null)}
            className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
            View all drivers
          </button>
        )}
      </div>

      {(selectedItem || viewMode === "dates" || viewMode === "rescues") && (
        <CalendarNavigation
          viewMode={timeRange === "all" ? "year" : timeRange}
          currentDate={currentPeriodStart || new Date()}
          onDateSelect={(date, mode) => {
            setCurrentPeriodStart(date);
            setTimeRange(mode);
          }}
          onViewChange={(mode) => setTimeRange(mode)}
          onNavigate={(direction) => {
            if (direction === -1) handlePrevPeriod();
            else handleNextPeriod();
          }}
          data={getFilteredHistory()}
          targetClockOutTime={targetClockOutTime}
        />
      )}

      {renderSummary()}
    </>
  );

  const rightPanelContent = (
    <>
      <div className="flex gap-4 mb-4 border-b items-center">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "table"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("table")}
        >
          Table
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "graph"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("graph")}
        >
          Graph
        </button>
        {selectedDriverFilter && (
          <div className="ml-auto py-2 px-4 font-medium">
            <button
              onClick={() => setSelectedDriverFilter(null)}
              className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
            >
              View all drivers
            </button>
          </div>
        )}
      </div>

      {activeTab === "graph" &&
        selectedItem &&
        (viewMode === "drivers" || viewMode === "routes") &&
        (timeRange === "week" ||
          timeRange === "month" ||
          timeRange === "year" ||
          timeRange === "day") && (
          <MetricsGraph
            data={getFilteredHistory()}
            viewMode={viewMode}
            timeRange={timeRange}
            periodStart={currentPeriodStart}
            targetClockOutTime={targetClockOutTime}
          />
        )}

      {activeTab === "graph" &&
        (viewMode === "dates" || viewMode === "rescues") && (
          <div className="p-8 text-center text-gray-500">
            Graph view is not available for summary views. Please select a
            driver from the list to view their detailed graph.
          </div>
        )}

      {activeTab === "table" &&
        (selectedItem || viewMode === "dates" || viewMode === "rescues") && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200">{renderTableHeaders()}</thead>
              <tbody>{renderTableRows()}</tbody>
            </table>
          </div>
        )}
    </>
  );

  return (
    <div className="p-4">
      <DetailedView
        summary={summaryContent}
        leftPanel={leftPanelContent}
        rightPanel={rightPanelContent}
        gridClass="grid-cols-1 lg:grid-cols-4"
        leftPanelClass="lg:col-span-1"
        rightPanelClass="lg:col-span-3"
      />
    </div>
  );
};

export default History;
