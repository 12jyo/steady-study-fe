import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import API from "../api/api";

export default function BatchesView() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatchTitle, setNewBatchTitle] = useState("");
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [resources, setResources] = useState([]);
  const [files, setFiles] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false); // NEW 🔹 determines if modal is readonly

  // Fetch batches on mount
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/batches");
      setBatches(res.data);
    } catch (err) {
      console.error("Error fetching batches", err);
    } finally {
      setLoading(false);
    }
  };

  // Add new batch
  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!newBatchTitle.trim()) return alert("Enter batch name");
    try {
      await API.post("/admin/create-batch", { title: newBatchTitle });
      alert("Batch created successfully!");
      setNewBatchTitle("");
      setShowAddModal(false);
      fetchBatches();
    } catch (err) {
      console.error("Error creating batch", err);
      alert(err.response?.data?.message || "Error creating batch");
    }
  };

  // Open modal in "Assign Resources" mode
  const handleAssignResources = async (batch) => {
    setIsViewMode(false);
    setSelectedBatch(batch);
    setShowResourceModal(true);
    await loadResources(batch._id);
  };

  // Open modal in "View Resources" mode
  const handleViewResources = async (batch) => {
    setIsViewMode(true);
    setSelectedBatch(batch);
    setShowResourceModal(true);
    await loadResources(batch._id);
  };

  const loadResources = async (batchId) => {
    try {
      const res = await API.get(`/admin/resources?batch_id=${batchId}`);
      setResources(res.data);
    } catch (err) {
      console.error("Error loading resources", err);
      setResources([]);
    }
  };

  // Upload one or multiple resources
  const handleUploadResource = async (e) => {
    e?.preventDefault?.();
    if (!files || !selectedBatch) return alert("Please select one or more files");

    try {
      setUploading(true);
      const fileArray = Array.from(files);

      for (const f of fileArray) {
        const formData = new FormData();
        formData.append("batchId", selectedBatch._id);
        formData.append("title", f.name);
        formData.append("file", f);

        await API.post("/admin/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      alert(`${fileArray.length} resource(s) uploaded successfully`);
      setFiles(null);
      await loadResources(selectedBatch._id);
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Batches</h2>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setShowAddModal(true)}
          >
            Add Batch
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading batches...</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Batch Name</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{b.title}</td>
                    <td className="px-4 py-3 text-right space-x-4">
                      <button
                        className="text-green-600 font-medium hover:underline"
                        onClick={() => handleAssignResources(b)}
                      >
                        Assign Resources
                      </button>
                      <button
                        className="text-blue-600 font-medium hover:underline"
                        onClick={() => handleViewResources(b)}
                      >
                        View Resources
                      </button>
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="text-center py-6 text-gray-500 italic"
                    >
                      No batches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Batch Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-lg font-semibold mb-4">Add New Batch</h3>
              <form onSubmit={handleAddBatch} className="space-y-3">
                <input
                  type="text"
                  placeholder="Batch Title"
                  value={newBatchTitle}
                  onChange={(e) => setNewBatchTitle(e.target.value)}
                  className="border p-2 w-full rounded"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign/View Resources Modal */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-h-[80vh] overflow-auto">
              <h3 className="text-lg font-semibold mb-4">
                {isViewMode
                  ? `Resources in ${selectedBatch?.title}`
                  : `Manage Resources for ${selectedBatch?.title}`}
              </h3>

              {/* Upload Section (hidden in view mode) */}
              {!isViewMode && (
                <form onSubmit={handleUploadResource} className="mb-4">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="border p-2 rounded w-full mb-3"
                  />
                  {files && (
                    <p className="text-xs text-gray-500 mb-2">
                      {files.length} file{files.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={!files || uploading}
                      onClick={handleUploadResource}
                      className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50`}
                    >
                      {uploading ? "Uploading..." : "Add Resource(s)"}
                    </button>
                  </div>
                </form>
              )}

              {/* Resource List */}
              <div className="space-y-2">
                {resources.length === 0 ? (
                  <p className="text-gray-500 text-sm">No resources found.</p>
                ) : (
                  resources.map((r) => (
                    <div
                      key={r._id}
                      className="flex justify-between items-center border p-2 rounded"
                    >
                      <span>{r.title}</span>
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">(no link)</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}