import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import API from "../api/api";
import { FaUserPlus } from "react-icons/fa";

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
            alert("Failed to fetch students or batches.");
        } finally {
            setLoading(false);
        }
    };

    // Add new student (auto-generate password CSV)
    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim())
            return alert("⚠️ Please enter both name and email.");

        try {
            const token = localStorage.getItem("token");
            const res = await API.post(
                "/admin/enroll-student",
                { name: name.trim(), email: email.trim() },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob", // since we return CSV
                }
            );

            // Download CSV
            const blob = new Blob([res.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "student_credentials.csv";
            a.click();
            window.URL.revokeObjectURL(url);

            alert("Student added successfully! CSV downloaded.");
            setName("");
            setEmail("");
            setShowAddModal(false);

            // Refresh list
            await fetchStudentsAndBatches();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "❌ Error adding student");
        }
    };

    // Reset password → CSV
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

            alert(`Password reset for ${email} — CSV downloaded.`);
        } catch (err) {
            console.error("Reset password error:", err);
            alert(
                err.response?.data?.message || "Error resetting password. Try again."
            );
        }
    };

    // Update device limit (1–5)
    const handleUpdateDeviceLimit = async (studentId) => {
        const token = localStorage.getItem("token");
        try {
            await API.put(
                "/admin/set-student-device-limit",
                {
                    studentId,
                    deviceLimit: Number(newDeviceLimit),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Device limit updated successfully");

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
            alert(err.response?.data?.message || "Error updating device limit");
        }
    };

    // Batch assignment modal open
    const handleAssignClick = (student) => {
        setSelectedStudent(student);
        setSelectedBatches(student.batchIds?.map((b) => b._id) || []);
        setShowBatchModal(true);
    };

    // Batch checkbox toggle
    const handleBatchToggle = (batchId) => {
        setSelectedBatches((prev) =>
            prev.includes(batchId)
                ? prev.filter((id) => id !== batchId)
                : [...prev, batchId]
        );
    };

    // Save assigned batches
    const handleSaveBatches = async () => {
        const token = localStorage.getItem("token");
        try {
            await API.put(
                "/admin/assign-batches",
                {
                    studentId: selectedStudent._id,
                    batchIds: selectedBatches,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Batches assigned successfully!");

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
            alert(
                err.response?.data?.message ||
                "Error assigning batches. Please try again."
            );
        }
    };

    return (
        <>
            <Navbar />

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Students</h2>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        onClick={() => setShowAddModal(true)}
                    >
                        Add Student
                    </button>
                </div>

                {loading ? (
                    <p>Loading students...</p>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Device Access</th>
                                    <th className="px-4 py-3">Batch Assignment</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {students.map((s) => (
                                    <tr key={s._id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3">{s.name}</td>
                                        <td className="px-4 py-3">{s.email}</td>

                                        <td className="px-4 py-3">
                                            {editingId === s._id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        value={newDeviceLimit}
                                                        onChange={(e) => setNewDeviceLimit(e.target.value)}
                                                        className="border p-1 w-16 rounded text-center"
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
                                                <div className="flex items-center justify-between">
                                                    <span>{s.deviceLimit}</span>
                                                    <button
                                                        className="text-blue-600 text-xs font-medium hover:underline"
                                                        onClick={() => {
                                                            setEditingId(s._id);
                                                            setNewDeviceLimit(s.deviceLimit);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            <button
                                                className="flex items-center gap-1 text-blue-600 font-medium hover:underline"
                                                onClick={() => handleAssignClick(s)}
                                            >
                                                <FaUserPlus className="text-blue-500" /> Assign
                                            </button>
                                            {s.batchIds?.length > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {s.batchIds.map((b) => b.title).join(", ")}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            <button
                                                className="text-blue-600 font-semibold hover:underline"
                                                onClick={() => handleResetPassword(s._id, s.email)}
                                            >
                                                Reset Password
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {students.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-6 text-gray-500 italic"
                                        >
                                            No students found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
                        <form onSubmit={handleAddStudent} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="border p-2 w-full rounded"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border p-2 w-full rounded"
                                required
                            />

                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Generate CSV
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBatchModal && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-auto">
                        <h3 className="text-lg font-semibold mb-4">
                            Assign Batches for {selectedStudent?.name}
                        </h3>
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
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowBatchModal(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveBatches}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                                disabled={selectedBatches.length === 0}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}