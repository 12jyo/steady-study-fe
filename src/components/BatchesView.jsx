import { useEffect, useState, useMemo } from "react";
import Navbar from "./Navbar";
import Modal from "./Modal";
import API from "../api/api";
import "../../src/App.css";
import "../styles/BatchesView.css";
import { MdOutlineAddTask, MdDelete } from "react-icons/md";
import "../styles/DeleteModal.css";
import { FaFilePdf, FaCloudUploadAlt } from "react-icons/fa";
import { IoEyeOutline } from "react-icons/io5";
import "../styles/ViewResourceModal.css";
import "../styles/AddResourceModal.css";
import { IoIosEye } from "react-icons/io";
import { Tooltip } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { toast } from "react-toastify";
import "../styles/modal.css";

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

  // Redirect to home if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
    }
  }, []);

  // Fetch batches
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
    if (!newBatchTitle.trim()) return toast.error("Enter batch name");
    try {
      await API.post("/admin/create-batch", { title: newBatchTitle });
      toast.success("Batch created successfully!");
      setNewBatchTitle("");
      setShowAddModal(false);
      fetchBatches();
    } catch (err) {
      console.error("Error creating batch", err);
      toast.error(err.response?.data?.message || "Error creating batch");
    }
  };

  // Open modals
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

  // Load resources for batch
  const loadResources = async (batchId) => {
    try {
      const res = await API.get(`/admin/resources?batch_id=${batchId}`);
      setResources(res.data);
    } catch (err) {
      console.error("Error loading resources", err);
      setResources([]);
    }
  };

  // Upload resources (with name field)
  const handleUploadResource = async (e) => {
    e?.preventDefault?.();
    if (!files || !selectedBatch) return toast.error("Please select at least one file");

    try {
      setUploading(true);
      const fileArray = Array.from(files);

      // Validate all files are PDFs
      const nonPdf = fileArray.find(f => f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf"));
      if (nonPdf) {
        return toast.error("Only PDF files are allowed.");
      }

      for (const f of fileArray) {
        const formData = new FormData();
        formData.append("batchId", selectedBatch._id);
        formData.append("title", f.name);
        formData.append("file", f);

        await API.post("/admin/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success(`${fileArray.length} resource(s) uploaded successfully`);
      setFiles(null);
      await loadResources(selectedBatch._id);
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Batch deletion
  const handleDeleteBatch = (batch) => {
    setBatchToDelete(batch);
    setShowDeleteModal(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    try {
      setLoading(true);
      await API.delete("/admin/delete-batch", {
        data: { batchId: batchToDelete._id },
      });
      toast.success("Batch deleted successfully");
      setShowDeleteModal(false);
      setBatchToDelete(null);
      fetchBatches();
    } catch (err) {
      console.error("Error deleting batch", err);
      toast.error("Error deleting batch");
      setShowDeleteModal(false);
      setBatchToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  // Delete resource
  const handleDeleteResource = async (resourceId) => {
    try {
      await API.delete("/admin/delete-resource", { data: { resourceId } });
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
      toast.success("Resource deleted successfully");
    } catch (err) {
      console.error("Error deleting resource", err);
      toast.error("Failed to delete resource");
    }
  };

  // AG Grid config
  const columnDefs = useMemo(
    () => [
      { headerName: "Batch Name", field: "title", flex: 1, filter: "agTextColumnFilter", headerClass: "admin-table-header"  },
      {
        headerName: "Actions",
        flex: 1,
        sortable: false,
        filter: false,
        headerClass: "admin-table-header",
        cellRenderer: (params) => (
          <div className="flex justify-start items-center gap-4">
            <Tooltip title="Assign Resources" arrow>
              <button
                className="action-button assign-resources-btn"
                onClick={() => handleAssignResources(params.data)}
              >
                <MdOutlineAddTask style={{ color: '#E08F35', fontSize: '1.5rem' }} />
              </button>
            </Tooltip>
            <Tooltip title="View Resources" arrow>
              <button
                className="action-button view-resources-btn"
                onClick={() => handleViewResources(params.data)}
              >
                <IoIosEye style={{ color: '#442D77', fontSize: '1.5rem' }} />
              </button>
            </Tooltip>
            <Tooltip title="Delete Batch" arrow>
              <button
                className="action-button delete-batch-btn"
                onClick={() => handleDeleteBatch(params.data)}
              >
                <MdDelete style={{ color: '#dc2626', fontSize: '1.5rem' }} />
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
          <button className="add-batch-btn" onClick={() => setShowAddModal(true)}>
            Add Batch
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading batches...</p>
        ) : (
          <div
            className="ag-theme-alpine admin-table-wrapper"
            style={{ height: 500, width: "100%", borderRadius: '1.2rem', overflow: 'hidden', boxShadow: '0 4px 24px 0 #442D7722', background: 'linear-gradient(120deg, #FCF2A8 0%, #F2DA4C 80%, #E08F35 100%)' }}
          >
            <AgGridReact
              rowData={batches}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowHeight={45}
              headerHeight={56}
              domLayout="normal"
              getRowClass={() => 'admin-table-row'}
              getRowStyle={() => ({ background: 'rgba(252, 242, 168, 0.85)', borderBottom: '1.5px solid #F2DA4C' })}
              headerClass="admin-table-header"
            />
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
                  onChange={(e) => setNewBatchTitle(e.target.value)}
                  className="modal-input"
                  required
                />
              </form>
            }
            onSave={() => document.getElementById("add-batch-form").requestSubmit()}
            onCancel={() => setShowAddModal(false)}
            saveText="Add"
            cancelText="Cancel"
          />
        )}

        {/* Assign/View Resources Modal */}
        {showResourceModal && (
          <Modal
            open={showResourceModal}
            className={isViewMode ? "view-resource-modal" : "manage-resource-modal"}
            title={
              <Modal
                open={showResourceModal}
                className={isViewMode ? "view-resource-modal" : "manage-resource-modal"}
                title={
                  isViewMode
                    ? `Resources in ${selectedBatch?.title}`
                    : `Manage Resources for ${selectedBatch?.title}`
                }
                content={
                  <>
                    {/* Upload section */}
                    {!isViewMode && (
                      <form onSubmit={handleUploadResource} className="add-resource-modal">
                        <div className="add-resource-title">
                          <FaCloudUploadAlt style={{ fontSize: '2rem', verticalAlign: 'middle', marginRight: 8 }} />
                          Upload PDF Resource(s)
                        </div>
                        <div className="add-resource-upload">
                          <label htmlFor="resource-upload-input" style={{ width: '100%' }}>
                            <input
                              id="resource-upload-input"
                              type="file"
                              accept="application/pdf"
                              multiple
                              onChange={(e) => setFiles(e.target.files)}
                              style={{ display: 'none' }}
                            />
                            <div style={{
                              border: '2px dashed #3091c2',
                              borderRadius: 8,
                              padding: '1.2rem 1rem',
                              background: '#fff',
                              cursor: 'pointer',
                              textAlign: 'center',
                              color: '#22678a',
                              width: '100%',
                              transition: 'border-color 0.2s',
                              fontSize: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 8
                            }}
                            className="add-resource-upload-box"
                            >
                              <FaFilePdf style={{ fontSize: '2.2rem', color: '#dc2626', marginBottom: 4 }} />
                              <span style={{ fontWeight: 500 }}>Click or drag PDF(s) here</span>
                              <span style={{ fontSize: '0.95rem', color: '#888' }}>Only PDF files allowed</span>
                            </div>
                          </label>
                          {files && (
                            <div className="add-resource-file-info">
                              {Array.from(files).map((f, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <FaFilePdf style={{ color: '#dc2626', fontSize: '1.1rem' }} />
                                  <span>{f.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="add-resource-actions">
                          <button
                            type="submit"
                            disabled={!files || uploading}
                            className="add-resource-btn"
                          >
                            {uploading ? "Uploading..." : "Add Resource(s)"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Resource List */}
                    <div className="view-resource-list">
                      {resources.length === 0 ? (
                        <div className="view-resource-empty">No resources found.</div>
                      ) : (
                        resources.map((r) => (
                          <div key={r._id} className="view-resource-item">
                            <div className="view-resource-title">
                              <FaFilePdf style={{ color: '#dc2626', fontSize: '1.3rem' }} />
                              <span>{r.title}</span>
                            </div>
                            <div className="view-resource-actions">
                              {r.url ? (
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="view-resource-link"
                                  style={{ padding: 0, border: 'none', background: 'none', height: '2.1rem', width: '2.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="View PDF"
                                >
                                  <Tooltip title="View PDF" placement="top">
                                    <span><IoEyeOutline style={{ fontSize: '1.5rem', color: '#2563eb' }} /></span>
                                  </Tooltip>
                                </a>
                              ) : (
                                <span className="text-gray-400 text-xs">(no link)</span>
                              )}
                              {isViewMode && (
                                <Tooltip title="Delete Resource" placement="top">
                                  <button
                                    className="view-resource-delete"
                                    style={{ padding: 0, border: 'none', background: 'none', height: '2.1rem', width: '2.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => handleDeleteResource(r._id)}
                                  >
                                    <MdDelete style={{ fontSize: '1.5rem', color: '#dc2626' }} />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                }
                onSave={undefined}
                onCancel={() => setShowResourceModal(false)}
                saveText={""}
                cancelText="Close"
              />
            }
            cancelText={isViewMode ? "Close" : "Cancel"}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <Modal
            open={showDeleteModal}
            className="delete-modal"
            title={null}
            content={
              <div className="delete-modal-content">
                <MdDelete className="delete-modal-icon" />
                <div className="delete-modal-title">Delete Batch?</div>
                <div className="delete-modal-message">
                  Are you sure you want to delete the batch <span className="delete-modal-batch">{batchToDelete?.title}</span> and all its students?<br />
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>This action cannot be undone.</span>
                </div>
                <div className="delete-modal-actions">
                  <button
                    className="save-button"
                    onClick={confirmDeleteBatch}
                  >
                    Yes, Delete
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setBatchToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            }
            onSave={undefined}
            onCancel={() => {
              setShowDeleteModal(false);
              setBatchToDelete(null);
            }}
            saveText={""}
            cancelText={""}
          />
        )}
      </div>
    </>
  );
}