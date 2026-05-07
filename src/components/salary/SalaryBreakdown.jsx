// src/components/salary/SalaryBreakdown.js
import React from "react";

export default function SalaryBreakdown({ data, monthlyDeduction, loanDeduction, totalDeductions, netSalary, hasCarryForward }) {
  const formatNumber = (num) => num?.toLocaleString('en-IN') || 0;

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Salary Breakdown</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Earnings Breakdown */}
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs font-semibold text-gray-600 mb-1">Earnings</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Weekday Present ({data.attendance.weekdayPresent} × ₹{formatNumber(data.rates.dailySalary)})</span>
              <span className="font-medium">₹{formatNumber(data.earnings.weekdayPay)}</span>
            </div>
            {data.attendance.weekdayHalf > 0 && (
              <div className="flex justify-between">
                <span>Weekday Half ({data.attendance.weekdayHalf} × ₹{formatNumber(data.rates.dailySalary * 0.5)})</span>
                <span className="font-medium">₹{formatNumber(data.earnings.weekdayHalfPay)}</span>
              </div>
            )}
            {data.attendance.sundayPresent > 0 && (
              <div className="flex justify-between">
                <span>Sunday Present ({data.attendance.sundayPresent} × ₹{formatNumber(data.rates.dailySalary * 2)})</span>
                <span className="font-medium">₹{formatNumber(data.earnings.sundayPresentPay)}</span>
              </div>
            )}
            {data.attendance.sundayHalf > 0 && (
              <div className="flex justify-between">
                <span>Sunday Half ({data.attendance.sundayHalf} × ₹{formatNumber(data.rates.dailySalary * 1.5)})</span>
                <span className="font-medium">₹{formatNumber(data.earnings.sundayHalfPay)}</span>
              </div>
            )}
            {data.attendance.sundayHoliday > 0 && (
              <div className="flex justify-between">
                <span>Sunday Holiday ({data.attendance.sundayHoliday} × ₹{formatNumber(data.rates.dailySalary)})</span>
                <span className="font-medium">₹{formatNumber(data.earnings.sundayHolidayPay)}</span>
              </div>
            )}
            {data.attendance.otherHolidays > 0 && (
              <div className="flex justify-between">
                <span>Other Holidays ({data.attendance.otherHolidays} × ₹{formatNumber(data.rates.dailySalary)})</span>
                <span className="font-medium">₹{formatNumber(data.earnings.otherHolidayPay)}</span>
              </div>
            )}
            {data.attendance.overtimeHours > 0 && (
              <div className="flex justify-between">
                <span>Overtime ({data.attendance.overtimeHours}h × ₹{formatNumber(data.rates.hourlySalary)})</span>
                <span className="font-medium">₹{formatNumber(data.earnings.overtimePay)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-gray-200 font-semibold">
              <span>Total Earnings</span>
              <span className="text-green-600">₹{formatNumber(data.earnings.totalEarnings)}</span>
            </div>
          </div>
        </div>
        
        {/* Deductions Breakdown */}
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs font-semibold text-gray-600 mb-1">Deductions</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Monthly Advance</span>
              <span className="font-medium text-red-600">₹{formatNumber(monthlyDeduction)}</span>
            </div>
            <div className="flex justify-between">
              <span>Loan</span>
              <span className="font-medium text-red-600">₹{formatNumber(loanDeduction)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200 font-semibold">
              <span>Total Deductions</span>
              <span className="text-red-600">₹{formatNumber(totalDeductions)}</span>
            </div>
          </div>
        </div>
        
        {/* Net Salary */}
        <div className="bg-blue-50 p-2 rounded">
          <p className="text-xs font-semibold text-gray-600 mb-1">Net Salary</p>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">₹{formatNumber(netSalary)}</p>
          </div>
        </div>
        
        {/* Carry Forward */}
        {hasCarryForward && (
          <div className="bg-orange-50 p-2 rounded">
            <p className="text-xs font-semibold text-gray-600 mb-1">Carry Forward to Next Month</p>
            <div className="space-y-1 text-xs">
              {data.calculatedRemaining?.monthlyAdvance > 0 && (
                <div className="flex justify-between">
                  <span>Monthly Advance</span>
                  <span className="font-medium text-orange-600">₹{formatNumber(data.calculatedRemaining.monthlyAdvance)}</span>
                </div>
              )}
              {data.calculatedRemaining?.loan > 0 && (
                <div className="flex justify-between">
                  <span>Loan</span>
                  <span className="font-medium text-orange-600">₹{formatNumber(data.calculatedRemaining.loan)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}