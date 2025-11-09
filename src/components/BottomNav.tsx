import { Home, PlusCircle, BarChart3, History, FileText } from "lucide-react";

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
}

export default function BottomNav({ currentTab, setCurrentTab, darkMode }: BottomNavProps) {
  return (
    <nav
      className={`
        fixed inset-x-0 bottom-0 z-[999] 
        flex items-center justify-around 
        py-2 border-t pointer-events-auto
        backdrop-blur-md
        ${
          darkMode
            ? "bg-gray-900/90 border-gray-700"
            : "bg-white/90 border-gray-200"
        }
        md:hidden
        pb-[calc(env(safe-area-inset-bottom,0)+8px)]
      `}
    >
      {/* ✅ HOME */}
      <button
        onClick={() => setCurrentTab("home")}
        className="flex flex-col items-center active:scale-95 transition-transform"
      >
        <Home
          size={28}
          className={`transition-colors ${
            currentTab === "home"
              ? darkMode
                ? "text-blue-400"
                : "text-blue-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        />
        <span
          className={`text-[11px] font-medium ${
            currentTab === "home"
              ? darkMode
                ? "text-blue-400"
                : "text-blue-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        >
          Home
        </span>
      </button>

      {/* ✅ ADD */}
      <button
        onClick={() => setCurrentTab("add")}
        className="flex flex-col items-center active:scale-95 transition-transform"
      >
        <PlusCircle
          size={32}
          className={`transition-colors ${
            currentTab === "add"
              ? darkMode
                ? "text-green-400"
                : "text-green-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        />
        <span
          className={`text-[11px] font-medium ${
            currentTab === "add"
              ? darkMode
                ? "text-green-400"
                : "text-green-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        >
          Add
        </span>
      </button>

      {/* ✅ SUMMARY */}
      <button
        onClick={() => setCurrentTab("summary")}
        className="flex flex-col items-center active:scale-95 transition-transform"
      >
        <BarChart3
          size={28}
          className={`transition-colors ${
            currentTab === "summary"
              ? darkMode
                ? "text-purple-400"
                : "text-purple-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        />
        <span
          className={`text-[11px] font-medium ${
            currentTab === "summary"
              ? darkMode
                ? "text-purple-400"
                : "text-purple-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        >
          Summary
        </span>
      </button>

      {/* ✅ FILES */}
      <button
        onClick={() => setCurrentTab("files")}
        className="flex flex-col items-center active:scale-95 transition-transform"
      >
        <FileText
          size={28}
          className={`transition-colors ${
            currentTab === "files"
              ? darkMode
                ? "text-teal-400"
                : "text-teal-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        />
        <span
          className={`text-[11px] font-medium ${
            currentTab === "files"
              ? darkMode
                ? "text-teal-400"
                : "text-teal-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        >
          Files
        </span>
      </button>

      {/* ✅ HISTORY */}
      <button
        onClick={() => setCurrentTab("history")}
        className="flex flex-col items-center active:scale-95 transition-transform"
      >
        <History
          size={28}
          className={`transition-colors ${
            currentTab === "history"
              ? darkMode
                ? "text-orange-400"
                : "text-orange-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        />
        <span
          className={`text-[11px] font-medium ${
            currentTab === "history"
              ? darkMode
                ? "text-orange-400"
                : "text-orange-600"
              : darkMode
              ? "text-gray-400"
              : "text-gray-600"
          }`}
        >
          History
        </span>
      </button>
    </nav>
  );
}
