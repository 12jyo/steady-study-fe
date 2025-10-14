import { useEffect, useState, useMemo } from "react";
import Navbar from "./Navbar";
import Modal from "./Modal";
import API from "../api/api";
import "../../src/App.css";
import "../styles/BatchesView.css";
import { MdOutlineAddTask, MdDelete } from "react-icons/md";
import { IoIosEye } from "react-icons/io";
import { Tooltip } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

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
  const [isViewMode, setIsViewMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);

  // fetch data
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

  // add new batch
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

  // assign or view resources
  const handleAssignResources = async (batch) => {
    setIsViewMode(false);
    setSelectedBatch(batch);
    setShowResourceModal(true);
    await loadResources(batch._id);
  };

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

  // upload resources
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

  const handleDeleteBatch = (batch) => {
    setBatchToDelete(batch);
    setShowDeleteModal(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    try {
      setLoading(true);
      await API.delete("/admin/delete-batch", { data: { batchId: batchToDelete._id } });
      setShowDeleteModal(false);
      setBatchToDelete(null);
      fetchBatches();
    } catch (err) {
      console.error("Error deleting batch", err);
      setShowDeleteModal(false);
      setBatchToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  // Delete resource handler
  const handleDeleteResource = async (resourceId) => {
    try {
      await API.delete("/admin/delete-resource", { data: { resourceId } });
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
    } catch (err) {
      console.error("Error deleting resource", err);
    }
  };

  // --- AG Grid Columns ---
  const columnDefs = useMemo(
    () => [
      {
        headerName: "Batch Name",
        field: "title",
        flex: 1,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Actions",
        flex: 1,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <div className="flex justify-center items-center gap-4">
            <Tooltip title="Assign Resources" arrow>
              <button
                className="action-button"
                onClick={() => handleAssignResources(params.data)}
              >
                <MdOutlineAddTask />
              </button>
            </Tooltip>
            <Tooltip title="View Resources" arrow>
              <button
                className="action-button"
                onClick={() => handleViewResources(params.data)}
              >
                <IoIosEye />
              </button>
            </Tooltip>
            <Tooltip title="Delete Batch" arrow>
              <button
                className="action-button"
                onClick={() => handleDeleteBatch(params.data)}
              >
                <MdDelete />
              </button>
            </Tooltip>
          </div>
        ),
      },
    ],
    []
  );

  const [defaultColDef] = useState({
    resizable: true,
    sortable: true,
    filter: true,
  });

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
          <div className="ag-theme-alpine grid-container">
            <AgGridReact
              rowData={batches}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50]}
              rowHeight={50}
              headerHeight={50}
              domLayout="normal"
            />
          </div>
        )}

        {/* Add Batch Modal */}
        {showAddModal && (
          <Modal
            open={showAddModal}
            title="Add New Batch"
            content={
              <form
                id="add-batch-form"
                onSubmit={handleAddBatch}
                className="space-y-3"
              >
                <input
                  type="text"
                  placeholder="Batch Title"
                  value={newBatchTitle}
                  onChange={(e) => setNewBatchTitle(e.target.value)}
                  className="border p-2 w-full rounded"
                  required
                />
              </form>
            }
            onSave={() =>
              document.getElementById("add-batch-form").requestSubmit()
            }
            onCancel={() => setShowAddModal(false)}
            saveText="Add"
            cancelText="Cancel"
          />
        )}

        {/* Assign/View Resources Modal */}
        {showResourceModal && (
          <Modal
            open={showResourceModal}
            title={
              isViewMode
                ? `Resources in ${selectedBatch?.title}`
                : `Manage Resources for ${selectedBatch?.title}`
            }
            content={
              <>
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
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
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
                        <div className="flex items-center gap-2">
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
                          {isViewMode && (
                            <button
                              className="text-red-600 text-xs border border-red-600 rounded px-2 py-1 ml-2 hover:bg-red-50"
                              onClick={() => handleDeleteResource(r._id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            }
            onSave={!isViewMode ? handleUploadResource : undefined}
            onCancel={() => setShowResourceModal(false)}
            saveText={
              !isViewMode
                ? uploading
                  ? "Uploading..."
                  : "Add Resource(s)"
                : undefined
            }
            cancelText={isViewMode ? "Close" : "Cancel"}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <Modal
            open={showDeleteModal}
            title="Delete Batch Confirmation"
            content={
              <div>
                Are you sure you want to delete the batch{" "}
                <b>{batchToDelete?.title}</b> and all its students? This action
                cannot be undone.
              </div>
            }
            onSave={confirmDeleteBatch}
            onCancel={() => {
              setShowDeleteModal(false);
              setBatchToDelete(null);
            }}
            saveText="Yes, Delete"
            cancelText="Cancel"
          />
        )}
      </div>
    </>
  );
}
