import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { AiOutlineLogout } from "react-icons/ai";
import { Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import "../../src/App.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function StudentDashboard() {
    const [resources, setResources] = useState([]);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const navigate = useNavigate();

    // Disable back navigation
    useEffect(() => {
        window.history.pushState(null, "", window.location.href);
        const handlePopState = () => window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // Disable Ctrl+S / Ctrl+P
    useEffect(() => {
        const disableShortcuts = (e) => {
            if ((e.ctrlKey || e.metaKey) && ["s", "p"].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };
        window.addEventListener("keydown", disableShortcuts);
        return () => window.removeEventListener("keydown", disableShortcuts);
    }, []);

    // Disable right-click
    useEffect(() => {
        const disableContext = (e) => e.preventDefault();
        document.addEventListener("contextmenu", disableContext);
        return () => document.removeEventListener("contextmenu", disableContext);
    }, []);

    // Fetch resources
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/student-login");
            return;
        }

        API.get("/student/resources", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => setResources(res.data))
            .catch(() => {
                toast.error("Session expired. Please login again.");
                localStorage.removeItem("token");
                navigate("/student-login");
            });
    }, [navigate]);

    // Logout handlers
    const handleLogout = () => setShowLogoutModal(true);
    const confirmLogout = () => {
        localStorage.removeItem("token");
        setShowLogoutModal(false);
        navigate("/");
    };

    // PDF Controls
    const handleDocumentLoad = ({ numPages }) => setNumPages(numPages);
    const handlePrev = () => setPageNumber((p) => Math.max(p - 1, 1));
    const handleNext = () => setPageNumber((p) => Math.min(p + 1, numPages));
    const handleZoomIn = () => setScale((s) => s + 0.2);
    const handleZoomOut = () => setScale((s) => Math.max(0.6, s - 0.2));
    const handleRotate = () => setRotation((r) => (r + 90) % 360);
    const handleClose = () => {
        setSelectedPdf(null);
        setPageNumber(1);
        setScale(1);
        setRotation(0);
    };

    // Helper: detect PDF
    const isPdf = (url) => {
        if (!url) return false;
        const cleanUrl = url.split("?")[0].toLowerCase();
        return cleanUrl.endsWith(".pdf");
    };

    return (
        <div className="min-h-screen bg-gray-50 select-none">
            {/* Header */}
            <div className="flex justify-between items-center bg-white shadow p-4">
                <h2 className="text-xl font-bold text-gray-800">Student Dashboard</h2>
                <Tooltip title="Logout" arrow>
                    <button
                        onClick={handleLogout}
                        className="logout"
                    >
                        <AiOutlineLogout size={20} />
                    </button>
                </Tooltip>

                {showLogoutModal && (
                    <Modal
                        open={showLogoutModal}
                        title="Logout Confirmation"
                        content={<div>Are you sure you want to logout?</div>}
                        onSave={confirmLogout}
                        onCancel={() => setShowLogoutModal(false)}
                        saveText="Logout"
                        cancelText="Cancel"
                    />
                )}
            </div>

            {/* Resource Section */}
            <div className="p-8">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">My Resources</h3>

                {resources.length === 0 ? (
                    <p className="text-gray-500 italic">No resources found.</p>
                ) : (
                    <div className="grid gap-4">
                        {resources.map((r) => (
                            <div
                                key={r._id}
                                className="border p-4 flex justify-between items-center rounded shadow-sm bg-white hover:shadow-md transition"
                            >
                                <span>{r.title}</span>

                                {r.url ? (
                                    isPdf(r.url) ? (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem("token");
                                                    const res = await API.get(`/student/resource/${r._id}/file`, {
                                                        responseType: "blob",
                                                        headers: { Authorization: `Bearer ${token}` },
                                                    });
                                                    const blob = new Blob([res.data], { type: "application/pdf" });
                                                    const url = window.URL.createObjectURL(blob);
                                                    setSelectedPdf(url);
                                                } catch (err) {
                                                    toast.error("Failed to load PDF preview.", err);
                                                }
                                            }}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            View
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-sm italic">No Preview</span>
                                    )
                                ) : (
                                    <span className="text-gray-400 text-xs">(no link)</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PDF Viewer Modal */}
            {selectedPdf && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-[80vw] h-[75vh] flex flex-col relative">
                        <div className="flex justify-between items-center p-3 border-b">
                            <h3 className="font-semibold">PDF Preview</h3>
                            <button
                                onClick={handleClose}
                                className="text-gray-500 hover:text-red-500 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <div
                            className="flex-1 overflow-y-auto bg-gray-100 p-4"
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <Document
                                file={{
                                    url: selectedPdf,
                                    httpHeaders: {
                                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                                    },
                                    withCredentials: true,
                                }}
                                onLoadSuccess={handleDocumentLoad}
                                onLoadError={(err) =>
                                    console.error("PDF Load Error:", err)
                                }
                                className="flex flex-col items-center gap-4 py-4"
                            >
                                {Array.from(new Array(numPages), (el, index) => (
                                    <Page
                                        key={`page_${index + 1}`}
                                        pageNumber={index + 1}
                                        scale={scale}
                                        renderAnnotationLayer={false}
                                        renderTextLayer={false}
                                        rotate={rotation}
                                    />
                                ))}
                            </Document>
                        </div>

                        <div className="flex justify-center gap-5 p-3 border-t bg-gray-50 text-sm">
                            <button onClick={handlePrev} disabled={pageNumber <= 1}>
                                ⬅ Prev
                            </button>
                            <span>
                                Page {pageNumber} of {numPages || "?"}
                            </span>
                            <button onClick={handleNext} disabled={pageNumber >= numPages}>
                                Next ➡
                            </button>
                            <button onClick={handleZoomIn}>Zoom In</button>
                            <button onClick={handleZoomOut}>Zoom Out</button>
                            <button onClick={handleRotate}>Rotate</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}