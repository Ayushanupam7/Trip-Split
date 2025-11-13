import { useEffect, useState, useRef } from "react";
import {
  Upload,
  FileText,
  Image,
  Trash2,
  Loader2,
  FolderPlus,
  Camera,
  FilePlus,
  Trash,
} from "lucide-react";

import { pb } from "../lib/pb";

interface FilesPageProps {
  darkMode: boolean;
}

type FileRow = {
  id: string;
  trip_name: string | null;
  trip_location?: string | null;
  file_name: string | null;
  file_url?: string | File | null;
  file_type?: string | null;
  note?: string | null;
  uploaded_at?: string | null;
};

export default function FilesPage({ darkMode }: FilesPageProps) {
  const [allFiles, setAllFiles] = useState<FileRow[]>([]);
  const [grouped, setGrouped] = useState<Record<string, FileRow[]>>({});
  const [loading, setLoading] = useState(true);

  const [newTripName, setNewTripName] = useState("");
  const [newTripLocation, setNewTripLocation] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [creatingTrip, setCreatingTrip] = useState(false);

  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedTripLocation, setSelectedTripLocation] = useState<string>("");
  const [uploadFileInput, setUploadFileInput] = useState<File | null>(null);
  const [uploadNote, setUploadNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  //--------------------------------------------------------
  // FETCH FILES
  //--------------------------------------------------------
  const fetchFiles = async () => {
    setLoading(true);

    const res = await pb.collection("files").getFullList({
      sort: "-created",
    });

    const mapped: FileRow[] = res.map((row: any) => ({
      ...row,
      file_url: row.file_url
        ? pb.files.getUrl(row, row.file_url)
        : null,
    }));

    setAllFiles(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  //--------------------------------------------------------
  // GROUP BY TRIP
  //--------------------------------------------------------
  useEffect(() => {
    const groups: Record<string, FileRow[]> = {};

    allFiles.forEach((r) => {
      const key = r.trip_name || "— No Trip —";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    setGrouped(groups);

    if (!selectedTrip) {
      const keys = Object.keys(groups);
      if (keys.length > 0) {
        setSelectedTrip(keys[0]);
        setSelectedTripLocation(groups[keys[0]][0]?.trip_location || "");
      }
    }
  }, [allFiles]);

  //--------------------------------------------------------
  // CREATE TRIP
  //--------------------------------------------------------
  const createTrip = async () => {
    if (!newTripName.trim()) {
      alert("Trip name required");
      return;
    }

    try {
      setCreatingTrip(true);

      const form = new FormData();
      form.append("trip_name", newTripName);
      form.append("trip_location", newTripLocation || "");
      form.append("file_type", "trip");
      form.append("uploaded_at", new Date().toISOString());

      if (coverFile) {
        form.append("file_url", coverFile);
      }

      await pb.collection("files").create(form);

      setNewTripName("");
      setNewTripLocation("");
      setCoverFile(null);

      await fetchFiles();
    } finally {
      setCreatingTrip(false);
    }
  };

  //--------------------------------------------------------
  // UPLOAD FILE TO TRIP
  //--------------------------------------------------------
  const uploadFileForTrip = async () => {
    if (!selectedTrip) return;
    if (!uploadFileInput) return;

    try {
      setUploading(true);
      setProgress(10);

      const form = new FormData();
      form.append("trip_name", selectedTrip);
      form.append("trip_location", selectedTripLocation || "");
      form.append("file_name", uploadFileInput.name);
      form.append("file_type", uploadFileInput.type);
      form.append("note", uploadNote);
      form.append("uploaded_at", new Date().toISOString());
      form.append("file_url", uploadFileInput);

      setProgress(50);

      await pb.collection("files").create(form);

      setProgress(100);
      setTimeout(() => setProgress(0), 700);

      setUploadFileInput(null);
      setUploadNote("");

      await fetchFiles();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  //--------------------------------------------------------
  // DELETE FILE
  //--------------------------------------------------------
  const deleteFile = async (row: FileRow) => {
    const ok = confirm("Delete this file?");
    if (!ok) return;

    await pb.collection("files").delete(row.id);
    await fetchFiles();
  };

  //--------------------------------------------------------
  // DELETE TRIP
  //--------------------------------------------------------
  const deleteTrip = async (tripName: string) => {
    const ok = confirm(`Delete trip "${tripName}" and all its files?`);
    if (!ok) return;

    const rows = allFiles.filter((f) => f.trip_name === tripName);
    for (const r of rows) {
      await pb.collection("files").delete(r.id);
    }

    await fetchFiles();
    setSelectedTrip(null);
  };

  //--------------------------------------------------------
  // FILE INPUT HANDLER
  //--------------------------------------------------------
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void
  ) => {
    const f = e.target.files?.[0] || null;
    setter(f);
  };

  const tripKeys = Object.keys(grouped);

  //--------------------------------------------------------
  // UI BELOW (UNCHANGED)
  //--------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* CREATE TRIP */}
      <div className={`p-5 rounded-xl shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Create New Trip
          </h2>
          <div className="text-sm opacity-80">{tripKeys.length} trips</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Trip name"
            value={newTripName}
            onChange={(e) => setNewTripName(e.target.value)}
            className={`px-3 py-2 rounded-md border ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            } col-span-2`}
          />

          <input
            type="text"
            placeholder="Location (optional)"
            value={newTripLocation}
            onChange={(e) => setNewTripLocation(e.target.value)}
            className={`px-3 py-2 rounded-md border ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
          />

          <label
            onClick={() => coverInputRef.current?.click()}
            className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
          >
            <Camera />
            Add Cover
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, setCoverFile)}
            />
          </label>

          <div className="col-span-3 flex gap-2">
            <button
              onClick={createTrip}
              disabled={creatingTrip}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {creatingTrip ? <Loader2 className="animate-spin" /> : <FolderPlus />} Create Trip
            </button>

            <button
              onClick={() => {
                setNewTripName("");
                setNewTripLocation("");
                setCoverFile(null);
              }}
              className="px-4 py-2 rounded-md border"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* UPLOAD FILE */}
      <div className={`p-5 rounded-xl shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
          Upload File to Trip
        </h3>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <select
            value={selectedTrip || ""}
            onChange={(e) => {
              const val = e.target.value || null;
              setSelectedTrip(val);
              const firstRow = grouped[val || ""]?.[0];
              setSelectedTripLocation(firstRow?.trip_location || "");
            }}
            className={`col-span-2 px-3 py-2 rounded-md border ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
          >
            <option value="">-- Select Trip --</option>
            {tripKeys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <label
            onClick={() => fileInputRef.current?.click()}
            className={`col-span-1 flex items-center gap-2 p-2 rounded-md border cursor-pointer justify-center ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
          >
            <Upload />
            Choose File
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e, setUploadFileInput)}
            />
          </label>

          <input
            placeholder="Short note"
            value={uploadNote}
            onChange={(e) => setUploadNote(e.target.value)}
            className={`col-span-4 px-3 py-2 rounded-md border ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
          />

          <button
            onClick={uploadFileForTrip}
            disabled={uploading || !selectedTrip || !uploadFileInput}
            className="col-span-1 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            {uploading ? <Loader2 className="animate-spin" /> : <FilePlus />} Upload
          </button>

          {uploading && (
            <div className="col-span-3 mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* TRIPS & FILES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Trips & Files
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : tripKeys.length === 0 ? (
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            No trips yet — create one above.
          </p>
        ) : (
          tripKeys.map((tripKey) => {
            const rows = grouped[tripKey];
            const meta = rows.find((r) => r.file_type === "trip");
            const cover = meta?.file_url || rows.find((r) => r.file_type?.includes("image"))?.file_url;
            const location = meta?.trip_location || rows[0]?.trip_location;

            return (
              <div
                key={tripKey}
                className={`mb-6 p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
                      {cover ? (
                        <img src={cover as string} className="w-full h-full object-cover" />
                      ) : (
                        <Image />
                      )}
                    </div>

                    <div>
                      <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {tripKey}
                      </h3>
                      {location && (
                        <div className={`text-sm opacity-80 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {location}
                        </div>
                      )}
                      <div className="text-xs opacity-80 mt-1">{rows.length} items</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTrip(tripKey);
                        setSelectedTripLocation(location || "");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-3 py-2 rounded-md border"
                    >
                      Add file
                    </button>

                    <button
                      onClick={() => deleteTrip(tripKey)}
                      className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                    >
                      <Trash /> Delete Trip
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {rows
                    .filter((r) => r.file_type !== "trip")
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`p-3 rounded-lg shadow-sm transition hover:scale-[1.02] ${
                          darkMode ? "bg-gray-700" : "bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {r.file_type?.includes("image") ? <Image /> : <FileText />}
                            <div className="text-sm font-semibold truncate">{r.file_name}</div>
                          </div>

                          <button onClick={() => deleteFile(r)} className="text-red-500">
                            <Trash2 />
                          </button>
                        </div>

                        {r.file_type?.includes("image") && r.file_url && (
                          <img
                            src={r.file_url as string}
                            className="w-full h-28 object-cover mt-3 rounded-md"
                          />
                        )}

                        <div className={`text-xs mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {r.note || "No notes"}
                        </div>

                        {r.file_url && (
                          <a
                            href={r.file_url as string}
                            target="_blank"
                            className="mt-3 inline-block text-sm underline opacity-90"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
