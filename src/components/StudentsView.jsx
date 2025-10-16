import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "./Navbar";
import Modal from "./Modal";
import API from "../api/api";
import { FaUserPlus } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { toast } from "react-toastify";
import { Tooltip } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "../../src/App.css";
import "../styles/StudentsView.css";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import '../styles/modal.css';

export default function StudentsView() {
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [newDeviceLimit, setNewDeviceLimit] = useState(2);

    const [quickFilterText, setQuickFilterText] = useState("");
    const onFilterTextChange = useCallback((e) => {
        setQuickFilterText(e.target.value);
    }, []);

    const [defaultColDef] = useState({
        resizable: true,
        sortable: true,
        filter: true,
    });

    useEffect(() => {
        fetchStudentsAndBatches();
    }, []);

    const fetchStudentsAndBatches = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const [studentsRes, batchesRes] = await Promise.all([
                API.get("/admin/students", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                API.get("/admin/batches", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            setStudents(studentsRes.data);
            setBatches(batchesRes.data);
        } catch (err) {
            console.error("Error fetching data", err);
            toast.error("Failed to fetch students or batches.");
        } finally {
            setLoading(false);
        }
    };

    // Add new student (auto-generate password CSV)
    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim())
            return toast.error("Please enter both name and email.");

        try {
            const token = localStorage.getItem("token");
            const res = await API.post(
                "/admin/enroll-student",
                { name: name.trim(), email: email.trim() },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                }
            );

            const blob = new Blob([res.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "student_credentials.csv";
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success("Student added successfully! CSV downloaded.");
            setName("");
            setEmail("");
            setShowAddModal(false);
            await fetchStudentsAndBatches();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || err.message);
        }
    };

    // Reset password
    const handleResetPassword = async (studentId, email) => {
        const token = localStorage.getItem("token");
        try {
            const res = await API.put(
                "/admin/reset-password",
                { studentId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                }
            );

            const blob = new Blob([res.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `reset_password_${email}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success(`Password reset for ${email} — CSV downloaded.`);
        } catch (err) {
            console.error("Reset password error:", err);
            toast.error(
                err.response?.data?.message || "Error resetting password. Try again."
            );
        }
    };

    // Update device limit
    const handleUpdateDeviceLimit = async (studentId) => {
        const token = localStorage.getItem("token");
        try {
            await API.put(
                "/admin/set-student-device-limit",
                { studentId, deviceLimit: Number(newDeviceLimit) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Device limit updated successfully");

            setStudents((prev) =>
                prev.map((s) =>
                    s._id === studentId
                        ? { ...s, deviceLimit: Number(newDeviceLimit) }
                        : s
                )
            );
            setEditingId(null);
        } catch (err) {
            console.error("Device limit update failed:", err);
            toast.error(err.response?.data?.message || "Error updating device limit");
        }
    };

    // Assign batches
    const handleAssignClick = (student) => {
        setSelectedStudent(student);
        setSelectedBatches(student.batchIds?.map((b) => b._id) || []);
        setShowBatchModal(true);
    };

    const handleBatchToggle = (batchId) => {
        setSelectedBatches((prev) =>
            prev.includes(batchId)
                ? prev.filter((id) => id !== batchId)
                : [...prev, batchId]
        );
    };

    const handleSaveBatches = async () => {
        const token = localStorage.getItem("token");
        try {
            await API.put(
                "/admin/assign-batches",
                { studentId: selectedStudent._id, batchIds: selectedBatches },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Batches assigned successfully!");
            setStudents((prev) =>
                prev.map((s) =>
                    s._id === selectedStudent._id
                        ? {
                            ...s,
                            batchIds: batches.filter((b) =>
                                selectedBatches.includes(b._id)
                            ),
                        }
                        : s
                )
            );

            setShowBatchModal(false);
        } catch (err) {
            console.error("Batch assignment error:", err);
            toast.error(
                err.response?.data?.message ||
                "Error assigning batches. Please try again."
            );
        }
    };

    // --- AG Grid Columns ---
    const columnDefs = useMemo(
        () => [
            {
                headerName: "Name",
                field: "name",
                flex: 1,
                filter: "agTextColumnFilter", 
            },
            {
                headerName: "Email",
                field: "email",
                flex: 1,
                filter: "agTextColumnFilter", 
            },
            {
                headerName: "No. of Device Access",
                field: "deviceLimit",
                flex: 1,
                filter: "agNumberColumnFilter",
                cellRenderer: (params) => {
                    const s = params.data;
                    return editingId === s._id ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="5"
                                value={newDeviceLimit}
                                onChange={(e) => setNewDeviceLimit(e.target.value)}
                                className="border p-1 w-16 rounded text-center modal-input"
                            />
                            <button
                                className="text-green-600 font-medium hover:underline"
                                onClick={() => handleUpdateDeviceLimit(s._id)}
                            >
                                Save
                            </button>
                            <button
                                className="text-gray-500 hover:underline"
                                onClick={() => setEditingId(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-start gap-[1rem]">
                            <span>{s.deviceLimit}</span>
                            <Tooltip title="Edit No. of Device Access" arrow>
                                <button
                                    className="edit-btn"
                                    onClick={() => {
                                        setEditingId(s._id);
                                        setNewDeviceLimit(s.deviceLimit);
                                    }}
                                >
                                    <MdEdit
                                        size={20}
                                        className="text-gray-600 hover:text-blue-600 transition-colors"
                                    />
                                </button>
                            </Tooltip>
                        </div>
                    );
                },
            },
            {
                headerName: "Batch Assignment",
                field: "batchIds",
                flex: 1.3,
                suppressHeaderFilterButton: true, // 👈 disables filter menu
                cellRenderer: (params) => (
                    <button
                        className="flex items-center gap-1 text-blue-600 font-medium assign-btn"
                        onClick={() => handleAssignClick(params.data)}
                    >
                        <FaUserPlus className="text-blue-500" /> Assign Batches
                    </button>
                ),
            },
            {
                headerName: "Actions",
                flex: 1,
                suppressHeaderFilterButton: true, // 👈 disables filter menu
                cellRenderer: (params) => (
                    <button
                        className="reset-pwd-btn"
                        onClick={() =>
                            handleResetPassword(params.data._id, params.data.email)
                        }
                    >
                        Reset Password
                    </button>
                ),
            },
        ],
        [editingId, newDeviceLimit]
    );

    return (
        <>
            <Navbar />

            <div className="content-container">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Students</h2>
                    <button
                        className="add-student-btn"
                        onClick={() => setShowAddModal(true)}
                    >
                        Add Student
                    </button>
                </div>

                {loading ? (
                    <p>Loading students...</p>
                ) : (
                    <>
                        <div className="search-container">
                            <input
                                type="text"
                                onChange={onFilterTextChange}
                                placeholder="Search..."
                                className="search-input"
                            />
                        </div>
                        <div className="ag-theme-alpine grid-container">
                            <AgGridReact
                                rowData={students}
                                columnDefs={columnDefs}
                                pagination={true}
                                rowHeight={50}
                                headerHeight={51}
                                paginationPageSize={10}
                                paginationPageSizeSelector={[10, 20, 50]}
                                quickFilterText={quickFilterText}
                                suppressCellFocus={true}
                                defaultColDef={defaultColDef}
                                domLayout="normal"
                            // className="table-container"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <Modal
                    open={showAddModal}
                    title="Add New Student"
                    content={
                        <form
                            id="add-student-form"
                            onSubmit={handleAddStudent}
                            className="flex gap-[1rem] flex-col"
                        >
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="border p-2 w-full rounded modal-input"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border p-2 w-full rounded modal-input"
                                required
                            />
                        </form>
                    }
                    onSave={() =>
                        document.getElementById("add-student-form").requestSubmit()
                    }
                    onCancel={() => setShowAddModal(false)}
                    saveText="Generate CSV"
                    cancelText="Cancel"
                />
            )}

            {/* Assign Batch Modal */}
            {showBatchModal && (
                <Modal
                    open={showBatchModal}
                    title={`Assign Batches for ${selectedStudent?.name || ""}`}
                    content={
                        <form
                            id="assign-batch-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSaveBatches();
                            }}
                        >
                            <div className="space-y-2">
                                {batches.map((batch) => (
                                    <label key={batch._id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedBatches.includes(batch._id)}
                                            onChange={() => handleBatchToggle(batch._id)}
                                        />
                                        {batch.title}
                                    </label>
                                ))}
                            </div>
                        </form>
                    }
                    onSave={handleSaveBatches}
                    onCancel={() => setShowBatchModal(false)}
                    saveText="Save"
                    cancelText="Cancel"
                />
            )}
        </>
    );
}