import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../lib/useApi";
import PageShell from "../lib/PageShell";
import {
  ArrowLeft,
  Users,
  Truck,
  Smartphone,
  Check,
  X,
  Edit2,
} from "lucide-react";
import apiClient from "../lib/apiClient";

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

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const DetailedScheduling = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { get } = useApi();

  const [currentDate, setCurrentDate] = useState(() => {
    if (date.includes("T")) return new Date(date);
    if (date.includes("-")) {
      const [y, m, d] = date.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    if (date.length === 8) {
      const y = parseInt(date.substring(0, 4));
      const m = parseInt(date.substring(4, 6));
      const d = parseInt(date.substring(6, 8));
      return new Date(y, m - 1, d);
    }
    return new Date(date);
  });
  const [employees, setEmployees] = useState([]);
  const [vans, setVans] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [customPositions, setCustomPositions] = useState([]);
  const [plans, setPlans] = useState([]);

  const [roster, setRoster] = useState([]);
  const [requirements, setRequirements] = useState({});
  const [assignments, setAssignments] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState(null);
  const [tempRequirementCount, setTempRequirementCount] = useState(0);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, vansRes, eqRes, posRes] = await Promise.all([
          get("/api/employees"),
          get("/api/vans"),
          get("/api/equipment"),
          get("/api/config/customPositions").catch(() => []),
        ]);

        // Fetch preferences for each employee
        const driversWithPrefs = await Promise.all(
          empRes.map(async (emp) => {
            try {
              const prefs = await get(`/api/employees/${emp._id}/preferences`);
              return { ...emp, ...prefs };
            } catch (e) {
              return emp;
            }
          })
        );

        setEmployees(driversWithPrefs);
        setVans(vansRes);
        setEquipment(eqRes);
        setCustomPositions(posRes || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [get]);

  // Fetch plans for the month to populate week view stats
  useEffect(() => {
    const fetchPlans = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0).toISOString();
      try {
        const res = await get(`/api/plans?startDate=${start}&endDate=${end}`);
        setPlans(res);
      } catch (err) {
        console.error("Error fetching plans:", err);
      }
    };
    fetchPlans();
  }, [currentDate, get]);

  // --- Initialization ---
  useEffect(() => {
    if (!employees.length) return;

    const dateStr = formatDate(currentDate);
    const plan = plans.find((p) => p.date.startsWith(dateStr));
    const dayName = getDayName(currentDate);

    if (plan) {
      // Use existing plan
      const initialRoster = employees.map((d) => {
        const scheduled = plan.roster.find((r) => {
          const rId =
            r.driverId?._id || r.driverId || r.employeeId?._id || r.employeeId;
          return rId === d._id;
        });
        return {
          driverId: d._id,
          name: d.name,
          priority: d.priority,
          isWorking: !!scheduled,
          position: scheduled?.position || "Driver",
          ...d,
        };
      });
      setRoster(initialRoster);
      setRequirements(plan.requirements || {});
      setAssignments([]); // Reset estimated assignments
    } else {
      // Default from employee schedule
      const initialRoster = employees.map((d) => {
        const isWorking = d.schedule?.days?.includes(dayName);
        return {
          driverId: d._id,
          name: d.name,
          priority: d.priority,
          isWorking: !!isWorking,
          position: "Driver",
          ...d,
        };
      });
      setRoster(initialRoster);
      setRequirements({});
      setAssignments([]);
    }
  }, [currentDate, employees, plans]);

  // --- Derived Data ---
  const uniqueServiceTypes = useMemo(() => {
    if (!vans) return [];
    const types = new Set(
      vans.map((v) => v.serviceTypeId?.name || v.serviceType).filter(Boolean)
    );
    return Array.from(types);
  }, [vans]);

  const weekDates = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  // --- Auto-Assign Logic (Dynamic) ---
  useEffect(() => {
    if (!vans.length || !equipment.length) return;

    let workingDrivers = roster
      .filter((r) => r.isWorking)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));

    let availableVans = [...vans];
    let availablePhones = equipment.filter(
      (e) => e.type === "Phone" || e.type === "Tablet"
    );
    const newAssignments = [];

    const neededSlots = [];
    Object.entries(requirements).forEach(([type, count]) => {
      for (let i = 0; i < count; i++) neededSlots.push(type);
    });

    const assignedDriverIds = new Set();
    const assignedVanIds = new Set();

    const getServiceType = (van) => van.serviceTypeId?.name || van.serviceType;

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
      if (driver.preferredVans?.length > 0) {
        for (const vanId of driver.preferredVans) {
          if (!vanId) continue;
          const pVanId = typeof vanId === "object" ? vanId._id : vanId;
          const van = availableVans.find((v) => v._id === pVanId);
          if (van && !assignedVanIds.has(van._id)) {
            const slotIndex = neededSlots.indexOf(getServiceType(van));
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
      if (driver.preferredServiceTypes?.length > 0) {
        for (const type of driver.preferredServiceTypes) {
          const slotIndex = neededSlots.indexOf(type);
          if (slotIndex !== -1) {
            const van = availableVans.find((v) => getServiceType(v) === type);
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
      const van = availableVans.find((v) => getServiceType(v) === type);
      if (van) {
        assign(driver, van, 0);
      } else {
        neededSlots.shift();
      }
    }

    // 4. Assign Phones
    newAssignments.forEach((assignment) => {
      const driver = roster.find((d) => d._id === assignment.driverId);
      let phone = null;
      if (driver?.preferredEquipment?.length > 0) {
        for (const pId of driver.preferredEquipment) {
          if (!pId) continue;
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
  }, [roster, requirements, vans, equipment]);

  const handleSave = async () => {
    try {
      const payload = {
        date: currentDate,
        roster: roster
          .filter((r) => r.isWorking)
          .map(({ driverId, position }) => ({
            employeeId: driverId,
            position,
            status: "Confirmed",
          })),
        requirements,
      };

      await apiClient.post("/api/plans", payload);
      alert("Schedule saved successfully!");

      // Refresh plans
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0).toISOString();
      const res = await get(`/api/plans?startDate=${start}&endDate=${end}`);
      setPlans(res);
    } catch (error) {
      console.error(error);
      alert("Failed to save schedule.");
    }
  };

  const openServiceTypeModal = (type) => {
    setEditingServiceType(type);
    setTempRequirementCount(requirements[type] || 0);
    setIsModalOpen(true);
  };

  const saveServiceTypeRequirement = () => {
    setRequirements((prev) => ({
      ...prev,
      [editingServiceType]: parseInt(tempRequirementCount) || 0,
    }));
    setIsModalOpen(false);
  };

  // --- Render Helpers ---
  const getDayStats = (date) => {
    const dateStr = formatDate(date);
    const plan = plans.find((p) => p.date.startsWith(dateStr));
    if (plan) {
      const drivers = plan.roster.length;
      const commitment = Object.values(plan.requirements || {}).reduce(
        (a, b) => a + b,
        0
      );
      return { drivers, commitment };
    }
    const dayName = getDayName(date);
    const drivers = employees.filter((e) =>
      e.schedule?.days?.includes(dayName)
    ).length;
    return { drivers, commitment: 0 };
  };

  // --- Alerts Calculation ---
  const alerts = useMemo(() => {
    const totalReqs = Object.values(requirements).reduce((a, b) => a + b, 0);
    const workingDriversCount = roster.filter((r) => r.isWorking).length;
    const availableVansCount = vans.length;
    const availablePhonesCount = equipment.filter(
      (e) => e.type === "Phone" || e.type === "Tablet"
    ).length;

    const list = [];

    if (availableVansCount < totalReqs) {
      list.push({
        type: "error",
        message: `Not enough vans for route requirements: ${availableVansCount}/${totalReqs}`,
      });
    }
    if (availablePhonesCount < totalReqs) {
      list.push({
        type: "error",
        message: `Not enough phones for route requirements: ${availablePhonesCount}/${totalReqs}`,
      });
    }
    if (workingDriversCount < totalReqs) {
      list.push({
        type: "error",
        message: `Not enough drivers for route requirements: ${workingDriversCount}/${totalReqs}`,
      });
    }
    if (workingDriversCount > totalReqs) {
      list.push({
        type: "info",
        message: `Extra Drivers: ${workingDriversCount - totalReqs}`,
      });
    }
    return list;
  }, [requirements, roster, vans, equipment]);

  return (
    <PageShell title="Detailed Scheduling">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() =>
            navigate("/planning/scheduling", {
              state: { date: currentDate.toISOString() },
            })
          }
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Month View
        </button>
        <h2 className="text-2xl font-bold">{currentDate.toDateString()}</h2>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save Changes
        </button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekDates.map((date) => {
          const isSelected = date.toDateString() === currentDate.toDateString();
          const stats = getDayStats(date);
          return (
            <div
              key={date.toISOString()}
              onClick={() => setCurrentDate(date)}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <div className="font-bold text-center mb-2">
                {getDayName(date).slice(0, 3)} {date.getDate()}
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Drivers:</span>
                  <span className="font-medium">{stats.drivers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reqs:</span>
                  <span className="font-medium">{stats.commitment}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals & Requirements */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex items-center space-x-8 mb-4">
          <div>
            <span className="text-gray-500 block text-sm">Total Drivers</span>
            <span className="text-2xl font-bold">
              {roster.filter((r) => r.isWorking).length}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block text-sm">
              Total Requirements
            </span>
            <span className="text-2xl font-bold">
              {Object.values(requirements).reduce((a, b) => a + b, 0)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {uniqueServiceTypes.map((type) => (
            <button
              key={type}
              onClick={() => openServiceTypeModal(type)}
              className={`px-3 py-1 rounded border text-sm flex items-center space-x-2 ${
                requirements[type] > 0
                  ? "bg-blue-100 border-blue-300 text-blue-800"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              <span>{type}</span>
              <span className="font-bold bg-white px-1.5 rounded border">
                {requirements[type] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2 mb-6">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className={`p-3 rounded border ${
              alert.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            {alert.message}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Roster */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Roster
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-12 gap-2 font-bold text-sm text-gray-500 border-b pb-2">
              <div className="col-span-1"></div>
              <div className="col-span-6">Name</div>
              <div className="col-span-5">Position</div>
            </div>
            {roster.map((item, idx) => (
              <div
                key={item.driverId}
                className="grid grid-cols-12 gap-2 items-center py-1 border-b last:border-0"
              >
                <div className="col-span-1 flex justify-center">
                  <input
                    type="checkbox"
                    checked={item.isWorking}
                    onChange={(e) => {
                      const newRoster = [...roster];
                      newRoster[idx].isWorking = e.target.checked;
                      setRoster(newRoster);
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                <div className="col-span-6 truncate font-medium">
                  {item.name}
                </div>
                <div className="col-span-5">
                  <select
                    value={item.position}
                    onChange={(e) => {
                      const newRoster = [...roster];
                      newRoster[idx].position = e.target.value;
                      setRoster(newRoster);
                    }}
                    disabled={!item.isWorking}
                    className="w-full text-sm border rounded p-1"
                  >
                    <option value="Driver">Driver</option>
                    {customPositions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Estimated Assignments */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Estimated Assignments
            </h3>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {assignments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No assignments generated. Ensure drivers are working and
                requirements are set.
              </div>
            ) : (
              assignments.map((assign, idx) => {
                const driver = employees.find((d) => d._id === assign.driverId);
                const van = vans.find((v) => v._id === assign.vanId);
                const phone = equipment.find((e) => e._id === assign.phoneId);
                return (
                  <div
                    key={idx}
                    className="p-3 border rounded bg-gray-50 text-sm"
                  >
                    <div className="font-bold text-gray-900 mb-1">
                      {driver?.name}
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center">
                        <Truck className="w-3 h-3 mr-1" /> {van?.vanId} (
                        {van?.serviceType})
                      </span>
                      <span className="flex items-center">
                        <Smartphone className="w-3 h-3 mr-1" /> {phone?.type}{" "}
                        {phone?.serialNumber}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Service Type Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h3 className="font-bold text-lg mb-4">
              Set Requirements for {editingServiceType}
            </h3>
            <input
              type="number"
              min="0"
              value={tempRequirementCount}
              onChange={(e) => setTempRequirementCount(e.target.value)}
              className="w-full border rounded p-2 mb-4 text-lg"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveServiceTypeRequirement}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default DetailedScheduling;
