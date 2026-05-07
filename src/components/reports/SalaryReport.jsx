// src/components/reports/SalaryReport.jsx
import React, { useState } from "react";

export default function SalaryReport({ data }) {
  const [expandedRows, setExpandedRows] = useState({});

  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;
  const formatNumberWithDecimals = (num) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const totals = {
    workers: data.length,
    earnings: data.reduce((sum, s) => sum + (s.earnings?.totalEarnings || 0), 0),
    deductions: data.reduce((sum, s) => sum + (s.deductions?.totalDeductions || 0), 0),
    netSalary: data.reduce((sum, s) => sum + (s.netSalary || 0), 0),
    monthlyAdvanceDeductions: data.reduce((sum, s) => sum + (s.deductions?.monthlyAdvanceDeducted || 0), 0),
    loanDeductions: data.reduce((sum, s) => sum + (s.deductions?.loanDeducted || 0), 0),
    weekdayPay: data.reduce((sum, s) => sum + (s.earnings?.weekdayPay || 0), 0),
    sundayPay: data.reduce((sum, s) => sum + ((s.earnings?.sundayPresentPay || 0) + (s.earnings?.sundayHalfPay || 0) + (s.earnings?.sundayHolidayPay || 0)), 0),
    overtimePay: data.reduce((sum, s) => sum + (s.earnings?.overtimePay || 0), 0),
    holidayPay: data.reduce((sum, s) => sum + (s.earnings?.otherHolidayPay || 0), 0)
  };

  const getEarningsBreakdown = (salary) => {
    return {
      weekday: salary.earnings?.weekdayPay || 0,
      weekdayHalf: salary.earnings?.weekdayHalfPay || 0,
      sundayPresent: salary.earnings?.sundayPresentPay || 0,
      sundayHalf: salary.earnings?.sundayHalfPay || 0,
      sundayHoliday: salary.earnings?.sundayHolidayPay || 0,
      otherHoliday: salary.earnings?.otherHolidayPay || 0,
      overtime: salary.earnings?.overtimePay || 0
    };
  };

  const getAttendanceBreakdown = (salary) => {
    return {
      weekdayPresent: salary.attendance?.weekdayPresent || 0,
      weekdayHalf: salary.attendance?.weekdayHalf || 0,
      sundayPresent: salary.attendance?.sundayPresent || 0,
      sundayHalf: salary.attendance?.sundayHalf || 0,
      sundayHoliday: salary.attendance?.sundayHoliday || 0,
      otherHolidays: salary.attendance?.otherHolidays || 0,
      overtimeHours: salary.attendance?.overtimeHours || 0
    };
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Salary Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
            <p className="text-xs text-gray-500">Total Workers</p>
            <p className="text-lg font-bold text-gray-800">{totals.workers}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
            <p className="text-xs text-gray-500">Total Earnings</p>
            <p className="text-lg font-bold text-green-600">₹{formatNumber(totals.earnings)}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
            <p className="text-xs text-gray-500">Total Deductions</p>
            <p className="text-lg font-bold text-red-600">₹{formatNumber(totals.deductions)}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
            <p className="text-xs text-gray-500">Total Net Salary</p>
            <p className="text-lg font-bold text-blue-600">₹{formatNumber(totals.netSalary)}</p>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-blue-600">Weekday Pay</p>
            <p className="text-sm font-bold text-blue-700">₹{formatNumber(totals.weekdayPay)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xs text-purple-600">Sunday Pay</p>
            <p className="text-sm font-bold text-purple-700">₹{formatNumber(totals.sundayPay)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xs text-orange-600">Overtime Pay</p>
            <p className="text-sm font-bold text-orange-700">₹{formatNumber(totals.overtimePay)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xs text-green-600">Holiday Pay</p>
            <p className="text-sm font-bold text-green-700">₹{formatNumber(totals.holidayPay)}</p>
          </div>
        </div>
      </div>

      {/* Deduction Types Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Deduction Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📊</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Monthly Advance</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Deducted:</span>
                <span className="font-semibold text-blue-600">₹{formatNumber(totals.monthlyAdvanceDeductions)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${totals.deductions > 0 ? (totals.monthlyAdvanceDeductions / totals.deductions) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                {totals.deductions > 0 ? Math.round((totals.monthlyAdvanceDeductions / totals.deductions) * 100) : 0}% of total deductions
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">💰</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Loan</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Deducted:</span>
                <span className="font-semibold text-purple-600">₹{formatNumber(totals.loanDeductions)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${totals.deductions > 0 ? (totals.loanDeductions / totals.deductions) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                {totals.deductions > 0 ? Math.round((totals.loanDeductions / totals.deductions) * 100) : 0}% of total deductions
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Table with Expandable Rows */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-8"></th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Worker</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Designation</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Earnings</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Deductions</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Net Salary</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th></tr>
             </thead>
          <tbody>
            {data.map(salary => {
              const isExpanded = expandedRows[salary._id];
              const earningsBreakdown = getEarningsBreakdown(salary);
              const attendanceBreakdown = getAttendanceBreakdown(salary);
              const hasDetails = earningsBreakdown.weekdayHalf > 0 || 
                                 earningsBreakdown.sundayPresent > 0 || 
                                 earningsBreakdown.sundayHalf > 0 ||
                                 earningsBreakdown.sundayHoliday > 0 ||
                                 earningsBreakdown.otherHoliday > 0 ||
                                 earningsBreakdown.overtime > 0 ||
                                 salary.deductions?.monthlyAdvanceDeducted > 0 ||
                                 salary.deductions?.loanDeducted > 0;

              return (
                <React.Fragment key={salary._id}>
                  <tr className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">
                      {hasDetails && (
                        <button
                          onClick={() => toggleExpand(salary._id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                     </td>
                    <td className="px-3 py-2 text-xs">{salary.workerId?.name}</td>
                    <td className="px-3 py-2 text-xs">{salary.workerId?.designation}</td>
                    <td className="px-3 py-2 text-xs text-right text-green-600">₹{formatNumber(salary.earnings?.totalEarnings)}</td>
                    <td className="px-3 py-2 text-xs text-right text-red-600">₹{formatNumber(salary.deductions?.totalDeductions)}</td>
                    <td className="px-3 py-2 text-xs text-right font-semibold text-blue-600">₹{formatNumber(salary.netSalary)}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        salary.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {salary.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Expandable Details Row */}
                  {isExpanded && hasDetails && (
                    <tr className="bg-gray-50">
                      <td colSpan="7" className="px-4 py-3">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Salary Details - {salary.workerId?.name}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Earnings Breakdown */}
                            <div>
                              <h5 className="text-xs font-semibold text-green-600 mb-2">Earnings Breakdown</h5>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span>Weekday Present ({attendanceBreakdown.weekdayPresent} × ₹{formatNumberWithDecimals(salary.dailySalary)})</span>
                                  <span className="font-medium">₹{formatNumberWithDecimals(earningsBreakdown.weekday)}</span>
                                </div>
                                {attendanceBreakdown.weekdayHalf > 0 && (
                                  <div className="flex justify-between">
                                    <span>Weekday Half Day ({attendanceBreakdown.weekdayHalf} × ₹{formatNumberWithDecimals(salary.dailySalary * 0.5)})</span>
                                    <span className="font-medium">₹{formatNumberWithDecimals(earningsBreakdown.weekdayHalf)}</span>
                                  </div>
                                )}
                                {attendanceBreakdown.sundayPresent > 0 && (
                                  <div className="flex justify-between">
                                    <span>Sunday Present (Double Pay) ({attendanceBreakdown.sundayPresent} × ₹{formatNumberWithDecimals(salary.dailySalary * 2)})</span>
                                    <span className="font-medium">₹{formatNumberWithDecimals(earningsBreakdown.sundayPresent)}</span>
                                  </div>
                                )}
                                {attendanceBreakdown.sundayHalf > 0 && (
                                  <div className="flex justify-between">
                                    <span>Sunday Half Day (1.5x) ({attendanceBreakdown.sundayHalf} × ₹{formatNumberWithDecimals(salary.dailySalary * 1.5)})</span>
                                    <span className="font-medium">₹{formatNumberWithDecimals(earningsBreakdown.sundayHalf)}</span>
                                  </div>
                                )}
                                {attendanceBreakdown.sundayHoliday > 0 && (
                                  <div className="flex justify-between">
                                    <span>Sunday Holiday ({attendanceBreakdown.sundayHoliday} × ₹{formatNumberWithDecimals(salary.dailySalary)})</span>
                                    <span className="font-medium">₹{formatNumberWithDecimals(earningsBreakdown.sundayHoliday)}</span>
                                  </div>
                                )}
                                {attendanceBreakdown.otherHolidays > 0 && (
                                  <div className="flex justify-between">
                                    <span>Other Holidays ({attendanceBreakdown.otherHolidays} × ₹{formatNumberWithDecimals(salary.dailySalary)})</span>
                                    <span className="font-medium">₹{formatNumberWithDecimals(earningsBreakdown.otherHoliday)}</span>
                                  </div>
                                )}
                                {attendanceBreakdown.overtimeHours > 0 && (
                                  <div className="flex justify-between">
                                    <span>Overtime ({attendanceBreakdown.overtimeHours} hrs × ₹{formatNumberWithDecimals(salary.hourlySalary)})</span>
                                    <span className="font-medium">₹{formatNumberWithDecimals(earningsBreakdown.overtime)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between pt-1 border-t border-gray-200 font-semibold">
                                  <span>Total Earnings</span>
                                  <span className="text-green-600">₹{formatNumber(salary.earnings?.totalEarnings)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Deductions Breakdown */}
                            <div>
                              <h5 className="text-xs font-semibold text-red-600 mb-2">Deductions Breakdown</h5>
                              <div className="space-y-1 text-xs">
                                {salary.deductions?.monthlyAdvanceDeducted > 0 && (
                                  <div className="flex justify-between">
                                    <span>Monthly Advance Deduction</span>
                                    <span className="text-red-600">-₹{formatNumber(salary.deductions.monthlyAdvanceDeducted)}</span>
                                  </div>
                                )}
                                {salary.deductions?.loanDeducted > 0 && (
                                  <div className="flex justify-between">
                                    <span>Loan Deduction</span>
                                    <span className="text-red-600">-₹{formatNumber(salary.deductions.loanDeducted)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between pt-1 border-t border-gray-200 font-semibold">
                                  <span>Total Deductions</span>
                                  <span className="text-red-600">-₹{formatNumber(salary.deductions?.totalDeductions)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Attendance Summary */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-600 mb-2">Attendance Summary</h5>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                              <div><span className="text-green-600">P: {attendanceBreakdown.weekdayPresent}</span></div>
                              {attendanceBreakdown.weekdayHalf > 0 && <div><span className="text-yellow-600">H: {attendanceBreakdown.weekdayHalf}</span></div>}
                              {attendanceBreakdown.sundayPresent > 0 && <div><span className="text-purple-600">SunP: {attendanceBreakdown.sundayPresent}</span></div>}
                              {attendanceBreakdown.sundayHalf > 0 && <div><span className="text-orange-600">SunH: {attendanceBreakdown.sundayHalf}</span></div>}
                              {attendanceBreakdown.sundayHoliday > 0 && <div><span className="text-blue-600">SunHol: {attendanceBreakdown.sundayHoliday}</span></div>}
                              {attendanceBreakdown.otherHolidays > 0 && <div><span className="text-blue-600">Hol: {attendanceBreakdown.otherHolidays}</span></div>}
                              {attendanceBreakdown.overtimeHours > 0 && <div><span className="text-red-600">OT: {attendanceBreakdown.overtimeHours}h</span></div>}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}