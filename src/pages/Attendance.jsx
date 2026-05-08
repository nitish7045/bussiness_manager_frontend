import { useEffect, useState } from "react";
import API from "../api/api";

export default function Attendance() {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedWorkerIndex, setSelectedWorkerIndex] = useState(-1);
  const [attendance, setAttendance] = useState({});
  const [overtime, setOvertime] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ present: 0, absent: 0, halfday: 0, holiday: 0, presentOnSunday: 0, totalPresent: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [markedStatus, setMarkedStatus] = useState({});
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  // Add this state at the top with your other states
  const [showDropdown, setShowDropdown] = useState(false);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(year, month);

  const formatDate = (year, month, day) => {
    const yearStr = year;
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}`;
  };

  const getCurrentDateStr = () => {
    return formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await API.get("/employees");
      const workersData = res.data.data || res.data;
      const activeWorkers = Array.isArray(workersData)
        ? workersData.filter(worker => worker.status === "active")
        : [];
      setWorkers(activeWorkers);

      await fetchAllWorkersMarkingStatus(activeWorkers);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const fetchAllWorkersMarkingStatus = async (workersList) => {
    try {
      const currentDate = getCurrentDateStr();
      const statusMap = {};

      for (const worker of workersList) {
        try {
          const res = await API.get(
            `/attendance?workerId=${worker._id}&month=${month}&year=${year}`
          );
          const attendanceData = res.data.data || res.data;
          const todayRecord = attendanceData.find(a => a.date === currentDate);
          statusMap[worker._id] = todayRecord ? "marked" : "pending";
          if (todayRecord) {
            statusMap[`${worker._id}_status`] = todayRecord.status;
          }
        } catch (err) {
          statusMap[worker._id] = "pending";
        }
      }
      setMarkedStatus(statusMap);
    } catch (error) {
      console.error("Error fetching marking status:", error);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedWorker) return;

    setLoading(true);
    try {
      const res = await API.get(
        `/attendance?workerId=${selectedWorker}&month=${month}&year=${year}`
      );

      const map = {};
      const otMap = {};
      const attendanceData = res.data.data || res.data;

      let presentCount = 0, absentCount = 0, halfdayCount = 0, holidayCount = 0;
      let presentOnSundayCount = 0;

      attendanceData.forEach(a => {
        const dateStr = a.date;
        const day = parseInt(dateStr.split('-')[2]);
        map[day] = a.status;
        otMap[day] = a.overtimeHours || "";

        // Check if this date is a Sunday
        const date = new Date(year, month - 1, day);
        const isSunday = date.getDay() === 0;

        switch (a.status) {
          case 'present':
            presentCount++;
            if (isSunday) presentOnSundayCount++;
            break;
          case 'absent':
            absentCount++;
            break;
          case 'halfday':
            halfdayCount++;
            break;
          case 'holiday':
            // Don't count holiday if it's on Sunday
            if (!isSunday) {
              holidayCount++;
            }
            if (isSunday) presentOnSundayCount++;
            break;
        }
      });

      setAttendance(map);
      setOvertime(otMap);
      setStats({
        present: presentCount,
        absent: absentCount,
        halfday: halfdayCount,
        holiday: holidayCount,
        presentOnSunday: presentOnSundayCount,
        totalPresent: presentCount + presentOnSundayCount + holidayCount
      });
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedWorker, month, year]);

  const markAttendance = async (day, status) => {
    if (!selectedWorker) {
      alert("Please select a worker");
      return;
    }

    setLoading(true);
    const dateStr = formatDate(year, month, day);

    try {
      await API.post("/attendance/add", {
        workerId: selectedWorker,
        date: dateStr,
        status: status,
        overtimeHours: Number(overtime[day] || 0)
      });

      await fetchAttendance();
      await fetchAllWorkersMarkingStatus(workers);
    } catch (error) {
      if (error.response?.status === 400 || error.response?.data?.msg?.includes("already")) {
        try {
          await API.put("/attendance/update", {
            workerId: selectedWorker,
            date: dateStr,
            status: status,
            overtimeHours: Number(overtime[day] || 0)
          });
          await fetchAttendance();
          await fetchAllWorkersMarkingStatus(workers);
        } catch (updateError) {
          alert("Error updating attendance");
        }
      } else {
        alert(error.response?.data?.msg || "Error marking attendance");
      }
    } finally {
      setLoading(false);
    }
  };

  // Unmark attendance for a specific worker on a specific day
  const unmarkAttendance = async (day) => {
    if (!selectedWorker) {
      alert("Please select a worker");
      return;
    }

    if (!attendance[day]) {
      alert("No attendance record to unmark for this day");
      return;
    }

    setLoading(true);
    const dateStr = formatDate(year, month, day);

    try {
      await API.delete(`/attendance/${selectedWorker}/${dateStr}`);

      await fetchAttendance();
      await fetchAllWorkersMarkingStatus(workers);

      alert(`Attendance unmarked for day ${day}`);
    } catch (error) {
      console.error("Error unmarking attendance:", error);
      alert("Error unmarking attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Mark ALL workers for a specific date
  const markAllWorkersForDate = async (status, dateStr = null) => {
    const targetDate = dateStr || getCurrentDateStr();
    const dateLabel = new Date(targetDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const activeWorkers = workers.filter(w => w.status === "active");

    if (activeWorkers.length === 0) {
      alert("No active workers to mark");
      return;
    }

    if (!window.confirm(`Mark ALL ${activeWorkers.length} active workers as ${status} for ${dateLabel}?`)) {
      return;
    }

    setBulkActionLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const worker of activeWorkers) {
        try {
          await API.post("/attendance/add", {
            workerId: worker._id,
            date: targetDate,
            status: status,
            overtimeHours: 0
          }).catch(async (error) => {
            if (error.response?.status === 400 || error.response?.data?.msg?.includes("already")) {
              await API.put("/attendance/update", {
                workerId: worker._id,
                date: targetDate,
                status: status,
                overtimeHours: 0
              });
            } else {
              throw error;
            }
          });
          successCount++;
        } catch (err) {
          console.error(`Error marking ${worker.name}:`, err);
          failCount++;
        }
      }

      await fetchWorkers();
      if (selectedWorker) {
        await fetchAttendance();
      }

      alert(`✅ Marked ${successCount} active workers as ${status}\n❌ Failed: ${failCount}`);
    } catch (error) {
      console.error("Error in bulk marking:", error);
      alert("Error in bulk marking. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Unmark ALL workers for current date
  const unmarkAllWorkersForDate = async (dateStr = null) => {
    const targetDate = dateStr || getCurrentDateStr();
    const dateLabel = new Date(targetDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const activeWorkers = workers.filter(w => w.status === "active");
    const workersWithAttendance = activeWorkers.filter(w => markedStatus[w._id] === "marked");

    if (workersWithAttendance.length === 0) {
      alert("No attendance records to unmark for this date");
      return;
    }

    if (!window.confirm(`Unmark attendance for ${workersWithAttendance.length} workers for ${dateLabel}?`)) {
      return;
    }

    setBulkActionLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const worker of workersWithAttendance) {
        try {
          await API.delete(`/attendance/${worker._id}/${targetDate}`);
          successCount++;
        } catch (err) {
          console.error(`Error unmarking ${worker.name}:`, err);
          failCount++;
        }
      }

      await fetchWorkers();
      if (selectedWorker) {
        await fetchAttendance();
      }

      alert(`✅ Unmarked ${successCount} workers\n❌ Failed: ${failCount}`);
    } catch (error) {
      console.error("Error in bulk unmarking:", error);
      alert("Error in bulk unmarking. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Mark ALL days for a specific worker
  const markAllDaysForWorker = async (status) => {
    if (!selectedWorker) {
      alert("Please select a worker");
      return;
    }

    const selectedWorkerData = workers.find(w => w._id === selectedWorker);
    if (!selectedWorkerData || selectedWorkerData.status !== "active") {
      alert("This worker is not active. Please select an active worker.");
      return;
    }

    if (!window.confirm(`Mark all days in ${monthNames[month - 1]} ${year} as ${status} for ${selectedWorkerData.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDate(year, month, day);
        await API.post("/attendance/add", {
          workerId: selectedWorker,
          date: dateStr,
          status: status,
          overtimeHours: Number(overtime[day] || 0)
        }).catch(async (error) => {
          if (error.response?.status === 400 || error.response?.data?.msg?.includes("already")) {
            await API.put("/attendance/update", {
              workerId: selectedWorker,
              date: dateStr,
              status: status,
              overtimeHours: Number(overtime[day] || 0)
            });
          }
        });
      }
      await fetchAttendance();
      alert(`All days marked as ${status} for ${selectedWorkerData.name}`);
    } catch (error) {
      console.error("Error marking all days:", error);
      alert("Error marking all days");
    } finally {
      setLoading(false);
    }
  };

  // Unmark ALL days for a specific worker
  const unmarkAllDaysForWorker = async () => {
    if (!selectedWorker) {
      alert("Please select a worker");
      return;
    }

    const selectedWorkerData = workers.find(w => w._id === selectedWorker);
    if (!selectedWorkerData) {
      alert("Worker not found");
      return;
    }

    const markedDays = Object.keys(attendance).filter(day => attendance[day]);

    if (markedDays.length === 0) {
      alert("No attendance records to unmark for this worker this month");
      return;
    }

    if (!window.confirm(`Unmark all ${markedDays.length} attendance records for ${selectedWorkerData.name} in ${monthNames[month - 1]} ${year}?`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const day of markedDays) {
        const dateStr = formatDate(year, month, parseInt(day));
        try {
          await API.delete(`/attendance/${selectedWorker}/${dateStr}`);
          successCount++;
        } catch (err) {
          console.error(`Error unmarking day ${day}:`, err);
          failCount++;
        }
      }
      await fetchAttendance();
      alert(`✅ Unmarked ${successCount} days\n❌ Failed: ${failCount}`);
    } catch (error) {
      console.error("Error unmarking all days:", error);
      alert("Error unmarking all days");
    } finally {
      setLoading(false);
    }
  };

  const updateOvertime = async (day, value) => {
    setOvertime({ ...overtime, [day]: value });
    if (!selectedWorker) return;

    const dateStr = formatDate(year, month, day);

    try {
      await API.put("/attendance/update", {
        workerId: selectedWorker,
        date: dateStr,
        status: attendance[day] || "present",
        overtimeHours: Number(value || 0)
      });
    } catch (error) {
      if (error.response?.status === 404) {
        await API.post("/attendance/add", {
          workerId: selectedWorker,
          date: dateStr,
          status: "present",
          overtimeHours: Number(value || 0)
        });
        await fetchAttendance();
      }
    }
  };

  const handleNextWorker = () => {
    const activeWorkers = workers.filter(w => w.status === "active");
    const currentActiveIndex = activeWorkers.findIndex(w => w._id === selectedWorker);

    if (currentActiveIndex < activeWorkers.length - 1) {
      const nextWorker = activeWorkers[currentActiveIndex + 1];
      const globalIndex = workers.findIndex(w => w._id === nextWorker._id);
      setSelectedWorkerIndex(globalIndex);
      setSelectedWorker(nextWorker._id);
    } else {
      alert("This is the last active worker");
    }
  };

  const handlePrevWorker = () => {
    const activeWorkers = workers.filter(w => w.status === "active");
    const currentActiveIndex = activeWorkers.findIndex(w => w._id === selectedWorker);

    if (currentActiveIndex > 0) {
      const prevWorker = activeWorkers[currentActiveIndex - 1];
      const globalIndex = workers.findIndex(w => w._id === prevWorker._id);
      setSelectedWorkerIndex(globalIndex);
      setSelectedWorker(prevWorker._id);
    } else {
      alert("This is the first active worker");
    }
  };

  const getStatusClass = (status, day) => {
    const isSunday = new Date(year, month - 1, day).getDay() === 0;
    if (isSunday) return "bg-purple-50 border-purple-200";

    switch (status) {
      case "present": return "bg-green-50 border-green-200";
      case "absent": return "bg-red-50 border-red-200";
      case "halfday": return "bg-yellow-50 border-yellow-200";
      case "holiday": return "bg-blue-50 border-blue-200";
      default: return "bg-white border-gray-200";
    }
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const firstDay = getFirstDayOfMonth(year, month);

  const generateCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const days = generateCalendarDays();

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const filteredWorkers = workers.filter(w =>
    w.status === "active" && (
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.designation.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const isCurrentMonth = month === new Date().getMonth() + 1 && year === new Date().getFullYear();

  const activeWorkersCount = workers.filter(w => w.status === "active").length;
  const markedWorkersCount = Object.values(markedStatus).filter(s => s === "marked").length;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* <div className="max-w-7xl mx-auto"> */}
      <div className="w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-sm text-gray-500">Track worker attendance</p>
        </div>

        {/* Controls Row */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Worker Selection with Search */}
            {/* // Then replace your worker selection section with this: */}
            {/* Worker Selection with Search - Shows list on click */}
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Worker</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or click to see workers..."
                  value={searchTerm}
                  onFocus={() => {
                    setShowDropdown(true);
                  }}
                  onBlur={() => {
                    // Delay hiding to allow click on dropdown items
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);
                    setShowDropdown(true);

                    const filtered = workers.filter(w =>
                      w.status === "active" && (
                        w.name.toLowerCase().includes(value.toLowerCase()) ||
                        w.designation.toLowerCase().includes(value.toLowerCase())
                      )
                    );

                    if (filtered.length === 1 && value !== "") {
                      const firstWorker = filtered[0];
                      const index = workers.findIndex(w => w._id === firstWorker._id);
                      setSelectedWorker(firstWorker._id);
                      setSelectedWorkerIndex(index);
                      setSearchTerm("");
                      setShowDropdown(false);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 mb-1"
                />

                {/* Dropdown - controlled by showDropdown state */}
                {showDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                    {filteredWorkers.length > 0 ? (
                      filteredWorkers.map((w) => (
                        <div
                          key={w._id}
                          onClick={() => {
                            const index = workers.findIndex(worker => worker._id === w._id);
                            setSelectedWorker(w._id);
                            setSelectedWorkerIndex(index);
                            setSearchTerm("");
                            setShowDropdown(false);
                          }}
                          className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-sm">{w.name}</div>
                          <div className="text-xs text-gray-500">{w.designation}</div>
                          {markedStatus[w._id] === "marked" && (
                            <div className="text-xs text-green-600">
                              ✓ {markedStatus[`${w._id}_status`] || 'marked'} today
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No workers found</div>
                    )}
                  </div>
                )}

                <select
                  onChange={(e) => {
                    const workerId = e.target.value;
                    const index = workers.findIndex(w => w._id === workerId);
                    setSelectedWorker(workerId);
                    setSelectedWorkerIndex(index);
                    setSearchTerm("");
                    setShowDropdown(false);
                  }}
                  value={selectedWorker}
                  className="hidden"
                >
                  <option value="">Select worker</option>
                  {filteredWorkers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} - {w.designation}
                      {markedStatus[w._id] === "marked" && ` ✓ (${markedStatus[`${w._id}_status`] || 'marked'})`}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {activeWorkersCount} active workers | {markedWorkersCount} marked today
              </p>
            </div>

            {/* Navigation Buttons */}
            {selectedWorker && (
              <div className="flex gap-1">
                <button
                  onClick={handlePrevWorker}
                  disabled={selectedWorkerIndex <= 0}
                  className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm disabled:opacity-50"
                  title="Previous Worker"
                >
                  ← Prev
                </button>
                <button
                  onClick={handleNextWorker}
                  disabled={selectedWorkerIndex >= workers.length - 1}
                  className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm disabled:opacity-50"
                  title="Next Worker"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Month Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="px-2 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
                >
                  ←
                </button>

                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="border border-gray-300 rounded-md p-2 text-sm w-24 text-center"
                >
                  {monthNames.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>

                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-20 border border-gray-300 rounded-md p-2 text-sm text-center"
                  min="2020"
                  max="2030"
                />

                <button
                  onClick={handleNextMonth}
                  className="px-2 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions - Mark/Unmark ALL active workers for current date */}
          {isCurrentMonth && activeWorkersCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium mr-2">📅 Today's Bulk Actions:</span>
              <button
                onClick={() => markAllWorkersForDate("present")}
                disabled={bulkActionLoading}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                ✅ Mark All Present
              </button>
              <button
                onClick={() => markAllWorkersForDate("absent")}
                disabled={bulkActionLoading}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                ❌ Mark All Absent
              </button>
              <button
                onClick={() => markAllWorkersForDate("halfday")}
                disabled={bulkActionLoading}
                className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                🌓 Mark All Half Day
              </button>
              <button
                onClick={() => markAllWorkersForDate("holiday")}
                disabled={bulkActionLoading}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                🎉 Mark All Holiday
              </button>
              <button
                onClick={() => unmarkAllWorkersForDate()}
                disabled={bulkActionLoading}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                🗑️ Unmark All Today
              </button>
            </div>
          )}

          {/* Individual Worker Bulk Actions - Mark/Unmark all days for selected worker */}
          {selectedWorker && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium mr-2">👤 Worker Bulk Actions ({monthNames[month - 1]}):</span>
              <button
                onClick={() => markAllDaysForWorker("present")}
                disabled={loading}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                ✅ All Present
              </button>
              <button
                onClick={() => markAllDaysForWorker("absent")}
                disabled={loading}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                ❌ All Absent
              </button>
              <button
                onClick={() => markAllDaysForWorker("halfday")}
                disabled={loading}
                className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                🌓 All Half Day
              </button>
              <button
                onClick={() => markAllDaysForWorker("holiday")}
                disabled={loading}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                🎉 All Holiday
              </button>
              <button
                onClick={() => unmarkAllDaysForWorker()}
                disabled={loading}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                🗑️ Unmark All Days
              </button>
            </div>
          )}

          {/* Stats Row */}
          {selectedWorker && (
            <div className="flex gap-3 mt-3 pt-3 border-t border-gray-200 justify-between items-center">
              <div className="flex gap-2 flex-wrap">
                <div className="text-center px-2">
                  <div className="text-xs text-gray-500">Present</div>
                  <div className="text-lg font-bold text-green-600">{stats.present}</div>
                </div>
                <div className="text-center px-2">
                  <div className="text-xs text-gray-500">Absent</div>
                  <div className="text-lg font-bold text-red-600">{stats.absent}</div>
                </div>
                <div className="text-center px-2 ">
                  <div className="text-xs text-gray-500">Sunday</div>
                  <div className="text-lg font-bold text-purple-600">{stats.presentOnSunday || 0}</div>
                </div>
                <div className="text-center px-2">
                  <div className="text-xs text-gray-500">Holiday</div>
                  <div className="text-lg font-bold text-blue-600">{stats.holiday}</div>
                </div>
                <div className="text-center px-2">
                  <div className="text-xs text-gray-500">Half</div>
                  <div className="text-lg font-bold text-yellow-600">{stats.halfday}</div>
                </div>
                <div className="text-center px-2 border-l-2 border-gray-300">
                  <div className="text-xs text-gray-500">Total Present</div>
                  <div className="text-lg font-bold text-indigo-600">{stats.totalPresent || 0}</div>
                </div>
                <div className="text-center px-2">
                  <div className="text-xs text-gray-500">Total OT</div>
                  <div className="text-lg font-bold text-orange-600">
                    {Object.values(overtime).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {workers[selectedWorkerIndex]?.name} - {selectedWorkerIndex + 1} of {workers.length}
              </div>
            </div>
          )}
        </div>

        {/* Worker Quick Status */}
        {selectedWorker && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-gray-600">Today's Status:</span>
              {workers.filter(w => w.status === "active").map((worker, idx) => {
                const globalIndex = workers.findIndex(w => w._id === worker._id);
                return (
                  <button
                    key={worker._id}
                    onClick={() => {
                      setSelectedWorker(worker._id);
                      setSelectedWorkerIndex(globalIndex);
                    }}
                    className={`px-2 py-1 rounded-full text-xs transition-all ${selectedWorker === worker._id
                        ? 'bg-blue-500 text-white'
                        : markedStatus[worker._id] === "marked"
                          ? `bg-${markedStatus[`${worker._id}_status`] === 'present' ? 'green' : markedStatus[`${worker._id}_status`] === 'absent' ? 'red' : markedStatus[`${worker._id}_status`] === 'halfday' ? 'yellow' : 'blue'}-100 text-${markedStatus[`${worker._id}_status`] === 'present' ? 'green' : markedStatus[`${worker._id}_status`] === 'absent' ? 'red' : markedStatus[`${worker._id}_status`] === 'halfday' ? 'yellow' : 'blue'}-700 hover:bg-${markedStatus[`${worker._id}_status`] === 'present' ? 'green' : markedStatus[`${worker._id}_status`] === 'absent' ? 'red' : markedStatus[`${worker._id}_status`] === 'halfday' ? 'yellow' : 'blue'}-200`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {worker.name.split(' ')[0]}
                    {markedStatus[worker._id] === "marked" && " ✓"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar */}
        {selectedWorker ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-800 px-4 py-2">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-white">
                  {monthNames[month - 1]} {year}
                </h2>
                <div className="text-xs text-gray-300">
                  {workers.find(w => w._id === selectedWorker)?.name}
                </div>
              </div>
            </div>

            <div className="p-3">
              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                  <div key={day} className={`text-center text-xs font-semibold py-1 ${idx === 0 ? 'text-red-500' : 'text-gray-600'
                    }`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="p-1 bg-gray-50 rounded"></div>;
                  }

                  const status = attendance[day];
                  const date = new Date(year, month - 1, day);
                  const isSunday = date.getDay() === 0;
                  const isToday = date.toDateString() === new Date().toDateString();
                  const statusClass = getStatusClass(status, day);

                  return (
                    <div
                      key={day}
                      className={`p-1 rounded border ${statusClass} ${isToday ? 'ring-1 ring-blue-400' : ''}`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${isSunday ? 'text-red-500' : 'text-gray-700'}`}>
                        {day}
                      </div>

                      <input
                        type="number"
                        placeholder="OT"
                        value={overtime[day] || ""}
                        onChange={(e) => updateOvertime(day, e.target.value)}
                        className="w-full text-[10px] p-0.5 border rounded mb-1 text-center"
                        step="0.5"
                        min="0"
                        disabled={loading}
                      />

                      <div className="flex gap-0.5">
                        {[
                          { status: "present", label: "P", color: "green" },
                          { status: "absent", label: "A", color: "red" },
                          { status: "halfday", label: "H", color: "yellow" },
                          { status: "holiday", label: "L", color: "blue" }
                        ].map(btn => (
                          <button
                            key={btn.status}
                            onClick={() => markAttendance(day, btn.status)}
                            className={`flex-1 text-[10px] py-0.5 rounded transition-all ${status === btn.status
                                ? `bg-${btn.color}-600 text-white`
                                : `bg-${btn.color}-100 text-${btn.color}-700 hover:bg-${btn.color}-600 hover:text-white`
                              }`}
                            title={btn.status}
                            disabled={loading}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {status && (
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-[9px] font-medium capitalize">
                            {status === 'halfday' ? 'half' : status.substring(0, 3)}
                          </div>
                          <button
                            onClick={() => unmarkAttendance(day)}
                            className="text-[9px] text-red-500 hover:text-red-700"
                            title="Unmark"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-500 text-sm">
              {workers.length === 0
                ? "No active workers available. Please add workers or reactivate inactive ones."
                : "Select a worker to view attendance"}
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {(loading || bulkActionLoading) && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-3 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-700">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}