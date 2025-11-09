import { Expense } from "../lib/supabase";
import { PieChart, BarChart3 } from "lucide-react";

interface ExpenseChartProps {
  expenses: Expense[];
  darkMode: boolean;
}

export default function ExpenseChart({
  expenses,
  darkMode
}: ExpenseChartProps) {
  // ✅ Dynamic colors
  const getColor = (index: number) => {
    const hue = (index * 137.5) % 360;
    return `linear-gradient(135deg, hsl(${hue}, 80%, 60%), hsl(${hue}, 80%, 50%))`;
  };

  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const totalAmount = sortedCategories.reduce(
    (sum, [, amt]) => sum + amt,
    0
  );

  const payerTotals = expenses.reduce((acc, expense) => {
    acc[expense.payer] = (acc[expense.payer] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedPayers = Object.entries(payerTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const maxPayerAmount = Math.max(
    ...sortedPayers.map(([, amount]) => amount)
  );

  if (expenses.length === 0) {
    return (
      <div
        className={`rounded-xl shadow-lg p-8 text-center backdrop-blur-md ${
          darkMode ? "bg-gray-800/70" : "bg-white/70"
        }`}
      >
        <p
          className={darkMode ? "text-gray-400" : "text-gray-600"}
        >
          No expenses to display yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ✅ PIE CHART SECTION */}
      <div
        className={`rounded-xl shadow-lg p-6 backdrop-blur-md ${
          darkMode ? "bg-gray-800/80" : "bg-white/80"
        }`}
      >
        <div className="flex items-center gap-2 mb-6">
          <PieChart
            className="text-blue-500 drop-shadow-sm"
            size={26}
          />
          <h2
            className={`text-xl sm:text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Expenses by Category
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* ✅ Pie Chart */}
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 mx-auto scale-[1] hover:scale-[1.05] transition-all duration-300 ease-out">
            <svg
              viewBox="0 0 200 200"
              className="transform -rotate-90"
            >
              {sortedCategories.map(
                ([category, amount], index) => {
                  const percentage = amount / totalAmount;
                  const angle = percentage * 360;

                  const prevAngles = sortedCategories
                    .slice(0, index)
                    .reduce(
                      (sum, [, amt]) =>
                        sum + (amt / totalAmount) * 360,
                      0
                    );

                  const startAngle = prevAngles;
                  const endAngle = startAngle + angle;
                  const radius = 80;

                  const startX =
                    100 +
                    radius *
                      Math.cos((startAngle * Math.PI) / 180);
                  const startY =
                    100 +
                    radius *
                      Math.sin((startAngle * Math.PI) / 180);
                  const endX =
                    100 +
                    radius *
                      Math.cos((endAngle * Math.PI) / 180);
                  const endY =
                    100 +
                    radius *
                      Math.sin((endAngle * Math.PI) / 180);

                  const largeArcFlag = angle > 180 ? 1 : 0;

                  const pathData = `
                          M 100 100
                          L ${startX} ${startY}
                          A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
                          Z
                        `;

                  return (
                    <path
                      key={category}
                      d={pathData}
                      fill={`hsl(${
                        (index * 137.5) % 360
                      }, 75%, 55%)`}
                      className="transition-all duration-300 hover:opacity-80"
                      stroke={darkMode ? "#1a1a1a" : "#fafafa"}
                      strokeWidth="2"
                    />
                  );
                }
              )}
            </svg>

            {/* ✅ Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p
                className={`text-sm font-semibold ${
                  darkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                Total
              </p>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                ₹{totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* ✅ Legend */}
          <div className="space-y-3">
            {sortedCategories.map(
              ([category, amount], index) => {
                const pct = (
                  (amount / totalAmount) *
                  100
                ).toFixed(1);

                return (
                  <div
                    key={category}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-200/30 dark:hover:bg-gray-700/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-md shadow-sm"
                        style={{
                          background: `hsl(${
                            (index * 137.5) % 360
                          }, 75%, 55%)`
                        }}
                      />
                      <span
                        className={
                          darkMode
                            ? "text-gray-200"
                            : "text-gray-800"
                        }
                      >
                        {category}
                      </span>
                    </div>

                    <div className="text-right">
                      <p
                        className={
                          darkMode
                            ? "text-gray-100"
                            : "text-gray-900"
                        }
                      >
                        ₹{amount.toFixed(2)}
                      </p>
                      <p
                        className={
                          darkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                        }
                      >
                        {pct}%
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* ✅ BAR CHART SECTION */}
      <div
        className={`rounded-xl shadow-lg p-6 backdrop-blur-md ${
          darkMode ? "bg-gray-800/80" : "bg-white/80"
        }`}
      >
        <div className="flex items-center gap-2 mb-6">
          <BarChart3
            className="text-green-500 drop-shadow-sm"
            size={26}
          />
          <h2
            className={`text-xl sm:text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Expenses by Person
          </h2>
        </div>

        <div className="space-y-4">
          {sortedPayers.map(
            ([payer, amount], index) => {
              const percentage =
                (amount / maxPayerAmount) * 100;

              return (
                <div key={payer} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        darkMode
                          ? "text-gray-300"
                          : "text-gray-900"
                      }
                    >
                      {payer}
                    </span>

                    <span
                      className={
                        darkMode
                          ? "text-gray-200"
                          : "text-gray-900"
                      }
                    >
                      ₹{amount.toFixed(2)}
                    </span>
                  </div>

                  <div
                    className={`w-full h-3 rounded-full overflow-hidden ${
                      darkMode
                        ? "bg-gray-700"
                        : "bg-gray-200"
                    }`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out shadow-md"
                      style={{
                        width: `${percentage}%`,
                        background: `hsl(${
                          (index * 137.5) % 360
                        }, 75%, 55%)`
                      }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
