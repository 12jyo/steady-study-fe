import { useEffect, useState, useMemo } from "react";
import Modal from "../components/Modal";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { FaUserCircle } from "react-icons/fa";
import { AiOutlineLogout } from "react-icons/ai";
import { RiLockPasswordLine } from "react-icons/ri";
import { Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import "../../src/App.css";
import "../styles/StudentDashboard.css";
import { getDeviceId } from "../utils/device";
import { SiStudyverse } from "react-icons/si";
import { FaSearchPlus, FaSearchMinus, FaSyncAlt } from "react-icons/fa";
import { FcNext, FcPrevious } from "react-icons/fc";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function StudentDashboard() {
    const [resources, setResources] = useState([]);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();

    // Redirect to home if not logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        }
    }, [navigate]);

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
    const confirmLogout = async () => {
        const token = localStorage.getItem("token");
        const deviceId = getDeviceId();
        try {
            await API.post(
                "/student/logout",
                { deviceId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            toast.error(err.response?.data?.message || "Logout failed");
        }
        localStorage.removeItem("token");
        setShowLogoutModal(false);
        navigate("/");
    };

    // Reset password handler: directly call API and download CSV
    const handleResetPassword = async () => {
        try {
            const token = localStorage.getItem("token");
            const email = localStorage.getItem("studentEmail");
            const res = await API.put(
                "/student/reset-password",
                { email },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                }
            );
            // Download CSV
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "new-password.csv");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success("Password generated and CSV downloaded.");
        } catch (err) {
            toast.error("Failed to generate password.", err);
        }
    };


    // PDF controls
    const handleDocumentLoad = ({ numPages }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };
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

    const isPdf = (url) => {
        if (!url) return false;
        const cleanUrl = url.split("?")[0].toLowerCase();
        return cleanUrl.endsWith(".pdf");
    };

    // Close dropdown if clicked outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".profile-menu")) setShowMenu(false);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Memoize file object to prevent React-PDF reload warning
    const memoizedFile = useMemo(() => {
        if (!selectedPdf) return null;
        return {
            url: selectedPdf,
            httpHeaders: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            withCredentials: true,
        };
    }, [selectedPdf]);

    // Cleanup Blob URLs on close
    useEffect(() => {
        return () => {
            if (selectedPdf) window.URL.revokeObjectURL(selectedPdf);
        };
    }, [selectedPdf]);

    return (
        <>
        <div className="min-h-screen bg-gray-50 select-none">
            {/* Header */}
            <nav className="flex justify-between items-center navbar">
                <div className="logo">
                    <SiStudyverse />
                    Steady-Study-8
                </div>

                {/* Profile Menu */}
                <div className="relative profile-menu">
                    <Tooltip title="Profile" arrow>
                        <button
                            onClick={() => setShowMenu((prev) => !prev)}
                            className="text-gray-700 hover:text-blue-600 transition profile-button"
                        >
                            <FaUserCircle size={26} />
                        </button>
                    </Tooltip>

                    {showMenu && (
                        <div className="absolute right-[0] mt-2 w-44 bg-white shadow-md z-50 overflow-hidden profile-menu-items">
                            {/* Student Name Display */}
                            <div className="border-b border-[#e1d8d8] relative pl-[0.8rem] pr-[0.8rem] pt-[0.3rem] pb-[0.3rem]">
                            <div className="">
                                {localStorage.getItem("studentName") || ""}
                            </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    handleResetPassword();
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-gray-700 border-none profile-menu-item"
                            >
                                <RiLockPasswordLine className="text-blue-600" /> Reset Password
                            </button>
                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    handleLogout();
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-red-600 border-none profile-menu-item"
                            >
                                <AiOutlineLogout /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Resource Section */}
            <div className="w-[80%] absolute left-[10%]">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-[1.5rem]">
                        <h2 className="text-2xl font-bold">My Resources</h2>
                    </div>

                    {resources.length === 0 ? (
                        <p className="text-gray-500 italic">No resources found.</p>
                    ) : (
                        <div className="width-[80%] block">
                            {resources.map((r) => (
                                <div
                                    key={r._id}
                                    className="p-4 flex justify-between items-center rounded shadow-sm bg-white hover:shadow-md transition width-[100%] border-b border-[#cac4c4] pb-[0.5rem] h-[2rem] mb-[1rem]"
                                >
                                    <p className="text-[1.1rem]">{r.title.replace(/\.pdf$/i, "")}</p>

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
                                                        setPageNumber(1);
                                                        setScale(1);
                                                        setRotation(0);
                                                        setSelectedPdf(url);

                                                    } catch (err) {
                                                        toast.error("Failed to load PDF preview.", err);
                                                    }
                                                }}
                                                className="text-blue-600 border-none bg-transparent text-[#3091c2] cursor-pointer text-[0.9rem]"
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
                    <div className="inset-0 bg-black/70 flex items-center z-50 justify-center">
                        <div className="pdf-modal">
                            {/* Header */}
                            <div className="pdf-modal-header">
                                <h3 className="font-semibold">PDF Preview</h3>
                                <button
                                    onClick={handleClose}
                                    className="bg-transparent border-none text-[2.5rem] cursor-pointer"
                                >
                                    ×
                                </button>
                            </div>
                            {/* PDF Container */}
                            <div className="pdf-modal-content" onContextMenu={(e) => e.preventDefault()}>
                                {/* Watermark Overlay */}
                                <div className="pointer-events-none z-10">
                                    <div className="watermark-logo">
                                        <SiStudyverse className="text-2xl text-[#3091c2]" />
                                        <span>Steady-Study-8</span>
                                    </div>
                                    <div className="watermark-email">
                                        {localStorage.getItem("studentEmail") || ""}
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <Document
                                        file={memoizedFile}
                                        onLoadSuccess={handleDocumentLoad}
                                        onLoadError={(err) => console.error("PDF Load Error:", err)}
                                        className="flex flex-col items-center gap-4 py-4 relative z-0"
                                    >
                                        {numPages && (
                                            <Page
                                                key={`page_${pageNumber}`}
                                                pageNumber={pageNumber}
                                                scale={scale}
                                                renderAnnotationLayer={false}
                                                renderTextLayer={false}
                                                rotate={rotation}
                                            />
                                        )}
                                    </Document>
                                </div>
                            </div>
                            {/* Footer Controls */}
                            <div className="pdf-modal-footer">
                                <div className="flex items-center gap-[1rem]">
                                    <button
                                        onClick={handlePrev}
                                        disabled={pageNumber <= 1}
                                        className={`text-gray-600 hover:text-blue-600 disabled:text-gray-300 pdf-page-button${pageNumber <= 1 ? ' disabled' : ''}`}
                                    >
                                        <FcPrevious />
                                    </button>
                                    <span className="text-sm text-gray-700">
                                        Page {pageNumber} of {numPages || "?"}
                                    </span>
                                    <button
                                        onClick={handleNext}
                                        disabled={pageNumber >= numPages}
                                        className={`text-gray-600 hover:text-blue-600 disabled:text-gray-300 pdf-page-button${pageNumber >= numPages ? ' disabled' : ''}`}
                                    >
                                        <FcNext />
                                    </button>
                                </div>
                                <div className="flex items-center gap-[1rem]">
                                    <Tooltip title="Zoom In" arrow>
                                        <button
                                            onClick={handleZoomIn}
                                            className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition pdf-control"
                                        >
                                            <FaSearchPlus size={20} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Zoom Out" arrow>
                                        <button
                                            onClick={handleZoomOut}
                                            className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition pdf-control"
                                        >
                                            <FaSearchMinus size={20} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Rotate" arrow>
                                        <button
                                            onClick={handleRotate}
                                            className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition pdf-control"
                                        >
                                            <FaSyncAlt size={20} />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Logout Modal */}
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

            {/* Reset Password Modal removed as per requirements */}
        </div>
        </>
    );
}