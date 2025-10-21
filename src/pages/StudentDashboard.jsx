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

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function StudentDashboard() {
    const [resources, setResources] = useState([]);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
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

    // Reset password handler
    const handleResetPassword = () => {
        setShowResetModal(true);
    };

    // PDF controls
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
        <div className="min-h-screen bg-gray-50 select-none">
            {/* Header */}
            <div className="flex justify-between items-center bg-white shadow p-4 relative">
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
            </div>

            {/* Resource Section */}
            <div className="w-[80%] absolute left-[10%]">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold">My Resources</h3>
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
                                    <h3>{r.title.replace(/\.pdf$/i, "")}</h3>

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
                                                className="text-blue-600 text-sm border-none bg-transparent text-[#3091c2] cursor-pointer"
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
                    <div className="inset-0 bg-black/70 flex items-center z-50 width-[80%] block">
                        <div className="bg-white rounded-lg shadow-xl h-[75vh] flex flex-col relative">
                            <div className="flex justify-between items-center p-3">
                                <h3 className="font-semibold">PDF Preview</h3>
                                <button
                                    onClick={handleClose}
                                    className="text-gray-500 hover:text-red-500 text-xl font-bold"
                                >
                                    ×
                                </button>
                            </div>

                            <div
                                className="flex-1 overflow-y-auto bg-gray-100 p-4 w-[50rem]"
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <Document
                                    file={memoizedFile}
                                    onLoadSuccess={handleDocumentLoad}
                                    onLoadError={(err) => console.error("PDF Load Error:", err)}
                                    className="flex flex-col items-center gap-4 py-4"
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


                            <div className="flex justify-center items-center gap-8 p-4 bg-gray-50">
                                {/* Navigation */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handlePrev}
                                        disabled={pageNumber <= 1}
                                        className="text-gray-600 hover:text-blue-600 disabled:text-gray-300"
                                    >
                                        ⬅
                                    </button>
                                    <span className="text-sm text-gray-700">
                                        Page {pageNumber} of {numPages || "?"}
                                    </span>
                                    <button
                                        onClick={handleNext}
                                        disabled={pageNumber >= numPages}
                                        className="text-gray-600 hover:text-blue-600 disabled:text-gray-300"
                                    >
                                        ➡
                                    </button>
                                </div>

                                {/* Zoom & Rotate Controls */}
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col items-center">
                                        <button
                                            onClick={handleZoomIn}
                                            className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition"
                                        >
                                            <FaSearchPlus size={20} />
                                        </button>
                                        <span className="text-xs text-gray-600 mt-1">Zoom</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <button
                                            onClick={handleZoomOut}
                                            className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition"
                                        >
                                            <FaSearchMinus size={20} />
                                        </button>
                                        <span className="text-xs text-gray-600 mt-1">Zoom Out</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <button
                                            onClick={handleRotate}
                                            className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition"
                                        >
                                            <FaSyncAlt size={20} />
                                        </button>
                                        <span className="text-xs text-gray-600 mt-1">Rotate</span>
                                    </div>
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

            {/* Reset Password Modal */}
            {showResetModal && (
                <Modal
                    open={showResetModal}
                    title="Reset Password"
                    content={
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                toast.success("Password reset link sent to your email.");
                                setShowResetModal(false);
                            }}
                            className="flex flex-col gap-3"
                        >
                            <input
                                type="email"
                                placeholder="Enter your registered email"
                                required
                                className="border p-2 rounded"
                            />
                        </form>
                    }
                    onSave={() => {
                        toast.success("Password reset link sent.");
                        setShowResetModal(false);
                    }}
                    onCancel={() => setShowResetModal(false)}
                    saveText="Send Link"
                    cancelText="Cancel"
                />
            )}
        </div>
    );
}