import { useState } from 'react';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase, Expense } from '../lib/supabase';
import { downloadExpensesPDF } from '../utils/downloadPDF';

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

  // ✅ Range Modal
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  // ✅ Local date safe converter
  const toLocalYMD = (d: Date) => {
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  };

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

      cancelEdit();
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
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No expenses yet. Add your first expense.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

      {/* ✅ HEADER */}
      <div
        className={`px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 
        ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
      >
        <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Expense List
        </h2>

        <button
          onClick={() => setShowRangeModal(true)}
          className={`px-3 py-1 rounded-md text-sm shadow-sm transition 
          ${darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
        >
          Download PDF
        </button>
      </div>

      {/* ✅ DATE RANGE MODAL */}
      {showRangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl w-80 border 
            ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>

            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Choose Range
            </h3>

            {/* ✅ QUICK SELECT */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  const today = toLocalYMD(new Date());
                  const filtered = expenses.filter(
                    exp => toLocalYMD(new Date(exp.date)) === today
                  );
                  downloadExpensesPDF(filtered, 'Today_History');
                  setShowRangeModal(false);
                }}
                className={`px-3 py-1 text-xs rounded-md shadow 
                  ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                Today
              </button>

              <button
                onClick={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  const yesterday = toLocalYMD(y);

                  const filtered = expenses.filter(
                    exp => toLocalYMD(new Date(exp.date)) === yesterday
                  );

                  downloadExpensesPDF(filtered, 'Yesterday_History');
                  setShowRangeModal(false);
                }}
                className={`px-3 py-1 text-xs rounded-md shadow 
                  ${darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                Yesterday
              </button>
            </div>

            {/* ✅ CUSTOM RANGE */}
            <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Start Date
            </label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className={`w-full mb-4 px-3 py-2 border rounded shadow-sm 
                ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />

            <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              End Date
            </label>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className={`w-full mb-4 px-3 py-2 border rounded shadow-sm 
                ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRangeModal(false)}
                className={`px-3 py-1 rounded-md shadow 
                  ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400 text-black'}`}
              >
                Cancel
              </button>

              <button
                disabled={!rangeStart || !rangeEnd}
                onClick={() => {
                  const filtered = expenses.filter((exp) => {
                    const expYMD = toLocalYMD(new Date(exp.date));
                    return expYMD >= rangeStart && expYMD <= rangeEnd;
                  });

                  downloadExpensesPDF(filtered, `History_${rangeStart}_to_${rangeEnd}`);
                  setShowRangeModal(false);
                }}
                className={`px-3 py-1 rounded-md shadow disabled:opacity-50 
                  ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className={`${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700 border-gray-200'} border-b`}>
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider">Date</th>
              <th className="px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider">Payer</th>
              <th className="px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider">Category</th>
              <th className="px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider">Amount</th>
              <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left font-medium uppercase tracking-wider">Description</th>
              <th className="px-3 sm:px-6 py-3 text-right font-medium uppercase tracking-wider">Action</th>
            </tr>
          </thead>

          <tbody className={`${darkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className={`transition ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                {editingId === expense.id ? (
                  <>
                    <td className="px-3 sm:px-6 py-4">
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className={`w-full px-2 py-1 border rounded text-xs sm:text-sm 
                        ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                      />
                    </td>

                    <td className="px-3 sm:px-6 py-4">
                      <input
                        type="text"
                        value={editForm.payer}
                        onChange={(e) => setEditForm({ ...editForm, payer: e.target.value })}
                        className={`w-full px-2 py-1 border rounded text-xs sm:text-sm 
                        ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                      />
                    </td>

                    <td className="px-3 sm:px-6 py-4">
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className={`w-full px-2 py-1 border rounded text-xs sm:text-sm 
                        ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
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
                        className={`w-full px-2 py-1 border rounded text-xs sm:text-sm 
                        ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                      />
                    </td>

                    <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className={`w-full px-2 py-1 border rounded text-xs sm:text-sm 
                        ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                      />
                    </td>

                    <td className="px-3 sm:px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => saveEdit(expense.id)}
                        disabled={loading}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs shadow-sm 
                          ${darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={loading}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs shadow-sm 
                          ${darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-400 hover:bg-gray-500 text-white'}`}
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`px-3 sm:px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatDate(expense.date)}
                    </td>

                    <td className={`px-3 sm:px-6 py-4 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {expense.payer}
                    </td>

                    <td className="px-3 sm:px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full 
                        ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                        {expense.category}
                      </span>
                    </td>

                    <td className={`px-3 sm:px-6 py-4 font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      ₹{expense.amount.toFixed(2)}
                    </td>

                    <td className={`hidden sm:table-cell px-3 sm:px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {expense.description || '-'}
                    </td>

                    <td className="px-3 sm:px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => startEdit(expense)}
                        disabled={loading}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs shadow-sm 
                          ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => deleteExpense(expense.id)}
                        disabled={loading}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs shadow-sm 
                          ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
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
