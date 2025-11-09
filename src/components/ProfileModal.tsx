import { useEffect, useState } from "react";
import { X, Save, User } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ProfileModalProps {
  darkMode: boolean;
  onClose: () => void;
}

export default function ProfileModal({ darkMode, onClose }: ProfileModalProps) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [vault, setVault] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // ✅ Fetch user profile on modal open
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return;

    const uid = user.user.id;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (error) return;

    if (data) {
      setName(data.name || "");
      setBudget(data.budget?.toString() || "");
      setVault(data.vault_note || "");
      if (data.avatar_url) setAvatarPreview(data.avatar_url);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error("User not authenticated.");

      const uid = user.user.id;

      let avatarUrl = avatarPreview;

      // ✅ Upload new avatar
      if (avatarFile) {
        const fileName = `avatar-${uid}-${Date.now()}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, {
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = publicUrl.publicUrl;
      }

      // ✅ Save profile data
      const { error } = await supabase.from("profiles").upsert({
        id: uid,              // important!
        name,
        budget: Number(budget),
        avatar_url: avatarUrl,
        vault_note: vault,
        updated_at: new Date(),
      });

      if (error) throw error;

      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className={`w-full max-w-md rounded-xl p-6 shadow-lg ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Profile</h2>
          <button onClick={onClose}>
            <X
              size={22}
              className={darkMode ? "text-gray-300" : "text-gray-600"}
            />
          </button>
        </div>

        {/* ✅ Avatar Preview */}
        <div className="flex flex-col items-center mb-4">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              className="w-24 h-24 rounded-full object-cover mb-2 border"
              alt="avatar"
            />
          ) : (
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-2 ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              <User size={40} />
            </div>
          )}

          <label
            className="text-sm cursor-pointer font-medium underline"
          >
            Choose Avatar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }
              }}
            />
          </label>
        </div>

        {/* ✅ Name */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Name</label>
          <input
            type="text"
            className={`w-full p-2 rounded-lg border ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-gray-100 border-gray-300"
            }`}
            placeholder="Your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* ✅ Budget */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Budget Limit (₹)</label>
          <input
            type="number"
            className={`w-full p-2 rounded-lg border ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-gray-100 border-gray-300"
            }`}
            placeholder="Enter budget amount..."
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        {/* ✅ Vault */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Personal Vault</label>
          <textarea
            className={`w-full p-2 rounded-lg border h-28 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-gray-100 border-gray-300"
            }`}
            placeholder="Your private note..."
            value={vault}
            onChange={(e) => setVault(e.target.value)}
          ></textarea>
        </div>

        {/* ✅ Save Button */}
        <button
          disabled={loading}
          onClick={handleSave}
          className={`w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition ${
            darkMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Save size={18} />
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
