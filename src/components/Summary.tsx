import { Expense } from '../lib/supabase';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

interface SummaryProps {
  expenses: Expense[];
  darkMode: boolean;
}

export default function Summary({ expenses, darkMode }: SummaryProps) {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const payerTotals = expenses.reduce((acc, expense) => {
    acc[expense.payer] = (acc[expense.payer] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const uniquePayers = Object.keys(payerTotals);
  const numberOfPeople = uniquePayers.length;
  const averagePerPerson = numberOfPeople > 0 ? totalExpenses / numberOfPeople : 0;

  const settlements = uniquePayers.map((payer) => {
    const paid = payerTotals[payer];
    const owes = averagePerPerson - paid;
    return { payer, paid, owes };
  });

  if (expenses.length === 0) {
    return (
      <div className={`rounded-lg shadow-md p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Add expenses to see the summary.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 sm:p-6 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Expenses</h3>
            <DollarSign className="opacity-80" size={18} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold">₹{totalExpenses.toFixed(2)}</p>
        </div>

        <div className={`bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 sm:p-6 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Number of People</h3>
            <Users className="opacity-80" size={18} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{numberOfPeople}</p>
        </div>

        <div className={`bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-4 sm:p-6 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Average per Person</h3>
            <TrendingUp className="opacity-80" size={18} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold">₹{averagePerPerson.toFixed(2)}</p>
        </div>
      </div>

      <div className={`rounded-lg shadow-md p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Settlement Summary
        </h2>
        <p className={`text-xs sm:text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          This shows how much each person paid and what they owe or are owed to split expenses equally.
        </p>

        <div className="space-y-3 sm:space-y-4">
          {settlements.map(({ payer, paid, owes }) => (
            <div
              key={payer}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="mb-2 sm:mb-0">
                <p className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {payer}
                </p>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Paid: ₹{paid.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                {owes < 0 ? (
                  <div>
                    <p className="text-base sm:text-lg font-bold text-red-500">₹{Math.abs(owes).toFixed(2)}</p>
                    <p className="text-xs sm:text-sm text-red-500">Owes</p>
                  </div>
                ) : owes > 0 ? (
                  <div>
                    <p className="text-base sm:text-lg font-bold text-green-500">₹{owes.toFixed(2)}</p>
                    <p className="text-xs sm:text-sm text-green-500">Is Owed</p>
                  </div>
                ) : (
                  <div>
                    <p className={`text-base sm:text-lg font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ₹0.00
                    </p>
                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Settled
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
