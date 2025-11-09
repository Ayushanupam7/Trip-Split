import { Expense } from '../lib/supabase';
import { PieChart, BarChart3 } from 'lucide-react';

interface ExpenseChartProps {
  expenses: Expense[];
  darkMode: boolean;
}

export default function ExpenseChart({ expenses, darkMode }: ExpenseChartProps) {
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const totalAmount = sortedCategories.reduce((sum, [, amount]) => sum + amount, 0);

  const colors = [
    { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
    { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' },
    { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500' },
    { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500' },
    { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500' },
    { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-500' },
    { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500' },
  ];

  const payerTotals = expenses.reduce((acc, expense) => {
    acc[expense.payer] = (acc[expense.payer] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedPayers = Object.entries(payerTotals).sort((a, b) => b[1] - a[1]);
  const maxPayerAmount = Math.max(...sortedPayers.map(([, amount]) => amount));

  if (expenses.length === 0) {
    return (
      <div className={`rounded-lg shadow-md p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No expenses to visualize yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-lg shadow-md p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-2 mb-6">
          <PieChart className="text-blue-600" size={24} />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Expenses by Category</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          <div className="relative w-48 sm:w-64 h-48 sm:h-64 mx-auto">
            <svg viewBox="0 0 200 200" className="transform -rotate-90">
              {sortedCategories.map(([category, amount], index) => {
                const percentage = (amount / totalAmount) * 100;
                const angle = (percentage / 100) * 360;
                const prevAngles = sortedCategories
                  .slice(0, index)
                  .reduce((sum, [, amt]) => sum + ((amt / totalAmount) * 360), 0);

                const radius = 80;
                const startAngle = prevAngles;
                const endAngle = prevAngles + angle;

                const startX = 100 + radius * Math.cos((startAngle * Math.PI) / 180);
                const startY = 100 + radius * Math.sin((startAngle * Math.PI) / 180);
                const endX = 100 + radius * Math.cos((endAngle * Math.PI) / 180);
                const endY = 100 + radius * Math.sin((endAngle * Math.PI) / 180);

                const largeArcFlag = angle > 180 ? 1 : 0;

                const pathData = [
                  `M 100 100`,
                  `L ${startX} ${startY}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  'Z',
                ].join(' ');

                const colorClass = colors[index % colors.length];

                return (
                  <path
                    key={category}
                    d={pathData}
                    className={colorClass.bg}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {sortedCategories.map(([category, amount], index) => {
              const percentage = ((amount / totalAmount) * 100).toFixed(1);
              const colorClass = colors[index % colors.length];

              return (
                <div key={category} className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 sm:w-4 h-3 sm:h-4 rounded ${colorClass.bg}`}></div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      ₹{amount.toFixed(2)}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`rounded-lg shadow-md p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-green-600" size={24} />
          <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Expenses by Person
          </h2>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {sortedPayers.map(([payer, amount], index) => {
            const percentage = (amount / maxPayerAmount) * 100;
            const colorClass = colors[index % colors.length];

            return (
              <div key={payer} className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {payer}
                  </span>
                  <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    ₹{amount.toFixed(2)}
                  </span>
                </div>
                <div className={`w-full rounded-full h-3 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-full ${colorClass.bg} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
