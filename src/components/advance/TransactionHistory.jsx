import React from "react";

export default function TransactionHistory({ transactions, searchTerm, onSearchChange, formatDateTime, formatNumber }) {
  const filteredTransactions = transactions.filter(t =>
    t.remark?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-5 py-3">
        <h2 className="text-lg font-bold text-white">Transaction History</h2>
      </div>
      <div className="p-5">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by remark..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Remark</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500 text-sm">No transactions found</td>
                </tr>
              ) : (
                filteredTransactions.map(transaction => (
                  <tr key={transaction._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDateTime(transaction.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {transaction.type === 'credit' ? 'Credit (Given)' : 'Debit (Deducted)'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'} ₹{formatNumber(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{transaction.remark || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}