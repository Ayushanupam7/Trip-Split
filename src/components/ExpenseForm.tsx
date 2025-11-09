import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ExpenseFormProps {
  onExpenseAdded: () => void;
  darkMode: boolean;
}

const categories = ['Food', 'Travel', 'Hotel', 'Tickets', 'Entertainment', 'Shopping', 'Other'];

export default function ExpenseForm({ onExpenseAdded, darkMode }: ExpenseFormProps) {
  const [payer, setPayer] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allPayers, setAllPayers] = useState<string[]>([]);

  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Fetch past payer names
  useEffect(() => {
    const fetchPayers = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('payer')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const unique = [...new Set(data.map((item) => item.payer.trim()))];
        setAllPayers(unique);
      }
    };

    fetchPayers();
  }, []);

  // ✅ Filter suggestions when typing
  useEffect(() => {
    if (payer.trim() === '') {
      setSuggestions([]);
      return;
    }

    const filtered = allPayers.filter((name) =>
      name.toLowerCase().includes(payer.toLowerCase())
    );

    setSuggestions(filtered);
  }, [payer, allPayers]);

  const handleSelectSuggestion = (name: string) => {
    setPayer(name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!payer || !amount || parseFloat(amount) <= 0) {
      setError('Please fill in all required fields with valid values');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('expenses').insert([
        {
          payer: payer.trim(),
          category,
          amount: parseFloat(amount),
          description: description.trim(),
          date: new Date(date).toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setPayer('');
      setCategory('Food');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      onExpenseAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-lg shadow-md p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      
      <h2 className={`text-xl sm:text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Add New Expense
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ✅ PAYER SUGGESTION FIELD */}
        <div className="relative">
          <label
            htmlFor="payer"
            className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Payer Name *
          </label>

          <input
            type="text"
            id="payer"
            value={payer}
            onChange={(e) => {
              setPayer(e.target.value);
              setShowSuggestions(true);
            }}
            placeholder="Who paid?"
            autoComplete="off"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
            required
          />

          {/* ✅ Suggestion Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              className={`absolute z-20 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-40 overflow-auto`}
            >
              {suggestions.map((name, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectSuggestion(name)}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    darkMode ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ✅ REST OF INPUTS SAME AS YOUR ORIGINAL CODE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="category"
              className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="amount"
              className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Amount (₹) *
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
              required
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Date *
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this expense for?"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Plus size={20} />
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}
