import { useMemo, useState } from "react";
import { Pencil, Trash2, Save, X, Search, AlertTriangle } from "lucide-react";
import { supabase, Expense } from "../lib/supabase";
import { downloadExpensesPDF } from "../utils/downloadPDF";

interface ExpenseListProps {
  expenses: Expense[];
  onExpenseChanged: () => void;
  darkMode: boolean;
}

const categories = [
  "All",
  "Food",
  "Travel",
  "Hotel",
  "Tickets",
  "Entertainment",
  "Shopping",
  "Other",
];

export default function ExpenseList({
  expenses,
  onExpenseChanged,
  darkMode,
}: ExpenseListProps) {
  const [loading, setLoading] = useState(false);

  // Range modal
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  // Search + Filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; expense: Expense | null }>({
    show: false,
    expense: null,
  });

  // Edit modal
  const [editModal, setEditModal] = useState<{ show: boolean; expense: Expense | null }>({
    show: false,
    expense: null,
  });
  const [editForm, setEditForm] = useState<Partial<Expense>>({});

  // ---------- Helpers ----------
  const toLocalYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // ---------- Filtered list (memoized) ----------
  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((exp) => {
      const matchesSearch =
        q.length === 0 ||
        exp.payer.toLowerCase().includes(q) ||
        (exp.description || "").toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "All" || exp.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, selectedCategory]);

  // ---------- CRUD ----------
  const startEdit = (expense: Expense) => {
    setEditModal({ show: true, expense });
    setEditForm({
      payer: expense.payer,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      date: expense.date.split("T")[0],
    });
  };

  const cancelEdit = () => {
    setEditModal({ show: false, expense: null });
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editModal.expense || !editForm.payer || !editForm.amount || editForm.amount <= 0) return;
    
    setLoading(true);
    try {
      await supabase
        .from("expenses")
        .update({
          payer: editForm.payer.trim(),
          category: editForm.category,
          amount: editForm.amount,
          description: (editForm.description || "").trim(),
          date: new Date(editForm.date!).toISOString(),
        })
        .eq("id", editModal.expense.id);
      cancelEdit();
      onExpenseChanged();
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (expense: Expense) => {
    setDeleteModal({ show: true, expense });
  };

  const deleteExpense = async () => {
    if (!deleteModal.expense) return;
    
    setLoading(true);
    try {
      await supabase.from("expenses").delete().eq("id", deleteModal.expense.id);
      setDeleteModal({ show: false, expense: null });
      onExpenseChanged();
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, expense: null });
  };

  // ---------- Row sub-component ----------
  function ExpenseRow({
    exp,
  }: {
    exp: Expense;
  }) {
    return (
      <tr
        className={`transition-all ${
          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
        }`}
      >
        <td className={`px-3 sm:px-6 py-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          {formatDate(exp.date)}
        </td>

        <td className={`px-3 sm:px-6 py-3 font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
          {exp.payer}
        </td>

        <td className="px-3 sm:px-6 py-3">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
            }`}
          >
            {exp.category}
          </span>
        </td>

        <td className={`px-3 sm:px-6 py-3 font-semibold ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
          ₹{exp.amount.toFixed(2)}
        </td>

        <td className={`hidden sm:table-cell px-3 sm:px-6 py-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {exp.description || "-"}
        </td>

        {/* Action buttons - visible on all screen sizes */}
        <td className="px-3 sm:px-6 py-3 text-right">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => startEdit(exp)}
              className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-600 hover:bg-blue-700 text-white shadow transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => confirmDelete(exp)}
              className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-600 hover:bg-red-700 text-white shadow transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  // ---------- Empty state ----------
  if (expenses.length === 0) {
    return (
      <div className={`rounded-lg shadow-md p-8 text-center ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
        <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          No expenses yet. Add your first expense.
        </p>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
      {/* Top bar: Search + Filter + PDF */}
      <div
        className={`px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b ${
          darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-200"
        }`}
      >
        <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Expense List</h2>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
          {/* Search */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-md w-full sm:w-64 border ${
              darkMode 
                ? "bg-gray-600 text-white border-gray-500 focus-within:border-blue-500" 
                : "bg-white text-gray-700 border-gray-300 focus-within:border-blue-500"
            } transition-colors`}
          >
            <Search size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
            <input
              type="text"
              placeholder="Search payer or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full outline-none text-sm bg-transparent ${
                darkMode ? "text-white placeholder-gray-400" : "text-gray-700 placeholder-gray-500"
              }`}
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-2 rounded-md text-sm border transition-colors ${
              darkMode
                ? "bg-gray-600 text-white border-gray-500 hover:border-gray-400"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
            }`}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* PDF */}
          <button
            onClick={() => setShowRangeModal(true)}
            className={`px-4 py-2 rounded-md text-sm shadow transition-colors ${
              darkMode 
                ? "bg-purple-600 hover:bg-purple-700 text-white" 
                : "bg-purple-500 hover:bg-purple-600 text-white"
            }`}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-lg w-full max-w-md border shadow-xl ${
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Edit Expense
              </h3>
              <button
                onClick={cancelEdit}
                className={`p-1 rounded-full transition-colors ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                <X size={20} className={darkMode ? "text-gray-400" : "text-gray-500"} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Date *
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className={`w-full p-2 border rounded mt-1 transition-colors ${
                    darkMode 
                      ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" 
                      : "bg-white border-gray-300 focus:border-blue-500"
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Payer *
                </label>
                <input
                  type="text"
                  value={editForm.payer}
                  onChange={(e) => setEditForm({ ...editForm, payer: e.target.value })}
                  placeholder="Enter payer name"
                  className={`w-full p-2 border rounded mt-1 transition-colors ${
                    darkMode 
                      ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500 placeholder-gray-400" 
                      : "bg-white border-gray-300 focus:border-blue-500 placeholder-gray-500"
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Category *
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className={`w-full p-2 border rounded mt-1 transition-colors ${
                    darkMode 
                      ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" 
                      : "bg-white border-gray-300 focus:border-blue-500"
                  }`}
                  required
                >
                  {categories
                    .filter((c) => c !== "All")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`w-full p-2 border rounded mt-1 transition-colors ${
                    darkMode 
                      ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500 placeholder-gray-400" 
                      : "bg-white border-gray-300 focus:border-blue-500 placeholder-gray-500"
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Description
                </label>
                <textarea
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className={`w-full p-2 border rounded mt-1 transition-colors resize-none ${
                    darkMode 
                      ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500 placeholder-gray-400" 
                      : "bg-white border-gray-300 focus:border-blue-500 placeholder-gray-500"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelEdit}
                disabled={loading}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={loading || !editForm.payer || !editForm.amount || editForm.amount <= 0}
                className="px-4 py-2 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-lg w-full max-w-md border shadow-xl ${
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${darkMode ? "bg-red-900/20" : "bg-red-100"}`}>
                <AlertTriangle className={darkMode ? "text-red-400" : "text-red-600"} size={24} />
              </div>
              <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Delete Expense
              </h3>
            </div>

            <p className={`mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Are you sure you want to delete the expense from{" "}
              <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {deleteModal.expense?.payer}
              </span>{" "}
              for{" "}
              <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                ₹{deleteModal.expense?.amount.toFixed(2)}
              </span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={loading}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={deleteExpense}
                disabled={loading}
                className="px-4 py-2 rounded text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Deleting..." : "Delete Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date range modal */}
      {showRangeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-lg w-full max-w-md border shadow-xl ${
            darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Choose Date Range
            </h3>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  const today = toLocalYMD(new Date());
                  const filtered = expenses.filter((exp) => toLocalYMD(new Date(exp.date)) === today);
                  downloadExpensesPDF(filtered, "Today_History");
                  setShowRangeModal(false);
                }}
                className={`px-3 py-2 text-xs rounded transition-colors ${
                  darkMode 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Today
              </button>

              <button
                onClick={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  const yd = toLocalYMD(y);
                  const filtered = expenses.filter((exp) => toLocalYMD(new Date(exp.date)) === yd);
                  downloadExpensesPDF(filtered, "Yesterday_History");
                  setShowRangeModal(false);
                }}
                className={`px-3 py-2 text-xs rounded transition-colors ${
                  darkMode 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                Yesterday
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className={`w-full p-2 border rounded mt-1 transition-colors ${
                    darkMode 
                      ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" 
                      : "bg-white border-gray-300 focus:border-blue-500"
                  }`}
                />
              </div>

              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className={`w-full p-2 border rounded mt-1 transition-colors ${
                    darkMode 
                      ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500" 
                      : "bg-white border-gray-300 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowRangeModal(false)} 
                className={`px-4 py-2 rounded text-sm transition-colors ${
                  darkMode 
                    ? "bg-gray-700 hover:bg-gray-600 text-white" 
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                Cancel
              </button>
              <button
                disabled={!rangeStart || !rangeEnd}
                onClick={() => {
                  const filtered = expenses.filter((exp) => {
                    const d = toLocalYMD(new Date(exp.date));
                    return d >= rangeStart && d <= rangeEnd;
                  });
                  downloadExpensesPDF(filtered, `History_${rangeStart}_to_${rangeEnd}`);
                  setShowRangeModal(false);
                }}
                className={`px-4 py-2 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead
            className={`sticky top-0 z-10 border-b ${
              darkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800 border-gray-200"
            }`}
          >
            <tr>
              <th className="px-3 py-3 text-left">Date</th>
              <th className="px-3 py-3 text-left">Payer</th>
              <th className="px-3 py-3 text-left">Category</th>
              <th className="px-3 py-3 text-left">Amount</th>
              <th className="hidden sm:table-cell px-3 py-3 text-left">Description</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No matching expenses found.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => <ExpenseRow key={exp.id} exp={exp} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}