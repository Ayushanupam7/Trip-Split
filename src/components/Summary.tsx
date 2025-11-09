import { useEffect, useState } from "react";
import { Expense, supabase } from "../lib/supabase";
import { DollarSign, Users, TrendingUp, Pencil } from "lucide-react";

interface SummaryProps {
  expenses: Expense[];
  darkMode: boolean;
}

export default function Summary({ expenses, darkMode }: SummaryProps) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const payerTotals = expenses.reduce((acc, exp) => {
    acc[exp.payer] = (acc[exp.payer] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const uniquePayers = Object.keys(payerTotals);
  const numberOfPeople = uniquePayers.length;
  const fallbackBudget = numberOfPeople > 0 ? totalExpenses / numberOfPeople : 0;

  const [personBudgets, setPersonBudgets] = useState<Record<string, number>>({});
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch budgets from Supabase
  const fetchBudgets = async () => {
    const { data, error } = await supabase.from("person_budgets").select("*");

    if (!error && data) {
      const mapped = Object.fromEntries(data.map((b) => [b.payer, b.budget]));
      setPersonBudgets(mapped);
    }
  };

  // ✅ Auto-create missing budget rows for new payers
  const syncMissingBudgets = async () => {
    const { data } = await supabase.from("person_budgets").select("payer");

    const existing = new Set(data?.map((d: any) => d.payer));

    for (const payer of uniquePayers) {
      if (!existing.has(payer)) {
        await supabase.from("person_budgets").insert([
          { payer, budget: fallbackBudget }
        ]);
      }
    }

    fetchBudgets();
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    syncMissingBudgets();
  }, [uniquePayers.length]);

  const saveBudgetsToDB = async () => {
    setLoading(true);

    try {
      for (const payer of uniquePayers) {
        await supabase
          .from("person_budgets")
          .update({ budget: personBudgets[payer] })
          .eq("payer", payer);
      }
    } finally {
      setLoading(false);
      setBudgetModalOpen(false);
    }
  };

  if (expenses.length === 0) {
    return (
      <div
        className={`rounded-lg shadow-md p-8 text-center ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
          Add expenses to see the summary.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ✅ Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 sm:p-6 text-white">
          <h3 className="text-xs sm:text-sm opacity-90">Total Expenses</h3>
          <p className="text-2xl sm:text-3xl font-bold">₹{totalExpenses.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 sm:p-6 text-white">
          <h3 className="text-xs sm:text-sm opacity-90">Number of People</h3>
          <p className="text-2xl sm:text-3xl font-bold">{numberOfPeople}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-4 sm:p-6 text-white">
          <h3 className="text-xs sm:text-sm opacity-90">Default Budget</h3>
          <p className="text-2xl sm:text-3xl font-bold">₹{fallbackBudget.toFixed(2)}</p>
        </div>
      </div>

      {/* ✅ Edit Budgets Button */}
      <button
        onClick={() => setBudgetModalOpen(true)}
        className={`${darkMode ? "bg-purple-700" : "bg-purple-600"} text-white px-4 py-2 rounded-md flex items-center gap-2`}
      >
        <Pencil size={16} /> Edit Budget Per Person
      </button>

      {/* ✅ Budget vs Spent Section */}
      <div className={`rounded-lg shadow-md p-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
          Budget vs Spent by Person
        </h2>

        <div className="space-y-3">
          {uniquePayers.map((payer) => {
            const spent = payerTotals[payer];
            const budget = personBudgets[payer] ?? fallbackBudget;

            return (
              <div
                key={payer}
                className={`flex justify-between items-center p-3 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}
              >
                <span className={`font-medium ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                  {payer}
                </span>

                <div className="text-right">
                  <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Budget: ₹{budget.toFixed(2)}
                  </p>
                  <p className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                    Spent: ₹{spent.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ Budget Modal */}
      {budgetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg w-80 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Set Budget Per Person
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uniquePayers.map((payer) => (
                <div key={payer}>
                  <label className={`${darkMode ? "text-gray-300" : "text-gray-800"} text-sm mb-1 block`}>
                    {payer}
                  </label>
                  <input
                    type="number"
                    value={personBudgets[payer] ?? fallbackBudget}
                    onChange={(e) =>
                      setPersonBudgets((prev) => ({
                        ...prev,
                        [payer]: parseFloat(e.target.value),
                      }))
                    }
                    className={`w-full px-3 py-2 border rounded-md ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setBudgetModalOpen(false)}
                className="px-3 py-2 bg-gray-500 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={saveBudgetsToDB}
                className="px-3 py-2 bg-blue-600 text-white rounded-md"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
