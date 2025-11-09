import { useState } from 'react';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase, Expense } from '../lib/supabase';

interface ExpenseListProps {
  expenses: Expense[];
  onExpenseChanged: () => void;
  darkMode: boolean;
}

const categories = ['Food', 'Travel', 'Hotel', 'Tickets', 'Entertainment', 'Shopping', 'Other'];

export default function ExpenseList({ expenses, onExpenseChanged, darkMode }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [loading, setLoading] = useState(false);

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditForm({
      payer: expense.payer,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      date: expense.date.split('T')[0],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    if (!editForm.payer || !editForm.amount || editForm.amount <= 0) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          payer: editForm.payer.trim(),
          category: editForm.category,
          amount: editForm.amount,
          description: editForm.description?.trim() || '',
          date: new Date(editForm.date!).toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditForm({});
      onExpenseChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);

      if (error) throw error;

      onExpenseChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (expenses.length === 0) {
    return (
      <div className={`rounded-lg shadow-md p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No expenses yet. Add your first expense above!</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`px-4 sm:px-6 py-4 border-b ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Expense List</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className={`border-b ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
            <tr>
              <th className={`px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Date
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Payer
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Category
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Amount
              </th>
              <th className={`hidden sm:table-cell px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </th>
              <th className={`px-3 sm:px-6 py-3 text-right font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Action
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {expenses.map((expense) => (
              <tr key={expense.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                {editingId === expense.id ? (
                  <>
                    <td className="px-3 sm:px-6 py-4">
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className={`w-full px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white'
                        }`}
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <input
                        type="text"
                        value={editForm.payer}
                        onChange={(e) => setEditForm({ ...editForm, payer: e.target.value })}
                        className={`w-full px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white'
                        }`}
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className={`w-full px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                        step="0.01"
                        min="0"
                        className={`w-full px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white'
                        }`}
                      />
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className={`w-full px-2 py-1 text-xs sm:text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white'
                        }`}
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => saveEdit(expense.id)}
                        disabled={loading}
                        className="inline-flex items-center px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-xs transition-colors"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={loading}
                        className="inline-flex items-center px-2 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded text-xs transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`px-3 sm:px-6 py-4 text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatDate(expense.date)}
                    </td>
                    <td className={`px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {expense.payer}
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className={`px-3 sm:px-6 py-4 text-xs sm:text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      ₹{expense.amount.toFixed(2)}
                    </td>
                    <td className={`hidden sm:table-cell px-3 sm:px-6 py-4 text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {expense.description || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => startEdit(expense)}
                        disabled={loading}
                        className="inline-flex items-center px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-xs transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        disabled={loading}
                        className="inline-flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded text-xs transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
