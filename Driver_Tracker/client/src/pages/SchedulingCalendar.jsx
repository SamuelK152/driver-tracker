import React, { useState, useEffect, useMemo } from "react";
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

// --- Modal Component ---
const DayDetailsModal = ({
  date,
  onClose,
  drivers,
  vans,
  equipment,
  schedule,
  onSave,
  customPositions,
}) => {
  const [activeTab, setActiveTab] = useState("roster");
  const [roster, setRoster] = useState([]);
  const [requirements, setRequirements] = useState({});
  const [assignments, setAssignments] = useState([]);

  // Initialize state based on schedule or defaults
  useEffect(() => {
    if (!drivers.length) return;

    const dayName = getDayName(date);

    if (schedule) {
      // Existing schedule: Merge drivers with schedule roster
      const initialRoster = drivers.map((d) => {
        const scheduled = schedule.roster.find((r) => {
          const rId = r.driverId?._id || r.driverId;
          return rId === d._id;
        });
        return {
          driverId: d._id,
          name: d.name,
          priority: d.priority,
          isWorking: !!scheduled,
          position: scheduled?.position || "Driver",
        };
      });
      setRoster(initialRoster);
      setRequirements(schedule.requirements || {});
      setAssignments(schedule.assignments || []);
    } else {
      // New schedule: Use recurring schedule from Driver model
      const initialRoster = drivers.map((d) => {
        const isWorking = d.schedule?.days?.includes(dayName);
        return {
          driverId: d._id,
          name: d.name,
          priority: d.priority,
          isWorking: !!isWorking,
          position: "Driver",
        };
      });
      setRoster(initialRoster);
      setRequirements({});
      setAssignments([]);
    }
  }, [date, drivers, schedule]);

  const handleSave = () => {
    const payload = {
      date: date,
      roster: roster
        .filter((r) => r.isWorking)
        .map(({ driverId, position }) => ({ driverId, position })),
      requirements,
      assignments,
    };
    onSave(payload);
  };

  const handleAutoAssign = () => {
    // 1. Get working drivers and sort by priority
    let workingDrivers = roster
      .filter((r) => r.isWorking)
      .map((r) => {
        const fullDriver = drivers.find((d) => d._id === r.driverId);
        return { ...r, ...fullDriver };
      })
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));

    let availableVans = [...vans];
    let availablePhones = equipment.filter(
      (e) => e.type === "Phone" || e.type === "Tablet"
    );
    const newAssignments = [];

    // Flatten requirements into a list of needed slots
    const neededSlots = [];
    Object.entries(requirements).forEach(([type, count]) => {
      for (let i = 0; i < count; i++) neededSlots.push(type);
    });

    const assignedDriverIds = new Set();
    const assignedVanIds = new Set();

    const assign = (driver, van, slotIndex) => {
      newAssignments.push({
        driverId: driver._id,
        vanId: van._id,
        phoneId: null,
      });
      assignedDriverIds.add(driver._id);
      assignedVanIds.add(van._id);
      neededSlots.splice(slotIndex, 1);

      workingDrivers = workingDrivers.filter((d) => d._id !== driver._id);
      availableVans = availableVans.filter((v) => v._id !== van._id);
    };

    // Pass 1: Preferred Vans
    for (const driver of [...workingDrivers]) {
      if (assignedDriverIds.has(driver._id)) continue;

      if (driver.preferredVans && driver.preferredVans.length > 0) {
        for (const vanId of driver.preferredVans) {
          const pVanId = typeof vanId === "object" ? vanId._id : vanId;
          const van = availableVans.find((v) => v._id === pVanId);

          if (van && !assignedVanIds.has(van._id)) {
            const slotIndex = neededSlots.indexOf(van.serviceType);
            if (slotIndex !== -1) {
              assign(driver, van, slotIndex);
              break;
            }
          }
        }
      }
    }

    // Pass 2: Preferred Service Types
    for (const driver of [...workingDrivers]) {
      if (assignedDriverIds.has(driver._id)) continue;

      if (
        driver.preferredServiceTypes &&
        driver.preferredServiceTypes.length > 0
      ) {
        for (const type of driver.preferredServiceTypes) {
          const slotIndex = neededSlots.indexOf(type);
          if (slotIndex !== -1) {
            const van = availableVans.find((v) => v.serviceType === type);
            if (van) {
              assign(driver, van, slotIndex);
              break;
            }
          }
        }
      }
    }

    // Pass 3: Random / Remaining
    while (neededSlots.length > 0 && workingDrivers.length > 0) {
      const type = neededSlots[0];
      const driver = workingDrivers[0];

      const van = availableVans.find((v) => v.serviceType === type);

      if (van) {
        assign(driver, van, 0);
      } else {
        neededSlots.shift(); // Skip if no van available
      }
    }

    // 4. Assign Phones
    newAssignments.forEach((assignment) => {
      const driver = drivers.find((d) => d._id === assignment.driverId);
      let phone = null;

      if (driver.preferredEquipment && driver.preferredEquipment.length > 0) {
        for (const pId of driver.preferredEquipment) {
          const pEqId = typeof pId === "object" ? pId._id : pId;
          phone = availablePhones.find((p) => p._id === pEqId);
          if (phone) break;
        }
      }

      if (!phone && availablePhones.length > 0) {
        phone = availablePhones[0];
      }

      if (phone) {
        assignment.phoneId = phone._id;
        availablePhones = availablePhones.filter((p) => p._id !== phone._id);
      }
    });

    setAssignments(newAssignments);
  };

  const uniqueServiceTypes = useMemo(() => {
    const types = new Set(vans.map((v) => v.serviceType));
    return Array.from(types);
  }, [vans]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Schedule for {date.toDateString()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${
              activeTab === "roster"
                ? "border-b-2 border-blue-500 font-bold"
                : ""
            }`}
            onClick={() => setActiveTab("roster")}
          >
            Roster
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "requirements"
                ? "border-b-2 border-blue-500 font-bold"
                : ""
            }`}
            onClick={() => setActiveTab("requirements")}
          >
            Requirements
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "assignments"
                ? "border-b-2 border-blue-500 font-bold"
                : ""
            }`}
            onClick={() => setActiveTab("assignments")}
          >
            Assignments
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "roster" && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 font-bold mb-2">
                <span>Name</span>
                <span>Working?</span>
                <span>Position</span>
              </div>
              {roster.map((item, idx) => (
                <div
                  key={item.driverId}
                  className="grid grid-cols-3 items-center gap-2 border-b py-1"
                >
                  <span>{item.name}</span>
                  <input
                    type="checkbox"
                    checked={item.isWorking}
                    onChange={(e) => {
                      const newRoster = [...roster];
                      newRoster[idx].isWorking = e.target.checked;
                      setRoster(newRoster);
                    }}
                  />
                  <select
                    className="border rounded p-1"
                    value={item.position}
                    onChange={(e) => {
                      const newRoster = [...roster];
                      newRoster[idx].position = e.target.value;
                      setRoster(newRoster);
                    }}
                    disabled={!item.isWorking}
                  >
                    <option value="Driver">Driver</option>
                    {customPositions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {activeTab === "requirements" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Define how many vans of each type are needed.
              </p>
              {uniqueServiceTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center justify-between max-w-xs"
                >
                  <label className="font-medium">{type}</label>
                  <input
                    type="number"
                    min="0"
                    className="border rounded p-1 w-20"
                    value={requirements[type] || 0}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        [type]: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Assignments</h3>
                <button
                  onClick={handleAutoAssign}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Auto-Assign
                </button>
              </div>

              {/* Warnings */}
              {(() => {
                const warnings = [];
                const totalRequired = Object.values(requirements).reduce(
                  (a, b) => a + b,
                  0
                );
                const workingDriversCount = roster.filter(
                  (r) => r.isWorking
                ).length;
                const availablePhonesCount = equipment.filter(
                  (e) => e.type === "Phone" || e.type === "Tablet"
                ).length;
                const availableVansCount = vans.length;

                if (availableVansCount < totalRequired)
                  warnings.push("Requirement: Not enough vans");
                if (workingDriversCount < totalRequired)
                  warnings.push("Requirement: Not enough drivers");
                if (availablePhonesCount < totalRequired)
                  warnings.push("Requirement: Not enough phones");

                return warnings.length > 0 ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    {warnings.map((w, i) => (
                      <p key={i} className="text-red-700">
                        {w}
                      </p>
                    ))}
                  </div>
                ) : null;
              })()}

              <div className="mt-4">
                <div className="grid grid-cols-3 font-bold border-b pb-2">
                  <span>Driver</span>
                  <span>Van</span>
                  <span>Phone</span>
                </div>
                {assignments.length === 0 ? (
                  <p className="text-gray-500 py-4">No assignments yet.</p>
                ) : (
                  assignments.map((assign, idx) => {
                    const driver = drivers.find(
                      (d) => d._id === assign.driverId
                    );
                    const van = vans.find((v) => v._id === assign.vanId);
                    const phone = equipment.find(
                      (e) => e._id === assign.phoneId
                    );
                    return (
                      <div key={idx} className="grid grid-cols-3 py-2 border-b">
                        <span>{driver?.name || "Unknown"}</span>
                        <span>
                          {van?.vanId || "None"} ({van?.serviceType})
                        </span>
                        <span>
                          {phone?.type === "Phone" ? "Phone" : phone?.type}{" "}
                          {phone?.serialNumber || ""}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const SchedulingCalendar = () => {
  const { get, post } = useApi();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [drivers, setDrivers] = useState([]);
  const [vans, setVans] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [customPositions, setCustomPositions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversRes, vansRes, equipmentRes, configRes] =
          await Promise.all([
            get("/api/driver-profiles"),
            get("/api/vans"),
            get("/api/equipment"),
            get("/api/config/customPositions"),
          ]);
        setDrivers(driversRes);
        setVans(vansRes);
        setEquipment(equipmentRes);
        setCustomPositions(configRes || []);
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
        // Assuming API supports date range filtering
        const res = await get(`/api/schedules?start=${start}&end=${end}`);
        setSchedules(res);
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
    setSelectedDate(date);
  };

  const handleSaveSchedule = async (payload) => {
    try {
      await post("/api/schedules", payload);
      // Refresh schedules
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0).toISOString();
      const res = await get(`/api/schedules?start=${start}&end=${end}`);
      setSchedules(res);
      setSelectedDate(null);
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("Failed to save schedule");
    }
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
      // Note: Date comparison needs to be careful with timezones.
      // Assuming API returns ISO strings, we match YYYY-MM-DD.
      const schedule = schedules.find((s) => s.date.startsWith(dateStr));

      let workingCount = 0;
      if (schedule) {
        workingCount = schedule.roster.length; // Assuming roster only contains working people or we filter?
        // The model says roster is [{driverId, position}].
        // If they are in the roster, they are working.
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

  const currentSchedule = selectedDate
    ? schedules.find((s) => s.date.startsWith(formatDate(selectedDate)))
    : null;

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

      {selectedDate && (
        <DayDetailsModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          drivers={drivers}
          vans={vans}
          equipment={equipment}
          schedule={currentSchedule}
          onSave={handleSaveSchedule}
          customPositions={customPositions}
        />
      )}
    </PageShell>
  );
};

export default SchedulingCalendar;
