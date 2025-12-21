import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../lib/useApi";
import PageShell from "../lib/PageShell";

// --- Date Helpers ---
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const formatDate = (date) => date.toISOString().split("T")[0];
const getDayName = (date) =>
  [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][date.getDay()];

// --- Main Component ---
const Scheduling = () => {
  const { get } = useApi();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [drivers, setDrivers] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // Restore date from navigation state if available
  useEffect(() => {
    if (location.state?.date) {
      setCurrentDate(new Date(location.state.date));
    }
  }, [location.state]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeesRes = await get("/api/employees");
        setDrivers(employeesRes);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };
    fetchData();
  }, [get]);

  // Fetch schedules when month changes
  useEffect(() => {
    const fetchSchedules = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0).toISOString();

      try {
        const res = await get(`/api/plans?startDate=${start}&endDate=${end}`);
        // Map roster employeeId to driverId for frontend compatibility
        const mappedSchedules = res.map((plan) => ({
          ...plan,
          roster: plan.roster.map((r) => ({
            ...r,
            driverId: r.employeeId?._id || r.employeeId, // Handle populated or unpopulated
          })),
        }));
        setSchedules(mappedSchedules);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      }
    };
    fetchSchedules();
  }, [currentDate, get]);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDayClick = (day) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );

    // Format as YYYYMMDD using local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayStr = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${dayStr}`;

    // Navigate to the detailed page
    navigate(`/planning/detailed-scheduling/${dateStr}`, {
      state: { date: date.toISOString() },
    });
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-32 border bg-gray-50"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const dayName = getDayName(date);

      // Find schedule for this day
      const schedule = schedules.find((s) => s.date.startsWith(dateStr));

      let workingCount = 0;
      if (schedule) {
        workingCount = schedule.roster.length;
      } else {
        // Calculate from recurring schedule
        workingCount = drivers.filter((d) =>
          d.schedule?.days?.includes(dayName)
        ).length;
      }

      days.push(
        <div
          key={day}
          className="h-32 border p-2 hover:bg-blue-50 cursor-pointer transition-colors relative"
          onClick={() => handleDayClick(day)}
        >
          <div className="font-bold text-right">{day}</div>
          <div className="mt-2">
            <span
              className={`inline-block px-2 py-1 rounded text-sm ${
                schedule
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {workingCount} Drivers
            </span>
          </div>
          {schedule && (
            <div className="absolute bottom-2 right-2 text-xs text-green-600 font-bold">
              Scheduled
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <PageShell title="Scheduling Calendar">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 border rounded hover:bg-gray-100"
          >
            &lt;
          </button>
          <h2 className="text-xl font-bold">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 border rounded hover:bg-gray-100"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0 border-t border-l">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="p-2 text-center font-bold border-r border-b bg-gray-100"
          >
            {d}
          </div>
        ))}
        {renderCalendarDays()}
      </div>
    </PageShell>
  );
};

export default Scheduling;
