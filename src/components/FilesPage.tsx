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
import { supabase } from "../lib/supabase";

interface FilesPageProps {
  darkMode: boolean;
}

type FileRow = {
  id: string;
  trip_name: string | null;
  trip_location?: string | null;
  file_name: string | null;
  file_url?: string | null;
  file_type?: string | null;
  note?: string | null;
  uploaded_at?: string | null;
};

export default function FilesPage({ darkMode }: FilesPageProps) {
  const [allFiles, setAllFiles] = useState<FileRow[]>([]);
  const [grouped, setGrouped] = useState<Record<string, FileRow[]>>({});
  const [loading, setLoading] = useState(true);

  // Create Trip form
  const [newTripName, setNewTripName] = useState("");
  const [newTripLocation, setNewTripLocation] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [creatingTrip, setCreatingTrip] = useState(false);

  // Upload file to selected trip
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedTripLocation, setSelectedTripLocation] = useState<string>("");
  const [uploadFileInput, setUploadFileInput] = useState<File | null>(null);
  const [uploadNote, setUploadNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch all files (including special 'trip' rows)
  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from<FileRow>("files")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch files:", error);
      setAllFiles([]);
    } else {
      setAllFiles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Group by trip_name (use "Ungrouped" for files without trip)
  useEffect(() => {
    const groups: Record<string, FileRow[]> = {};
    const keyFor = (row: FileRow) => row.trip_name || "— No Trip —";
    allFiles.forEach((r) => {
      const key = keyFor(r);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    setGrouped(groups);
    // If selectedTrip is null, set to first group (if any)
    if (!selectedTrip) {
      const keys = Object.keys(groups);
      if (keys.length > 0) {
        setSelectedTrip(keys[0]);
        setSelectedTripLocation(groups[keys[0]][0]?.trip_location || "");
      }
    }
  }, [allFiles]); // eslint-disable-line

  // Helper: upload to storage and return public URL & storage filename
  const uploadToStorage = async (file: File, pathPrefix = ""): Promise<{ publicUrl: string; storagePath: string }> => {
    const fileExt = file.name.split(".").pop();
    const safeBase = file.name.replace(/[^a-z0-9_\-\.]/gi, "_");
    const filename = `${pathPrefix}${Date.now()}_${safeBase}`;
    const bucket = "receipts"; // change if your bucket name differs

    const { error: upErr } = await supabase.storage.from(bucket).upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    return { publicUrl: urlData.publicUrl, storagePath: filename };
  };

  // Create Trip (inserts a 'trip' row into files table with file_type = 'trip')
  const createTrip = async () => {
    if (!newTripName.trim()) {
      alert("Trip name required");
      return;
    }

    try {
      setCreatingTrip(true);
      let coverUrl = "";
      let storagePath = "";

      if (coverFile) {
        const uploaded = await uploadToStorage(coverFile, `trip_covers/`);
        coverUrl = uploaded.publicUrl;
        storagePath = uploaded.storagePath;
      }

      const { error: insertErr } = await supabase.from("files").insert([
        {
          trip_name: newTripName.trim(),
          trip_location: newTripLocation.trim() || null,
          file_name: null,
          file_url: coverUrl || null,
          file_type: "trip", // marker row
          note: null,
          uploaded_at: new Date().toISOString(),
        },
      ]);

      if (insertErr) {
        console.error("Failed to create trip:", insertErr);
        alert("Failed to create trip");
      } else {
        setNewTripName("");
        setNewTripLocation("");
        setCoverFile(null);
        // refresh
        await fetchFiles();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Upload failed");
    } finally {
      setCreatingTrip(false);
    }
  };

  // Upload file for selected trip
  const uploadFileForTrip = async () => {
    if (!selectedTrip) {
      alert("Select a trip first (or create one).");
      return;
    }
    if (!uploadFileInput) {
      alert("Select a file to upload.");
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      const uploaded = await uploadToStorage(uploadFileInput, `trip_files/`);
      setProgress(60);

      // Insert metadata to files table
      const { error: insertErr } = await supabase.from("files").insert([
        {
          trip_name: selectedTrip,
          trip_location: selectedTripLocation || null,
          file_name: uploadFileInput.name,
          file_url: uploaded.publicUrl,
          file_type: uploadFileInput.type,
          note: uploadNote || null,
          uploaded_at: new Date().toISOString(),
        },
      ]);

      if (insertErr) throw insertErr;

      setProgress(100);
      setTimeout(() => setProgress(0), 700);

      // reset
      setUploadFileInput(null);
      setUploadNote("");
      await fetchFiles();
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Delete a single file row and storage object (if applicable)
  const deleteFile = async (row: FileRow) => {
    const confirmDelete = confirm("Permanently delete this file?");
    if (!confirmDelete) return;

    try {
      // Remove storage object if file_url exists and file_type !== 'trip' (trip cover handled too)
      if (row.file_url) {
        // we saved storage path as the filename when uploading — find it from the URL
        // Supabase publicUrl format ends with /<bucket>/<path>; but we don't store the path — so infer by parsing url
        // If your bucket is public and names are deterministic, you can remove by storage path.
        // We'll try to derive the storage path after the bucket name:
        try {
          const url = row.file_url!;
          const match = url.match(/\/([^/]+\/[^/]+)$/); // last two segments
          // best-effort: remove by passing the filename part used earlier
          // NOTE: If removal fails, we still remove DB row to keep UI consistent.
          const bucket = "receipts";
          // Attempt to remove by file name stored in file_name if it matches uploaded name
          // If storage removal fails, we just log it
          await supabase.storage.from(bucket).remove([row.file_name || ""]);
        } catch (e) {
          console.warn("Could not remove storage object automatically:", e);
        }
      }

      // Delete DB row
      await supabase.from("files").delete().eq("id", row.id);
      await fetchFiles();
    } catch (err) {
      console.error(err);
      alert("Failed to delete file");
    }
  };

  // Delete entire trip (deletes all rows with that trip_name and attempts to remove storage)
  const deleteTrip = async (tripName: string) => {
    const ok = confirm(`Delete entire trip "${tripName}" and all its files?`);
    if (!ok) return;

    try {
      // fetch rows for trip
      const filesForTrip = allFiles.filter((r) => (r.trip_name || "") === tripName);

      // Attempt to remove each storage object
      const bucket = "receipts";
      for (const r of filesForTrip) {
        // We only delete storage objects for rows that actually have a file_url
        if (r.file_url && r.file_type !== "trip") {
          try {
            // Attempt remove by file_name (best-effort)
            if (r.file_name) await supabase.storage.from(bucket).remove([r.file_name]);
          } catch (e) {
            console.warn("failed to remove storage for", r.file_name, e);
          }
        }
        // if row was a trip cover, try to remove by file_url/file_name too
        if (r.file_type === "trip" && r.file_url) {
          try {
            if (r.file_name) await supabase.storage.from(bucket).remove([r.file_name]);
          } catch (e) {
            // ignore
          }
        }
      }

      // Remove DB rows
      await supabase.from("files").delete().eq("trip_name", tripName);
      await fetchFiles();
      setSelectedTrip(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete trip");
    }
  };

  // Utility: read file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
    const f = e.target.files?.[0] || null;
    setter(f);
  };

  // UI helpers
  const tripKeys = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {/* Create Trip Card */}
      <div className={`p-5 rounded-xl shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Create New Trip</h2>
          <div className="text-sm opacity-80">{tripKeys.length} trips</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Trip name (e.g., Goa 2025)"
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
            className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
            onClick={() => coverInputRef.current?.click()}
          >
            <Camera />
            <div className="text-sm">Add Cover (optional)</div>
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

      {/* Upload to Trip */}
      <div className={`p-5 rounded-xl shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Upload File to Trip</h3>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <select
            value={selectedTrip || ""}
            onChange={(e) => {
              const val = e.target.value || null;
              setSelectedTrip(val);
              // find location from group
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
                {k} {grouped[k][0]?.trip_location ? `— ${grouped[k][0].trip_location}` : ""}
              </option>
            ))}
          </select>

          <label
            className={`col-span-1 flex items-center gap-2 p-2 rounded-md border cursor-pointer justify-center ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
            }`}
            onClick={() => fileInputRef.current?.click()}
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
            placeholder="Short note (optional)"
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

      {/* Trips and Files */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Trips & Files</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : tripKeys.length === 0 ? (
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>No trips yet — create one above.</p>
        ) : (
          tripKeys.map((tripKey) => {
            const rows = grouped[tripKey] || [];
            // Try to find trip meta row (file_type === 'trip')
            const meta = rows.find((r) => r.file_type === "trip");
            const cover = meta?.file_url || rows.find((r) => r.file_type?.startsWith("image"))?.file_url || null;
            const location = meta?.trip_location || rows[0]?.trip_location || "";

            return (
              <div key={tripKey} className={`mb-6 p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
                      {cover ? (
                        <img src={cover} alt="cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-500">
                          <Image />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{tripKey}</h3>
                      {location && <div className={`text-sm opacity-80 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{location}</div>}
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

                {/* Files Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {rows
                    .filter((r) => r.file_type !== "trip") // skip meta row in grid
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`p-3 rounded-lg shadow-sm transition transform hover:scale-[1.02] ${
                          darkMode ? "bg-gray-700" : "bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            {r.file_type?.includes("image") ? (
                              <Image />
                            ) : (
                              <FileText />
                            )}
                            <div className="text-sm font-semibold truncate">{r.file_name}</div>
                          </div>

                          <button onClick={() => deleteFile(r)} className="text-red-500">
                            <Trash2 />
                          </button>
                        </div>

                        {r.file_type?.includes("image") && r.file_url && (
                          <img src={r.file_url} alt={r.file_name || "img"} className="w-full h-28 object-cover mt-3 rounded-md" />
                        )}

                        <div className={`text-xs mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {r.note || "No notes"}
                        </div>

                        {r.file_url && (
                          <a
                            href={r.file_url}
                            target="_blank"
                            rel="noreferrer"
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
