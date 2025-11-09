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

  // ✅ Correct today date without timezone shift
  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset()); 
    return today.toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Fetch payers + last used category
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("payer, category")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        const unique = [...new Set(data.map((item) => item.payer.trim()))];
        setAllPayers(unique);

        if (data.length > 0 && data[0].category) {
          setCategory(data[0].category);
        }
      }
    };

    fetchInitialData();
  }, []);

  // ✅ Live suggestions filter
  useEffect(() => {
    if (payer.trim() === "") {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    const filtered = allPayers.filter((name) =>
      name.toLowerCase().includes(payer.toLowerCase())
    );

    setSuggestions(filtered);
    setActiveIndex(filtered.length > 0 ? 0 : -1);
  }, [payer, allPayers]);

  // ✅ Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeIndex]);
      }
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  // ✅ Select suggestion
  const handleSelectSuggestion = (name: string) => {
    setPayer(name);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!payer || !amount || parseFloat(amount) <= 0) {
      setError("Please fill in all required fields with valid values");
      return;
    }

    setLoading(true);

    try {
      const todayFixed = new Date(date);
      todayFixed.setMinutes(todayFixed.getMinutes() - todayFixed.getTimezoneOffset());

      const { error: insertError } = await supabase.from("expenses").insert([
        {
          payer: payer.trim(),
          category,
          amount: parseFloat(amount),
          description: description.trim(),
          date: todayFixed.toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setPayer("");
      setAmount("");
      setDescription("");

      // ✅ Reset to correct local today again
      const newToday = new Date();
      newToday.setMinutes(newToday.getMinutes() - newToday.getTimezoneOffset());
      setDate(newToday.toISOString().split("T")[0]);

      onExpenseAdded();
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
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
        
        {/* ✅ PAYER FIELD */}
        <div className="relative">
          <label
            className={`block text-sm font-medium mb-1 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
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
            placeholder="Start typing name..."
            autoComplete="off"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            }`}
            required
          />

          {showSuggestions && (
            <ul
              className={`absolute z-20 w-full rounded-md mt-1 shadow-lg max-h-40 overflow-auto border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 shadow-black/50"
                  : "bg-white border-gray-200 shadow-md"
              }`}
            >
              {suggestions.length === 0 ? (
                <li
                  className={`px-3 py-2 text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No match found
                </li>
              ) : (
                suggestions.map((name, index) => (
                  <li
                    key={index}
                    onClick={() => handleSelectSuggestion(name)}
                    className={`px-3 py-2 cursor-pointer transition-colors ${
                      darkMode
                        ? index === activeIndex
                          ? "bg-gray-700 text-white"
                          : "text-gray-200 hover:bg-gray-700"
                        : index === activeIndex
                        ? "bg-gray-100"
                        : "text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {name}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {/* ✅ CATEGORY / AMOUNT / DATE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Amount (₹) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Date *
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required
            />
          </div>
        </div>

        {/* ✅ DESCRIPTION */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What was this expense for?"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
        </div>

        {/* ✅ SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
