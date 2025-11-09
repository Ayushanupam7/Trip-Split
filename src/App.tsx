import { useEffect, useState } from 'react';
import { Plane, Moon, Sun } from 'lucide-react';
import { supabase, Expense } from './lib/supabase';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import ExpenseChart from './components/ExpenseChart';
import Summary from './components/Summary';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setExpenses(data || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`${darkMode ? 'bg-blue-700' : 'bg-blue-600'} p-3 rounded-lg`}>
                <Plane className="text-white" size={32} />
              </div>
              <div>
                <h1 className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Trip Expense Tracker
                </h1>
                <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage and split your group travel expenses
                </p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
          </div>
        ) : (
          <div className="space-y-8">
            <ExpenseForm onExpenseAdded={fetchExpenses} darkMode={darkMode} />

            <Summary expenses={expenses} darkMode={darkMode} />

            <ExpenseChart expenses={expenses} darkMode={darkMode} />

            <ExpenseList expenses={expenses} onExpenseChanged={fetchExpenses} darkMode={darkMode} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
