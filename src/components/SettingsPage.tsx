import { useState, useEffect, useRef } from "react";
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
  const [showAbout, setShowAbout] = useState(false);

  // ⭐ swipe tracking refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // ⭐ Enable swipe-back only on mobile (screen < 768px)
  useEffect(() => {
    if (window.innerWidth >= 768) return; // desktop: disable swipe gesture

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.changedTouches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;

      const distance = touchEndX.current - touchStartX.current;

      // if user swipes from left to right (60px threshold)
      if (distance > 60) {
        onBack();
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onBack]);

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
      {/* Back button (hidden on mobile, since swipe exists) */}
      <button
        onClick={onBack}
        className={`hidden md:flex items-center gap-2 mb-4 px-4 py-2 rounded-lg text-sm font-medium
        ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
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

      {/* ABOUT SECTION (dropdown) */}
      <div
        className={`mt-6 p-4 rounded-xl border shadow-sm ${
          darkMode
            ? "bg-gray-700 border-gray-600 text-white"
            : "bg-gray-100 border-gray-300 text-gray-800"
        }`}
      >
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

        {showAbout && (
          <div className="mt-3 border-t pt-3 text-sm space-y-2">
            <p className="opacity-90 leading-relaxed">
              Trip Expense helps you record and split expenses while traveling.
              View charts, summaries, and keep everything neatly organized.
            </p>

            <p className="opacity-90">
              <span className="font-semibold">Developer:</span> Ayush Anupam
            </p>

            <p className="opacity-90">
              <span className="font-semibold">Version:</span> 1.0.0
            </p>

            <p className="opacity-90">
              <span className="font-semibold">Technologies Used:</span>
              <br />• React + Vite <br />• TypeScript <br />• Tailwind CSS
              <br />• Supabase <br />• Lucide Icons
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
