import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Modal from "./Modal";
import API from "../api/api";
import '../../src/App.css'
import { MdOutlineAddTask } from "react-icons/md";
import { IoIosEye } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import '../styles/BatchesView.css'
import { Tooltip } from "@mui/material";

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
      <div className="content-container">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Batches</h2>
          <button
            className="add-batch-btn"
            onClick={() => setShowAddModal(true)}
          >
            Add Batch
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading batches...</p>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Batch Name</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{b.title}</td>
                    <td className="px-4 py-3 text-center space-x-4">
                      <Tooltip title="Assign Resources" arrow>
                        <button
                          className="action-button"
                          onClick={() => handleAssignResources(b)}
                        >
                          <MdOutlineAddTask />
                        </button>
                      </Tooltip>
                      <Tooltip title="View Resources" arrow>
                        <button
                          className="action-button"
                          onClick={() => handleViewResources(b)}
                        >
                          <IoIosEye />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete Batch" arrow>
                        <button
                          className="action-button"
                          onClick={() => console.log("Delete", b._id)}
                        >
                          <MdDelete />
                        </button>
                      </Tooltip>
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
          <Modal
            open={showAddModal}
            title="Add New Batch"
            content={
              <form id="add-batch-form" onSubmit={handleAddBatch} className="space-y-3">
                <input
                  type="text"
                  placeholder="Batch Title"
                  value={newBatchTitle}
                  onChange={e => setNewBatchTitle(e.target.value)}
                  className="border p-2 w-full rounded"
                  required
                />
              </form>
            }
            onSave={() => document.getElementById('add-batch-form').requestSubmit()}
            onCancel={() => setShowAddModal(false)}
            saveText="Add"
            cancelText="Cancel"
          />
        )}

        {/* Assign/View Resources Modal */}
        {showResourceModal && (
          <Modal
            open={showResourceModal}
            title={isViewMode
              ? `Resources in ${selectedBatch?.title}`
              : `Manage Resources for ${selectedBatch?.title}`}
            content={
              <>
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
              </>
            }
            onSave={!isViewMode ? handleUploadResource : undefined}
            onCancel={() => setShowResourceModal(false)}
            saveText={!isViewMode ? (uploading ? "Uploading..." : "Add Resource(s)") : undefined}
            cancelText={isViewMode ? "Close" : "Cancel"}
          />
        )}
      </div>
    </>
  );
}