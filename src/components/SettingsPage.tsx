import { useState } from "react";
import { ArrowLeft, Save, Info, ChevronDown, ChevronUp } from "lucide-react";

interface SettingsPageProps {
  darkMode: boolean;
  onBack: () => void;
  profileName: string;
  setProfileName: (val: string) => void;
}

export default function SettingsPage({
  darkMode,
  onBack,
  profileName,
  setProfileName
}: SettingsPageProps) {
  const [nameInput, setNameInput] = useState(profileName);
  const [showAbout, setShowAbout] = useState(false); // ✅ toggle state

  const saveName = () => {
    if (!nameInput.trim()) return;
    setProfileName(nameInput);
  };

  return (
    <div
      className={`p-6 rounded-xl shadow-lg ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      }`}
    >
      {/* Back button (hidden on mobile) */}
      <button
        onClick={onBack}
        className={`hidden md:flex items-center gap-2 mb-4 px-4 py-2 rounded-lg text-sm font-medium
        ${
          darkMode
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        <ArrowLeft size={18} />
        Back Home
      </button>

      <h2 className="text-xl font-bold mb-4">Settings</h2>

      {/* Profile Name */}
      <label className="text-sm opacity-80">Profile Name</label>
      <input
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        className={`w-full mt-2 px-3 py-2 rounded-lg outline-none border ${
          darkMode
            ? "bg-gray-700 border-gray-600 text-white"
            : "bg-gray-200 border-gray-300 text-gray-800"
        }`}
      />

      <button
        onClick={saveName}
        className={`mt-3 px-4 py-2 rounded-lg flex items-center gap-2 ${
          darkMode
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        <Save size={18} />
        Save
      </button>

      {/* ✅ ABOUT SECTION (EXPANDABLE) */}
      <div
        className={`mt-6 p-4 rounded-xl border shadow-sm ${
          darkMode
            ? "bg-gray-700 border-gray-600 text-white"
            : "bg-gray-100 border-gray-300 text-gray-800"
        }`}
      >
        {/* Header clickable */}
        <div
          onClick={() => setShowAbout(!showAbout)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Info size={22} />
            <h3 className="text-lg font-semibold">About This App</h3>
          </div>

          {showAbout ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {/* Expanded content */}
        {showAbout && (
          <div className="mt-3 border-t pt-3 text-sm space-y-2">
            <p className="opacity-90 leading-relaxed">
              Trip Expense helps you easily record, track, and split expenses
              while traveling with friends or family. Keep your budget organized
              with summaries, charts, and a clean UI.
            </p>

            <p className="opacity-90">
              <span className="font-semibold">Developer:</span> Ayush Anupam
            </p>

            <p className="opacity-90">
              <span className="font-semibold">Version:</span> 1.0.0
            </p>

            <p className="opacity-90">
              <span className="font-semibold">Technologies Used:</span>
              <br />• React + Vite <br />• TypeScript <br />• Tailwind CSS <br />• Supabase (for data & backend) <br />• Lucide Icons
            </p>

            <p className="opacity-90">
              Designed for simplicity, speed, and smooth user experience.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
