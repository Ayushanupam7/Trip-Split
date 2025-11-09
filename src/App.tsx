import { useEffect, useState } from "react";
import { Plane, Moon, Sun, Settings } from "lucide-react";
import { supabase, Expense } from "./lib/supabase";

import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import ExpenseChart from "./components/ExpenseChart";
import Summary from "./components/Summary";
import BottomNav from "./components/BottomNav";
import SettingsPage from "./components/SettingsPage";

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTab, setCurrentTab] = useState("home");

  // ✅ Profile name saved in LocalStorage
  const [profileName, setProfileName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("profileName") || "Guest";
    }
    return "Guest";
  });

  // ✅ Dynamic greeting
  const [greeting, setGreeting] = useState("");

  // ✅ Dark Mode LocalStorage Sync
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("darkMode") === "true" ||
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    }
    return false;
  });

  // ✅ GREETING FUNCTION
  const generateGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  // ✅ AUTO REFRESH GREETING
  useEffect(() => {
    setGreeting(generateGreeting()); // initial greeting

    const interval = setInterval(() => {
      setGreeting(generateGreeting());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ✅ EXPENSES FETCH
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ✅ Save dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  // ✅ Save updated profile name to localStorage
  useEffect(() => {
    localStorage.setItem("profileName", profileName);
  }, [profileName]);

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "dark bg-gray-900"
          : "bg-gradient-to-br from-gray-50 to-gray-100"
      }
      pt-[calc(env(safe-area-inset-top,0)+85px)]
      pb-[calc(env(safe-area-inset-bottom,0)+24px)]
      `}
    >
      {/* ✅ HEADER */}
      <header
        className={`fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-3 border-b shadow-sm pt-[calc(env(safe-area-inset-top,0)+12px)] ${
          darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* ✅ LOGO */}
          <div className="flex items-center gap-3">
            <div
              className={`${
                darkMode ? "bg-blue-700" : "bg-blue-600"
              } p-2 rounded-lg`}
            >
              <Plane className="text-white" size={28} />
            </div>
            <div>
              <h1
                className={`text-xl sm:text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Trip Expense
              </h1>
              <p
                className={`text-xs sm:text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Track & Split Expenses
              </p>
            </div>
          </div>

          {/* ✅ RIGHT BUTTONS */}
          <div className="flex items-center gap-2">
            {/* SETTINGS */}
            <button
              onClick={() => setCurrentTab("settings")}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-blue-400"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              <Settings size={22} />
            </button>

            {/* DARK MODE */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-yellow-400"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ✅ GREETING UI */}
      <div className="px-4 sm:px-6 mt-4">
        <div
          className={`transition-all duration-500 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            {greeting},
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent font-extrabold">
              {profileName}
            </span>
          </h2>

          <p
            className={`mt-1 text-sm sm:text-base ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Welcome back! Let's track your journey.
          </p>
        </div>
      </div>

      {/* ✅ MAIN CONTENT */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {error && (
          <div className="mb-6 p-4 bg-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                darkMode ? "border-blue-400" : "border-blue-600"
              }`}
            ></div>
          </div>
        ) : (
          <div className="space-y-8">
            {currentTab === "home" && (
              <>
                <ExpenseForm
                  onExpenseAdded={fetchExpenses}
                  darkMode={darkMode}
                />
                <Summary expenses={expenses} darkMode={darkMode} />
                <ExpenseChart expenses={expenses} darkMode={darkMode} />
                <ExpenseList
                  expenses={expenses}
                  onExpenseChanged={fetchExpenses}
                  darkMode={darkMode}
                />
              </>
            )}

            {currentTab === "add" && (
              <ExpenseForm
                onExpenseAdded={fetchExpenses}
                darkMode={darkMode}
              />
            )}

            {currentTab === "summary" && (
              <Summary expenses={expenses} darkMode={darkMode} />
            )}

            {currentTab === "history" && (
              <ExpenseList
                expenses={expenses}
                onExpenseChanged={fetchExpenses}
                darkMode={darkMode}
              />
            )}

            {currentTab === "settings" && (
              <SettingsPage
                darkMode={darkMode}
                onBack={() => setCurrentTab("home")}
                profileName={profileName}
                setProfileName={setProfileName}
              />
            )}
          </div>
        )}
      </div>

      {/* ✅ BOTTOM NAV WITH SAFE-AREA SUPPORT */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        darkMode={darkMode}
      />
    </div>
  );
}

export default App;
