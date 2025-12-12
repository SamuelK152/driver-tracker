import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";

const Scheduling = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);

  // Selected Driver Local State (for editing)
  const [scheduleDays, setScheduleDays] = useState([]);
  const [manualDates, setManualDates] = useState([]);
  const [excludedDates, setExcludedDates] = useState([]);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Sync local state when selected driver changes
  useEffect(() => {
    if (selectedDriverId) {
      const driver = drivers.find((d) => d._id === selectedDriverId);
      if (driver) {
        setScheduleDays(driver.schedule?.days || []);
        setManualDates(
          (driver.schedule?.manualDates || []).map((d) => new Date(d))
        );
        setExcludedDates(
          (driver.schedule?.excludedDates || []).map((d) => new Date(d))
        );
      }
    }
  }, [selectedDriverId, drivers]);

  const fetchDrivers = async () => {
    try {
      const res = await apiClient.get("/api/driver-profiles");
      setDrivers(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching drivers", error);
      setLoading(false);
    }
  };

  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Check if a specific driver object is working on a date
  const checkDriverSchedule = (driver, date) => {
    if (!driver.schedule) return false;
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    // Parse dates from driver object (strings from JSON)
    const mDates = (driver.schedule.manualDates || []).map((d) => new Date(d));
    const eDates = (driver.schedule.excludedDates || []).map(
      (d) => new Date(d)
    );
    const days = driver.schedule.days || [];

    const isManual = mDates.some((d) => isSameDay(d, date));
    const isExcluded = eDates.some((d) => isSameDay(d, date));
    const isPreset = days.includes(dayName);

    if (isManual) return true;
    if (isExcluded) return false;
    return isPreset;
  };

  // Check local state (for the driver currently being edited)
  const isSelectedDriverWorking = (date) => {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const isPreset = scheduleDays.includes(dayName);
    const isManual = manualDates.some((d) => isSameDay(d, date));
    const isExcluded = excludedDates.some((d) => isSameDay(d, date));

    if (isManual) return true;
    if (isExcluded) return false;
    return isPreset;
  };

  const handleDayClick = (date) => {
    if (!selectedDriverId) return;

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const isPreset = scheduleDays.includes(dayName);
    const isManual = manualDates.some((d) => isSameDay(d, date));
    const isExcluded = excludedDates.some((d) => isSameDay(d, date));

    if (isSelectedDriverWorking(date)) {
      // Turn OFF
      if (isManual) {
        setManualDates(manualDates.filter((d) => !isSameDay(d, date)));
      } else if (isPreset && !isExcluded) {
        setExcludedDates([...excludedDates, date]);
      }
    } else {
      // Turn ON
      if (isExcluded) {
        setExcludedDates(excludedDates.filter((d) => !isSameDay(d, date)));
      } else if (!isPreset) {
        setManualDates([...manualDates, date]);
      }
    }
  };

  const handlePresetChange = (day) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter((d) => d !== day));
    } else {
      setScheduleDays([...scheduleDays, day]);
    }
  };

  const handleSave = async () => {
    if (!selectedDriverId) return;
    setSaving(true);
    try {
      const driver = drivers.find((d) => d._id === selectedDriverId);
      const updatedDriver = {
        ...driver,
        schedule: {
          ...driver.schedule,
          days: scheduleDays,
          manualDates: manualDates,
          excludedDates: excludedDates,
        },
      };

      await apiClient.post("/api/driver-profiles", updatedDriver);

      // Update local drivers list to reflect changes immediately in Overview
      const updatedDrivers = drivers.map((d) =>
        d._id === selectedDriverId
          ? {
              ...d,
              schedule: {
                ...d.schedule,
                days: scheduleDays,
                manualDates: manualDates.map((date) => date.toISOString()),
                excludedDates: excludedDates.map((date) => date.toISOString()),
              },
            }
          : d
      );
      setDrivers(updatedDrivers);
      alert("Schedule saved successfully!");
    } catch (error) {
      console.error("Error saving schedule", error);
      alert("Error saving schedule");
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const blanks = Array(firstDayOfMonth).fill(null);
    const allCells = [...blanks, ...daysInMonth];

    return (
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="font-bold text-center text-gray-600 py-2">
            {d}
          </div>
        ))}
        {allCells.map((date, index) => {
          if (!date)
            return (
              <div
                key={`blank-${index}`}
                className="p-4 bg-gray-50 rounded"
              ></div>
            );

          if (selectedDriverId) {
            // Single Driver View
            const working = isSelectedDriverWorking(date);
            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                className={`min-h-[80px] p-2 border rounded cursor-pointer flex flex-col items-center justify-center transition-colors ${
                  working
                    ? "bg-green-100 border-green-500"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{date.getDate()}</span>
                <input
                  type="checkbox"
                  checked={working}
                  readOnly
                  className="mt-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            );
          } else {
            // Overview View
            const workingDrivers = drivers.filter((d) =>
              checkDriverSchedule(d, date)
            );
            const count = workingDrivers.length;
            return (
              <div
                key={date.toISOString()}
                onClick={() =>
                  setSelectedDateDetails({
                    date: date,
                    drivers: workingDrivers,
                  })
                }
                className="min-h-[80px] p-2 border rounded bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-gray-500">
                  {date.getDate()}
                </span>
                <div className="mt-1 text-xl font-bold text-blue-600">
                  {count}
                </div>
                <span className="text-xs text-gray-500">Drivers</span>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Sidebar: Driver List */}
      <div className="w-1/4 bg-white border-r overflow-y-auto p-4">
        <h2 className="text-xl font-bold mb-4">Drivers</h2>
        <div
          className={`p-3 mb-2 rounded cursor-pointer hover:bg-gray-100 ${
            !selectedDriverId ? "bg-blue-50 border-blue-200 border" : ""
          }`}
          onClick={() => setSelectedDriverId(null)}
        >
          <span className="font-medium">Overview</span>
        </div>
        <div className="space-y-1">
          {drivers.map((driver) => (
            <div
              key={driver._id}
              onClick={() => setSelectedDriverId(driver._id)}
              className={`p-3 rounded cursor-pointer hover:bg-gray-100 ${
                selectedDriverId === driver._id
                  ? "bg-blue-100 border-blue-300 border"
                  : ""
              }`}
            >
              <div className="font-medium">{driver.name}</div>
              <div className="text-xs text-gray-500">
                {driver.transporterId}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content: Calendar */}
      <div className="w-3/4 p-6 overflow-y-auto relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {selectedDriverId
              ? `Schedule: ${
                  drivers.find((d) => d._id === selectedDriverId)?.name
                }`
              : "Schedule Overview"}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => changeMonth(-1)}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              &lt;
            </button>
            <span className="text-lg font-medium w-32 text-center">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              &gt;
            </button>
          </div>
        </div>

        {selectedDriverId && (
          <div className="bg-gray-50 p-4 rounded mb-6 border">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Weekly Recurring Schedule
            </h3>
            <div className="flex flex-wrap gap-4">
              {daysOfWeek.map((day) => (
                <label
                  key={day}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={scheduleDays.includes(day)}
                    onChange={() => handlePresetChange(day)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {renderCalendar()}

        {selectedDriverId && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 shadow"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Date Details Modal */}
        {selectedDateDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {selectedDateDetails.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDateDetails(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Scheduled Drivers ({selectedDateDetails.drivers.length})
                </h4>
                {selectedDateDetails.drivers.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {selectedDateDetails.drivers.map((d) => (
                      <li
                        key={d._id}
                        className="py-2 flex justify-between items-center"
                      >
                        <span>{d.name}</span>
                        <span className="text-xs text-gray-500">
                          {d.transporterId}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No drivers scheduled.</p>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedDateDetails(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduling;
