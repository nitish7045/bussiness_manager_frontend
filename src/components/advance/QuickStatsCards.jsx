import React from "react";

export default function QuickStatsCards({ stats, formatNumber, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl shadow-lg p-4 animate-pulse">
            <div className="h-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Total Monthly Advances", value: formatNumber(stats.totalMonthlyAdvance), icon: "📅", color: "from-blue-500 to-blue-600" },
    { title: "Total Loans", value: formatNumber(stats.totalLoan), icon: "💰", color: "from-purple-500 to-purple-600" },
    { title: "Total Due Amount", value: formatNumber(stats.totalDue), icon: "⚠️", color: "from-orange-500 to-orange-600" },
    { title: "Active Workers", value: stats.activeWorkers, icon: "👷", color: "from-green-500 to-green-600" },
    { title: "Completed This Month", value: stats.completedThisMonth, icon: "✅", color: "from-teal-500 to-teal-600" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className={`bg-gradient-to-r ${card.color} rounded-xl shadow-lg p-4 text-white transition-transform hover:scale-105 duration-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">{card.title}</p>
              <p className="text-2xl font-bold">
                {card.title.includes("Active Workers") || card.title.includes("Completed") 
                  ? card.value 
                  : `₹${card.value}`}
              </p>
            </div>
            <div className="text-3xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}