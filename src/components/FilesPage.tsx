import { useEffect, useState } from "react";
import { Upload, FileText, Image, Trash2, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface FilesPageProps {
  darkMode: boolean;
}

export default function FilesPage({ darkMode }: FilesPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState(""); // ✅ custom name/title
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filesList, setFilesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (!error) setFilesList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // ✅ Upload File Logic using custom file name
  const uploadFile = async () => {
    if (!file || !customName.trim()) {
      alert("Please enter a file name!");
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    const fileExt = file.name.split(".").pop();
    const safeName = customName.replace(/[^a-z0-9_\-]/gi, "_"); // ✅ sanitize
    const uniqueFileName = `${safeName}_${Date.now()}.${fileExt}`; // ✅ custom + unique

    setUploadProgress(40);

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(uniqueFileName, file);

    if (uploadError) {
      alert("Upload failed!");
      setUploading(false);
      return;
    }

    setUploadProgress(70);

    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(uniqueFileName);

    const { error: insertError } = await supabase.from("files").insert([
      {
        file_url: urlData.publicUrl,
        file_name: safeName, // ✅ Save custom name not original
        file_type: file.type,
        note,
      },
    ]);

    if (insertError) {
      alert("Failed to save file info!");
    }

    setUploadProgress(100);

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 800);

    setFile(null);
    setNote("");
    setCustomName(""); // ✅ reset name
    fetchFiles();
  };

  const deleteFile = async (fileId: string, fileName: string) => {
    await supabase.from("files").delete().match({ id: fileId });

    await supabase.storage.from("receipts").remove([fileName]);

    fetchFiles();
  };

  return (
    <div className="space-y-6">
      {/* ✅ Upload UI */}
      <div
        className={`p-5 rounded-xl shadow-md ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2
          className={`text-xl font-bold mb-4 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Upload Receipt / File
        </h2>

        <div className="space-y-4">

          {/* ✅ Custom File Picker */}
          <label
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 cursor-pointer transition ${
              darkMode
                ? "border-gray-600 hover:border-blue-500 bg-gray-700"
                : "border-gray-300 hover:border-blue-500 bg-gray-50"
            }`}
          >
            <Upload size={32} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            <span
              className={`mt-2 font-medium ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Tap to choose a file (Image / PDF)
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {/* ✅ Custom Title / File Name */}
          <input
            type="text"
            placeholder="Enter custom file name/title *"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className={`w-full border p-2 rounded-lg ${
              darkMode
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300 bg-white"
            }`}
          />

          {/* ✅ Show selected file details */}
          {file && (
            <div
              className={`p-3 rounded-md border ${
                darkMode ? "border-gray-600 bg-gray-700" : "bg-gray-100"
              }`}
            >
              <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                Selected File: {file.name}
              </p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          {/* ✅ Notes */}
          <textarea
            placeholder="Add a short note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`w-full border p-2 rounded-lg h-20 ${
              darkMode
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300 bg-white"
            }`}
          />

          {/* ✅ Upload Button */}
          <button
            onClick={uploadFile}
            disabled={uploading || !file || !customName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:bg-blue-400"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload />
                Upload File
              </>
            )}
          </button>

          {/* ✅ Progress Bar */}
          {uploading && (
            <div className="w-full h-2 bg-gray-300 rounded-lg overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ✅ File List */}
      <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        Uploaded Files
      </h3>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : filesList.length === 0 ? (
        <p className={darkMode ? "text-gray-400" : "text-gray-600"}>No files uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filesList.map((f) => (
            <div
              key={f.id}
              className={`p-3 rounded-lg shadow-md transition transform hover:scale-105 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`font-bold ${
                    darkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                >
                  {f.file_name}
                </span>

                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    f.file_type.includes("image")
                      ? "bg-blue-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {f.file_type.includes("image") ? "Image" : "PDF"}
                </span>
              </div>

              {f.file_type.includes("image") && (
                <img
                  src={f.file_url}
                  className="w-full h-28 object-cover mt-2 rounded-md"
                  alt="preview"
                />
              )}

              <p className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {f.note || "No notes added."}
              </p>

              <button
                onClick={() => deleteFile(f.id, f.file_name)}
                className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-1 rounded-md flex items-center justify-center gap-1"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
