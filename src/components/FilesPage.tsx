import { useState, useEffect, useRef } from "react";

export default function TripManager() {
  const [tripName, setTripName] = useState("");
  const [tripLocation, setTripLocation] = useState("");
  const [description, setDescription] = useState("");

  const [coverImage, setCoverImage] = useState<any>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [checkItem, setCheckItem] = useState("");
  const [checklist, setChecklist] = useState<any[]>([]);

  const [files, setFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [allTrips, setAllTrips] = useState<any[]>([]);

  // Edit modal state
  const [editTrip, setEditTrip] = useState<any>(null);
  const editCoverRef = useRef<HTMLInputElement | null>(null);

  // Load on start
  useEffect(() => {
    const saved = localStorage.getItem("tripManager");
    if (saved) setAllTrips(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("tripManager", JSON.stringify(allTrips));
  }, [allTrips]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });

  const handleCoverSelect = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);

    setCoverImage({ name: file.name, data: base64 });
  };

  const handleFilesSelect = async (e: any) => {
    const selected = e.target.files;
    for (let f of selected) {
      const base64 = await fileToBase64(f);
      setFiles((prev) => [...prev, { name: f.name, type: f.type, data: base64 }]);
    }
  };

  const saveTrip = () => {
    if (!tripName.trim()) return alert("Trip name required");

    const newTrip = {
      id: Date.now(),
      tripName,
      tripLocation,
      description,
      coverImage,
      checklist,
      files,
      createdAt: new Date().toISOString(),
    };

    setAllTrips([newTrip, ...allTrips]);

    setTripName("");
    setTripLocation("");
    setDescription("");
    setCoverImage(null);
    setChecklist([]);
    setFiles([]);
  };

  const deleteTrip = (id: number) => {
    setAllTrips(allTrips.filter((t) => t.id !== id));
  };

  const addChecklistItem = () => {
    if (!checkItem.trim()) return;
    setChecklist([...checklist, { id: Date.now(), text: checkItem, done: false }]);
    setCheckItem("");
  };

  const toggleChecklist = (id: number) =>
    setChecklist(checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));

  const deleteChecklistItem = (id: number) =>
    setChecklist(checklist.filter((c) => c.id !== id));

  const deleteFile = (name: string) =>
    setFiles(files.filter((f) => f.name !== name));

  const saveEditedTrip = () => {
    setAllTrips((prev) =>
      prev.map((t) => (t.id === editTrip.id ? editTrip : t))
    );
    setEditTrip(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 space-y-8">

      {/* ================= EDIT MODAL ================= */}
      {editTrip && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4">

            <h2 className="text-xl font-bold">Edit Trip</h2>

            <input
              type="text"
              value={editTrip.tripName}
              onChange={(e) => setEditTrip({ ...editTrip, tripName: e.target.value })}
              className="w-full border px-3 py-2 rounded"
              placeholder="Trip Name"
            />

            <input
              type="text"
              value={editTrip.tripLocation}
              onChange={(e) =>
                setEditTrip({ ...editTrip, tripLocation: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
              placeholder="Location"
            />

            <textarea
              value={editTrip.description}
              onChange={(e) =>
                setEditTrip({ ...editTrip, description: e.target.value })
              }
              className="w-full border px-3 py-2 rounded h-24"
              placeholder="Description"
            />

            <button
              onClick={() => editCoverRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Change Cover Image
            </button>

            <input
              ref={editCoverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const base64 = await fileToBase64(file);
                setEditTrip({
                  ...editTrip,
                  coverImage: { name: file.name, data: base64 },
                });
              }}
            />

            {editTrip.coverImage && (
              <img
                src={editTrip.coverImage.data}
                className="w-full h-40 object-cover rounded"
              />
            )}

            <div className="flex justify-between pt-2">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded"
                onClick={() => setEditTrip(null)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={saveEditedTrip}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CARD 1 — TRIP INFO ================= */}
      <div className="w-full bg-white shadow border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-bold">Trip Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Trip Name"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />

          <input
            type="text"
            placeholder="Trip Location"
            value={tripLocation}
            onChange={(e) => setTripLocation(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <textarea
          placeholder="Trip Description / Notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-3 py-2 rounded h-28"
        />

        <div>
          <button
            onClick={() => coverInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Upload Cover Image
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverSelect}
          />

          {coverImage && (
            <img
              src={coverImage.data}
              className="mt-3 w-full h-48 object-cover rounded"
            />
          )}
        </div>
      </div>

      {/* ================= CARD 2 — CHECKLIST ================= */}
      <div className="w-full bg-white shadow border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-bold">To-Do Checklist</h2>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Add checklist item"
            value={checkItem}
            onChange={(e) => setCheckItem(e.target.value)}
            className="flex-1 border px-3 py-2 rounded"
          />
          <button
            onClick={addChecklistItem}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {checklist.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center border px-3 py-2 rounded"
            >
              <span
                onClick={() => toggleChecklist(c.id)}
                className={`cursor-pointer ${
                  c.done ? "line-through opacity-60" : ""
                }`}
              >
                {c.text}
              </span>

              <button
                className="text-red-600"
                onClick={() => deleteChecklistItem(c.id)}
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= CARD 3 — FILE STORAGE ================= */}
      <div className="w-full bg-white shadow border rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-bold">Upload Files (Images / PDFs)</h2>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gray-800 text-white rounded"
        >
          Upload Files
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFilesSelect}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
          {files.map((f, i) => (
            <div key={i} className="border p-2 rounded">
              {f.type.includes("image") ? (
                <img
                  src={f.data}
                  className="h-28 w-full object-cover rounded"
                />
              ) : (
                <a href={f.data} download={f.name} className="underline text-blue-600">
                  {f.name}
                </a>
              )}

              <button
                onClick={() => deleteFile(f.name)}
                className="block text-center text-red-600 text-sm mt-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SAVE BUTTON ================= */}
      <button
        onClick={saveTrip}
        className="w-full bg-purple-600 text-white py-3 rounded text-lg"
      >
        Save Trip
      </button>

      {/* ================= SAVED TRIPS LIST ================= */}
      <div className="pt-6">
        <h2 className="text-2xl font-bold mb-3">Saved Trips</h2>

        {allTrips.length === 0 ? (
          <p>No trips saved yet.</p>
        ) : (
          allTrips.map((t) => (
            <div
              key={t.id}
              className="border p-4 rounded mb-5 shadow bg-white"
            >
              <div className="flex items-center gap-4">

                <div className="w-20 h-20 rounded overflow-hidden bg-gray-200">
                  {t.coverImage ? (
                    <img
                      src={t.coverImage.data}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-gray-500">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{t.tripName}</h3>
                  <p className="text-gray-600">{t.tripLocation}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditTrip(t)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => deleteTrip(t.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <p className="mt-3">{t.description}</p>

              <h4 className="font-bold mt-4">Checklist:</h4>
              {t.checklist.map((c: any, i: number) => (
                <div key={i}>• {c.text}</div>
              ))}

              <h4 className="font-bold mt-4">Files:</h4>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {t.files.map((f: any, i: number) => (
                  <div key={i} className="border p-2 rounded">
                    {f.type.includes("image") ? (
                      <img
                        src={f.data}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <a
                        href={f.data}
                        download={f.name}
                        className="underline text-blue-600"
                      >
                        {f.name}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
