// src/components/reports/AttendanceReport.jsx

import React, { useMemo, useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─────────────────────────────────────────────────────────────
// SKELETON LOADING COMPONENTS
// ─────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg p-4">
      <div className="h-3 bg-gray-300 rounded w-12 mx-auto mb-2"></div>
      <div className="h-6 bg-gray-300 rounded w-16 mx-auto"></div>
    </div>
  </div>
);

const SkeletonMatrix = () => (
  <div className="animate-pulse">
    <div className="bg-gray-100 rounded-lg overflow-hidden">
      <div className="h-8 bg-gray-200 w-full mb-2"></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-1 mb-1">
          <div className="h-12 bg-gray-200 rounded w-24"></div>
          {[1, 2, 3, 4, 5, 6, 7].map((j) => (
            <div key={j} className="h-12 bg-gray-200 rounded flex-1"></div>
          ))}
          <div className="h-12 bg-gray-200 rounded w-28"></div>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function getDatesInMonth(year, month) {
  const totalDays = new Date(year, month, 0).getDate();
  return Array.from({ length: totalDays }, (_, i) => {
    return new Date(year, month - 1, i + 1, 12, 0, 0);
  });
}

function getStatusText(status, ot) {
  if (!status) return "-";
  if (status === "present") return ot > 0 ? `P+${ot}` : "P";
  if (status === "halfday") return ot > 0 ? `Half+${ot}` : "Half";
  if (status === "holiday") return "Holi";
  if (status === "absent") return ot > 0 ? `A+${ot}` : "A";
  return "-";
}

function calculateAdvancedTotals(attendance = []) {
  let presentCount = 0;
  let halfdayCount = 0;
  let absentCount = 0;
  let holidayCount = 0;
  let presentOnSundayCount = 0;
  let overtimeTotal = 0;

  attendance.forEach(record => {
    const date = new Date(record.date);
    const isSunday = date.getDay() === 0;
    const status = record.status;
    const ot = record.overtimeHours || 0;

    overtimeTotal += ot;

    switch(status) {
      case 'present':
        presentCount++;
        if (isSunday) presentOnSundayCount++;
        break;
      case 'halfday':
        halfdayCount++;
        break;
      case 'absent':
        absentCount++;
        break;
      case 'holiday':
        if (!isSunday) {
          holidayCount++;
        }
        if (isSunday) {
          presentOnSundayCount++;
        }
        break;
    }
  });

  const totalPresent = presentCount + presentOnSundayCount + holidayCount;

  return {
    present: presentCount,
    halfday: halfdayCount,
    absent: absentCount,
    holiday: holidayCount,
    presentOnSunday: presentOnSundayCount,
    totalPresent: totalPresent,
    overtime: overtimeTotal,
  };
}

function statusStyle(status, ot) {
  if (!status) return {};
  if (status === "present" && ot > 0) return { background: "#ede9fe", color: "#6d28d9", fontWeight: 700 };
  if (status === "present") return { background: "#dcfce7", color: "#15803d", fontWeight: 700 };
  if (status === "halfday") return { background: "#fef3c7", color: "#b45309", fontWeight: 700 };
  if (status === "holiday") return { background: "#dbeafe", color: "#1d4ed8", fontWeight: 700 };
  if (status === "absent" && ot > 0) return { background: "#fecaca", color: "#991b1b", fontWeight: 700 };
  if (status === "absent") return { background: "#fee2e2", color: "#b91c1c", fontWeight: 700 };
  return {};
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const S = {
  root: {
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: 13,
    color: "#111827",
    width: "100%",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  tabGroup: {
    display: "flex",
    gap: 5,
    background: "#f3f4f6",
    padding: 4,
    borderRadius: 8,
  },

  search: {
    padding: "7px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    outline: "none",
    fontSize: 12,
    width: 200,
  },

  cardsBox: {
    background: "#f9fafb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: 10,
    marginTop: 10,
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
  },

  cardLabel: {
    fontSize: 10,
    color: "#9ca3af",
  },

  cardValue: {
    fontSize: 20,
    fontWeight: 700,
    marginTop: 4,
  },

  legendRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 10,
    color: "#6b7280",
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },

  tableContainer: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
  },

  table: {
    borderCollapse: "collapse",
    width: "100%",
    tableLayout: "auto",
    fontSize: 10,
    minWidth: "100%",
  },

  th: {
    background: "#f9fafb",
    fontWeight: 600,
    fontSize: 9,
    color: "#6b7280",
    padding: "4px 2px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },

  thSunday: {
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 600,
    fontSize: 9,
    padding: "4px 2px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },

  thSaturday: {
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 600,
    fontSize: 9,
    padding: "4px 2px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },

  thWorker: {
    background: "#f9fafb",
    fontWeight: 700,
    fontSize: 10,
    color: "#374151",
    padding: "6px 6px",
    border: "1px solid #e5e7eb",
    textAlign: "left",
    width: 130,
    position: "sticky",
    left: 0,
    zIndex: 10,
    backgroundColor: "#f9fafb",
  },

  thSummary: {
    background: "#f9fafb",
    fontWeight: 700,
    fontSize: 10,
    color: "#374151",
    padding: "6px 4px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
    width: 100,
    position: "sticky",
    right: 0,
    zIndex: 10,
    backgroundColor: "#f9fafb",
  },

  tdWorker: {
    padding: "5px 6px",
    border: "1px solid #e5e7eb",
    textAlign: "left",
    background: "#fff",
    width: 130,
    position: "sticky",
    left: 0,
    zIndex: 5,
  },

  tdSummary: {
    padding: "4px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    width: 100,
    position: "sticky",
    right: 0,
    zIndex: 5,
  },

  td: {
    padding: "4px 1px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
    fontSize: 9,
    fontWeight: 600,
  },

  tdSunday: {
    padding: "4px 1px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
    background: "#fee2e2",
    fontSize: 9,
    fontWeight: 600,
  },

  tdSaturday: {
    padding: "4px 1px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
    background: "#eff6ff",
    fontSize: 9,
    fontWeight: 600,
  },

  summaryTable: {
    borderCollapse: "collapse",
    width: "100%",
    fontSize: 12,
  },

  summaryTh: {
    background: "#f9fafb",
    padding: "8px",
    border: "1px solid #e5e7eb",
    fontWeight: 700,
    fontSize: 11,
    color: "#6b7280",
  },

  summaryTd: {
    padding: "8px",
    border: "1px solid #e5e7eb",
  },

  footer: {
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 14,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 12,
  },
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function AttendanceReport({ data = [], month, year, isLoading = false }) {
  const [viewMode, setViewMode] = useState("matrix");
  const [searchTerm, setSearchTerm] = useState("");

  const reportMonth = month || new Date().getMonth() + 1;
  const reportYear = year || new Date().getFullYear();

  useEffect(() => {
    setSearchTerm("");
  }, [reportMonth, reportYear]);

  const dates = useMemo(() => {
    return getDatesInMonth(reportYear, reportMonth);
  }, [reportMonth, reportYear]);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter((worker) => {
      return worker.worker.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm]);

  const allTotals = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        workers: 0,
        present: 0,
        halfday: 0,
        absent: 0,
        holiday: 0,
        presentOnSunday: 0,
        totalPresent: 0,
        overtime: 0,
      };
    }

    let totals = {
      workers: data.length,
      present: 0,
      halfday: 0,
      absent: 0,
      holiday: 0,
      presentOnSunday: 0,
      totalPresent: 0,
      overtime: 0,
    };

    data.forEach((worker) => {
      const workerTotals = calculateAdvancedTotals(worker.attendance || []);
      totals.present += workerTotals.present;
      totals.halfday += workerTotals.halfday;
      totals.absent += workerTotals.absent;
      totals.holiday += workerTotals.holiday;
      totals.presentOnSunday += workerTotals.presentOnSunday;
      totals.totalPresent += workerTotals.totalPresent;
      totals.overtime += workerTotals.overtime;
    });

    return totals;
  }, [data]);

  const TabBtn = ({ id, label }) => {
    const active = viewMode === id;
    return (
      <button
        onClick={() => setViewMode(id)}
        style={{
          padding: "6px 14px",
          borderRadius: 6,
          fontSize: 12,
          cursor: "pointer",
          border: active ? "1px solid #bfdbfe" : "1px solid transparent",
          background: active ? "#fff" : "transparent",
          color: active ? "#2563eb" : "#6b7280",
          fontWeight: active ? 600 : 400,
        }}
      >
        {label}
      </button>
    );
  };

  const renderMatrix = () => {
    return (
      <div style={S.tableContainer}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.thWorker}>Worker</th>
              {dates.map((d, i) => {
                const isSunday = d.getDay() === 0;
                const isSaturday = d.getDay() === 6;
                return (
                  <th
                    key={i}
                    title={FULL_DAY_NAMES[d.getDay()]}
                    style={isSunday ? S.thSunday : isSaturday ? S.thSaturday : S.th}
                  >
                    <div style={{ fontSize: 12, fontWeight: "bold" }}>{d.getDate()}</div>
                    <div style={{ fontSize: 8, marginTop: 1 }}>{DAY_NAMES[d.getDay()]}</div>
                  </th>
                );
              })}
              <th style={S.thSummary}>Summary</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((workerData, index) => {
              const attMap = {};
              (workerData.attendance || []).forEach((a) => {
                const attDate = new Date(a.date);
                attMap[attDate.getDate()] = a;
              });

              const advancedTotals = calculateAdvancedTotals(workerData.attendance || []);

              return (
                <tr key={index}>
                  <td style={S.tdWorker}>
                    <div style={{ fontWeight: 700, fontSize: 11, color: "#111827" }}>
                      {workerData.worker.name}
                    </div>
                    <div style={{ fontSize: 9, color: "#9ca3af" }}>
                      {workerData.worker.designation}
                    </div>
                  </td>

                  {dates.map((d, di) => {
                    const dateNum = d.getDate();
                    const attendance = attMap[dateNum];
                    const isSunday = d.getDay() === 0;
                    const isSaturday = d.getDay() === 6;

                    let cellStyle = isSunday ? { ...S.tdSunday } : isSaturday ? { ...S.tdSaturday } : { ...S.td };

                    if (attendance) {
                      cellStyle = {
                        ...cellStyle,
                        ...statusStyle(attendance.status, attendance.overtimeHours || 0),
                      };
                    }

                    return (
                      <td key={di} style={cellStyle}>
                        {attendance ? getStatusText(attendance.status, attendance.overtimeHours || 0) : "-"}
                      </td>
                    );
                  })}

                  <td style={S.tdSummary}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 9 }}>
                      <span style={{ color: "#15803d" }}>P: <b>{advancedTotals.present}</b></span>
                      <span style={{ color: "#b91c1c" }}>A: <b>{advancedTotals.absent}</b></span>
                      <span style={{ color: "#1d4ed8" }}>Holi: <b>{advancedTotals.holiday}</b></span>
                      <span style={{ color: "#b45309" }}>Half: <b>{advancedTotals.halfday}</b></span>
                      <hr style={{ margin: "2px 0", borderColor: "#e5e7eb" }} />
                      {advancedTotals.overtime > 0 && (
                        <span style={{ color: "#6d28d9" }}>OT: <b>{advancedTotals.overtime}h</b></span>
                      )}
                      <span style={{ color: "#9333ea", fontWeight: "bold" }}>
                        Sun: <b>{advancedTotals.presentOnSunday}</b>
                      </span>
                      <span style={{ color: "#0891b2", fontWeight: "bold", fontSize: 11 }}>
                        Total P: <b>{advancedTotals.totalPresent}</b>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSummary = () => {
    const workersWithAdvanced = filteredData.map((workerData) => ({
      ...workerData,
      advanced: calculateAdvancedTotals(workerData.attendance || []),
    }));

    return (
      <div style={S.tableContainer}>
        <table style={S.summaryTable}>
          <thead>
            <tr>
              <th style={S.summaryTh}>Worker</th>
              <th style={S.summaryTh}>Present</th>
              <th style={S.summaryTh}>Half Day</th>
              <th style={S.summaryTh}>Absent</th>
              <th style={S.summaryTh}>Holiday</th>
              <th style={S.summaryTh}>OT Hours</th>
              <th style={{ ...S.summaryTh, background: "#f3e8ff", color: "#9333ea" }}>Sunday</th>
              <th style={{ ...S.summaryTh, background: "#cffafe", color: "#0891b2" }}>Total Present</th>
            </tr>
          </thead>
          <tbody>
            {workersWithAdvanced.map((workerData, i) => (
              <tr key={i}>
                <td style={{ ...S.summaryTd, textAlign: "left" }}>
                  <div style={{ fontWeight: 700 }}>{workerData.worker.name}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{workerData.worker.designation}</div>
                </td>
                <td style={{ ...S.summaryTd, textAlign: "center", color: "#15803d", fontWeight: 700 }}>
                  {workerData.advanced.present}
                </td>
                <td style={{ ...S.summaryTd, textAlign: "center", color: "#b45309", fontWeight: 700 }}>
                  {workerData.advanced.halfday}
                </td>
                <td style={{ ...S.summaryTd, textAlign: "center", color: "#b91c1c", fontWeight: 700 }}>
                  {workerData.advanced.absent}
                </td>
                <td style={{ ...S.summaryTd, textAlign: "center", color: "#1d4ed8", fontWeight: 700 }}>
                  {workerData.advanced.holiday}
                </td>
                <td style={{ ...S.summaryTd, textAlign: "center", color: "#6d28d9", fontWeight: 700 }}>
                  {workerData.advanced.overtime}h
                </td>
                <td style={{ ...S.summaryTd, textAlign: "center", background: "#f3e8ff", color: "#9333ea", fontWeight: 700 }}>
                  {workerData.advanced.presentOnSunday}
                </td>
                <td style={{ ...S.summaryTd, textAlign: "center", background: "#cffafe", color: "#0891b2", fontWeight: "bold", fontSize: 14 }}>
                  {workerData.advanced.totalPresent}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ background: "#f9fafb", fontWeight: 700 }}>
            <tr>
              <td style={{ ...S.summaryTd }}>Total</td>
              <td style={{ ...S.summaryTd, textAlign: "center", color: "#15803d" }}>{allTotals.present}</td>
              <td style={{ ...S.summaryTd, textAlign: "center", color: "#b45309" }}>{allTotals.halfday}</td>
              <td style={{ ...S.summaryTd, textAlign: "center", color: "#b91c1c" }}>{allTotals.absent}</td>
              <td style={{ ...S.summaryTd, textAlign: "center", color: "#1d4ed8" }}>{allTotals.holiday}</td>
              <td style={{ ...S.summaryTd, textAlign: "center", color: "#6d28d9" }}>{allTotals.overtime}h</td>
              <td style={{ ...S.summaryTd, textAlign: "center", background: "#f3e8ff", color: "#9333ea" }}>{allTotals.presentOnSunday}</td>
              <td style={{ ...S.summaryTd, textAlign: "center", background: "#cffafe", color: "#0891b2", fontWeight: "bold" }}>{allTotals.totalPresent}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  // Skeleton Loading
  if (isLoading) {
    return (
      <div style={S.root}>
        {/* Toolbar Skeleton */}
        <div style={S.toolbar}>
          <div className="animate-pulse flex gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Legend Skeleton */}
        <div className="animate-pulse flex flex-wrap gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="h-4 w-24 bg-gray-200 rounded"></div>
          ))}
        </div>

        {/* Cards Skeleton */}
        <div style={S.cardsBox}>
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
            <div style={S.cardsGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Matrix Skeleton */}
        <SkeletonMatrix />

        {/* Footer Skeleton */}
        <div className="animate-pulse mt-4">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  // Show no data message
  if (!data || data.length === 0) {
    return (
      <div style={S.root}>
        <div style={{ textAlign: "center", padding: 50, color: "#9ca3af", background: "#f9fafb", borderRadius: 8 }}>
          No attendance data available for {MONTH_NAMES[reportMonth - 1]} {reportYear}
        </div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.tabGroup}>
          <TabBtn id="matrix" label="📊 Matrix" />
          <TabBtn id="summary" label="📈 Summary" />
        </div>
        <input
          type="text"
          placeholder="🔍 Search worker..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={S.search}
        />
      </div>

      {/* Legend */}
      <div style={S.legendRow}>
        {[
          { bg: "#dcfce7", border: "#86efac", label: "P = Present" },
          { bg: "#ede9fe", border: "#c4b5fd", label: "P+OT = Present + OT" },
          { bg: "#fef3c7", border: "#fcd34d", label: "Half = Half Day" },
          { bg: "#fee2e2", border: "#fca5a5", label: "A = Absent" },
          { bg: "#dbeafe", border: "#93c5fd", label: "Holi = Holiday (Mon-Sat only)" },
          { bg: "#fee2e2", border: "#fca5a5", label: "🔴 Sunday Column" },
          { bg: "#eff6ff", border: "#93c5fd", label: "🔵 Saturday Column" },
          { bg: "#f3e8ff", border: "#d8b4fe", label: "🟣 Sunday = P+Holi on Sunday" },
          { bg: "#cffafe", border: "#67e8f9", label: "✅ Total Present = P + Sun + Holi" },
        ].map((item) => (
          <div key={item.label} style={S.legendItem}>
            <div style={{ ...S.legendDot, background: item.bg, border: `1px solid ${item.border}` }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div style={S.cardsBox}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
          Attendance Summary — {MONTH_NAMES[reportMonth - 1]} {reportYear}
        </div>
        <div style={S.cardsGrid}>
          <div style={S.card}><div style={S.cardLabel}>Workers</div><div style={{ ...S.cardValue, color: "#111827" }}>{allTotals.workers}</div></div>
          <div style={S.card}><div style={S.cardLabel}>Present</div><div style={{ ...S.cardValue, color: "#15803d" }}>{allTotals.present}</div></div>
          <div style={S.card}><div style={S.cardLabel}>Half Day</div><div style={{ ...S.cardValue, color: "#b45309" }}>{allTotals.halfday}</div></div>
          <div style={S.card}><div style={S.cardLabel}>Absent</div><div style={{ ...S.cardValue, color: "#b91c1c" }}>{allTotals.absent}</div></div>
          <div style={S.card}><div style={S.cardLabel}>Holiday</div><div style={{ ...S.cardValue, color: "#1d4ed8" }}>{allTotals.holiday}</div></div>
          <div style={S.card}><div style={S.cardLabel}>OT Hours</div><div style={{ ...S.cardValue, color: "#6d28d9" }}>{allTotals.overtime}h</div></div>
          <div style={{ ...S.card, background: "#f3e8ff" }}><div style={S.cardLabel}>Sunday</div><div style={{ ...S.cardValue, color: "#9333ea" }}>{allTotals.presentOnSunday}</div></div>
          <div style={{ ...S.card, background: "#cffafe" }}><div style={S.cardLabel}>Total Present</div><div style={{ ...S.cardValue, color: "#0891b2", fontSize: 24 }}>{allTotals.totalPresent}</div></div>
        </div>
      </div>

      {/* Main */}
      {filteredData.length === 0 ? (
        <div style={{ textAlign: "center", padding: 50, color: "#9ca3af", background: "#f9fafb", borderRadius: 8 }}>
          No workers found matching your search
        </div>
      ) : viewMode === "matrix" ? renderMatrix() : renderSummary()}

      {/* Footer */}
      <div style={S.footer}>
        P = Present | Half = Half Day | A = Absent | Holi = Holiday (Mon-Sat only) | OT = Overtime Hours<br />
        Sunday = Present + Holiday on Sunday ONLY | Total Present = Present + Sunday + Holiday (Mon-Sat)
      </div>
    </div>
  );
}