import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ExpenseFormProps {
  onExpenseAdded: () => void;
  darkMode: boolean;
}

const categories = [
  "Food",
  "Travel",
  "Hotel",
  "Tickets",
  "Entertainment",
  "Shopping",
  "Other",
];

export default function ExpenseForm({ onExpenseAdded, darkMode }: ExpenseFormProps) {
  const [payer, setPayer] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allPayers, setAllPayers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Correct date
  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fetch payers
  useEffect(() => {
    const fetchInitial = async () => {
      const { data } = await supabase
        .from("expenses")
        .select("payer, category")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        const unique = [...new Set(data.map((item) => item.payer.trim()))];
        setAllPayers(unique);

        if (data[0]?.category) setCategory(data[0].category);
      }
    };

    fetchInitial();
  }, []);

  // Live suggestions
  useEffect(() => {
    if (!payer.trim()) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    const filtered = allPayers.filter((n) =>
      n.toLowerCase().includes(payer.toLowerCase())
    );

    setSuggestions(filtered);
    setActiveIndex(filtered.length > 0 ? 0 : -1);
  }, [payer, allPayers]);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) handleSelect(suggestions[activeIndex]);
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (name: string) => {
    setPayer(name);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!payer || !amount || parseFloat(amount) <= 0) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const fixed = new Date(date);
      fixed.setMinutes(fixed.getMinutes() - fixed.getTimezoneOffset());

      const { error: insertError } = await supabase.from("expenses").insert([
        {
          payer: payer.trim(),
          category,
          amount: parseFloat(amount),
          description: description.trim(),
          date: fixed.toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setPayer("");
      setAmount("");
      setDescription("");

      const today = new Date();
      today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
      setDate(today.toISOString().split("T")[0]);

      onExpenseAdded();
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🌙 DARK MODE DATE PICKER FIX */}
      {darkMode && (
        <style>{`
          input[type="date"] {
            color-scheme: dark;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
          }
        `}</style>
      )}

      <div className={`rounded-lg shadow-md p-4 sm:p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
          Add New Expense
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Payer */}
          <div className="relative">
            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Payer Name *
            </label>

            <input
              type="text"
              value={payer}
              ref={inputRef}
              onChange={(e) => {
                setPayer(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              placeholder="Start typing..."
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            />

            {showSuggestions && (
              <ul
                className={`absolute z-20 w-full mt-1 rounded-md border shadow-lg max-h-40 overflow-auto ${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}
              >
                {suggestions.length === 0 ? (
                  <li className={`px-3 py-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No match found
                  </li>
                ) : (
                  suggestions.map((name, index) => (
                    <li
                      key={index}
                      onClick={() => handleSelect(name)}
                      className={`px-3 py-2 cursor-pointer ${
                        darkMode
                          ? index === activeIndex
                            ? "bg-gray-700 text-white"
                            : "text-gray-200 hover:bg-gray-700"
                          : index === activeIndex
                          ? "bg-gray-100"
                          : "text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Category + Amount + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category */}
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                {categories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Amount (₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            {/* 🌙 Date with dark popup */}
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md resize-none ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
              placeholder="Optional"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 text-white ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Plus size={20} />
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
    </>
  );
}
