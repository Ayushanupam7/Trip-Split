import { useEffect, useState } from "react";
import { Expense, supabase } from "../lib/supabase";
import {
  DollarSign,
  Users,
  Wallet,
  TrendingDown,
  Pencil,
} from "lucide-react";
import { useSwipeable } from "react-swipeable";

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
    const { data } = await supabase.from("person_budgets").select("*");
    if (data) {
      const mapped = Object.fromEntries(data.map((b) => [b.payer, b.budget]));
      setPersonBudgets(mapped);
    }
  };

  // ✅ Create missing budget entries for new payers
  const syncMissingBudgets = async () => {
    const { data } = await supabase.from("person_budgets").select("payer");
    const existing = new Set(data?.map((d) => d.payer));

    for (const payer of uniquePayers) {
      if (!existing.has(payer)) {
        await supabase
          .from("person_budgets")
          .insert([{ payer, budget: fallbackBudget }]);
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

  const totalBudget =
    Object.values(personBudgets).reduce((a, b) => a + b, 0) || 0;
  const remainingBudget = totalBudget - totalExpenses;

  const cards = [
    {
      title: "Total Expenses",
      value: `₹${totalExpenses.toFixed(2)}`,
      gradient: "from-blue-500 to-blue-600",
      icon: <DollarSign size={28} className="opacity-90" />,
      percent: totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0,
    },
    {
      title: "Number of People",
      value: numberOfPeople,
      gradient: "from-green-500 to-green-600",
      icon: <Users size={28} className="opacity-90" />,
      percent: 100,
    },
    {
      title: "Total Budget",
      value: `₹${totalBudget.toFixed(2)}`,
      gradient: "from-orange-500 to-orange-600",
      icon: <Wallet size={28} className="opacity-90" />,
      percent: 100,
    },
    {
      title: "Remaining Budget",
      value:
        remainingBudget >= 0
          ? `₹${remainingBudget.toFixed(2)}`
          : `Over by ₹${Math.abs(remainingBudget).toFixed(2)}`,
      gradient: "from-purple-500 to-purple-600",
      icon: <TrendingDown size={28} className="opacity-90" />,
      percent: remainingBudget > 0 ? (remainingBudget / totalBudget) * 100 : 0,
    },
  ];

  const [index, setIndex] = useState(0);

  const handlers = useSwipeable({
    onSwipedLeft: () => setIndex((prev) => Math.min(prev + 1, cards.length - 1)),
    onSwipedRight: () => setIndex((prev) => Math.max(prev - 1, 0)),
    trackMouse: true,
  });

  if (expenses.length === 0) {
    return (
      <div
        className={`rounded-lg shadow-md p-8 text-center ${
          darkMode ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"
        }`}
      >
        Add expenses to see the summary.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ Mobile Swipeable Cards */}
      <div className="sm:hidden w-full overflow-hidden" {...handlers}>
        <div
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {cards.map((card, i) => (
            <div key={i} className="w-full flex-shrink-0 px-2">
              <div
                className={`p-6 rounded-2xl shadow-xl text-white bg-gradient-to-br ${card.gradient} relative overflow-hidden active:scale-95 transition-all`}
              >
                <div className="absolute inset-0 bg-black/10 rounded-2xl pointer-events-none"></div>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{card.title}</h3>
                  {card.icon}
                </div>

                <p className="text-4xl font-bold mt-2">{card.value}</p>

                <div className="w-full bg-white/30 rounded-full h-3 mt-4">
                  <div
                    className="h-3 rounded-full bg-white transition-all"
                    style={{ width: `${Math.min(card.percent, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ Indicators */}
        <div className="flex justify-center mt-3 gap-2">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === index ? "bg-blue-500 w-6" : "bg-gray-400 w-2"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ✅ Desktop Grid */}
      <div className="hidden sm:grid grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl shadow-lg bg-gradient-to-br ${card.gradient} text-white relative`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium opacity-90">{card.title}</h3>
              {card.icon}
            </div>

            <p className="text-3xl font-bold mt-2">{card.value}</p>

            <div className="w-full bg-white/30 rounded-full h-3 mt-4">
              <div
                className="h-3 rounded-full bg-white"
                style={{
                  width: `${Math.min(card.percent, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Edit Button */}
      <button
        onClick={() => setBudgetModalOpen(true)}
        className={`${
          darkMode ? "bg-purple-700" : "bg-purple-600"
        } text-white px-4 py-2 rounded-md flex items-center gap-2`}
      >
        <Pencil size={16} /> Edit Budget Per Person
      </button>

      {/* ✅ Budget vs Spent */}
      <div
        className={`rounded-xl shadow-md p-4 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2
          className={`text-xl font-bold mb-4 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          Budget vs Spent by Person
        </h2>

        <div className="space-y-3">
          {uniquePayers.map((payer) => {
            const spent = payerTotals[payer];
            const budget = personBudgets[payer] ?? fallbackBudget;
            const remain = budget - spent;

            const percentage = budget > 0 ? (spent / budget) * 100 : 0;
            const progressWidth = Math.min(percentage, 100);

            return (
              <div
                key={payer}
                className={`p-4 rounded-lg border flex flex-col gap-2 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <span
                  className={`text-lg font-semibold ${
                    darkMode ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  {payer}
                </span>

                <p
                  className={`text-xs ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Budget: ₹{budget.toFixed(2)}
                </p>

                <p
                  className={`text-sm font-semibold ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  Spent: ₹{spent.toFixed(2)}
                </p>

                <div
                  className={`w-full h-3 rounded-full overflow-hidden ${
                    darkMode ? "bg-gray-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      remain >= 0
                        ? "bg-gradient-to-r from-green-400 to-green-500"
                        : "bg-gradient-to-r from-red-500 to-red-700"
                    }`}
                    style={{ width: `${progressWidth}%` }}
                  ></div>
                </div>

                <p
                  className={`text-xs ${
                    remain >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {remain >= 0
                    ? `Remaining: ₹${remain.toFixed(2)}`
                    : `Over by ₹${Math.abs(remain).toFixed(2)}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ Budget Modal */}
      {budgetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg w-80 ${
              darkMode ? "bg-gray-900" : "bg-white"
            }`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Set Budget Per Person
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uniquePayers.map((payer) => (
                <div key={payer}>
                  <label
                    className={`text-sm mb-1 block ${
                      darkMode ? "text-gray-300" : "text-gray-800"
                    }`}
                  >
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
                        : "bg-gray-50 border-gray-300 text-gray-900"
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
