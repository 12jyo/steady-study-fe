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

// MUI Imports for Drawer functionality
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // New state for Drawer
    const navigate = useNavigate();

    // --- Authentication and Security Hooks ---

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

    // --- Data Fetching and Handlers ---

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

    const handleLogout = () => setShowLogoutModal(true);
    const confirmLogout = async () => {
        const token = localStorage.getItem("token");
        const deviceId = localStorage.getItem("deviceId");
        try {
            await API.post(
                "/student/logout",
                { deviceId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            toast.error(err.response?.data?.message || "Logout failed");
        }
        localStorage.clear();
        setShowLogoutModal(false);
        navigate("/");
    };

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
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "new-password.csv");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url); // Clean up Blob URL
            toast.success("Password generated and CSV downloaded.");

            toast.info("Please login again with your new password.");

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
            localStorage.clear();
            navigate("/");
        } catch (err) {
            toast.error("Failed to generate password.", err);
        }
    };

    const getWatermarkText = () => {
        const email = localStorage.getItem("studentEmail") || "";
        const now = new Date();
        const datePart = now.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const timePart = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const sessionInfo = localStorage.getItem("studentId") || "";
        return `${email} - ${datePart} ${timePart} - ${sessionInfo}`;
    };

    const isPdf = (url) => {
        if (!url) return false;
        const cleanUrl = url.split("?")[0].toLowerCase();
        return cleanUrl.endsWith(".pdf");
    };

    // Consolidated function to handle PDF resource click
    const handleResourceClick = async (r) => {
        if (!isPdf(r.url)) return;

        try {
            const token = localStorage.getItem("token");
            const res = await API.get(`/student/resource/${r._id}/file`, {
                responseType: "blob",
                headers: { Authorization: `Bearer ${token}` },
            });
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            // Clean up old selectedPdf Blob URL before setting new one
            if (selectedPdf) window.URL.revokeObjectURL(selectedPdf);

            setPageNumber(1);
            setScale(1);
            setRotation(0);
            setSelectedPdf(url);
            setIsDrawerOpen(false); // Drawer starts collapsed
        } catch (err) {
            toast.error("Failed to load PDF preview.", err);
        }
    };

    // --- PDF Controls ---

    const handleDocumentLoad = ({ numPages }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };
    const handlePrev = () => setPageNumber((p) => Math.max(p - 1, 1));
    const handleNext = () => setPageNumber((p) => Math.min(p + 1, numPages));
    const handleZoomIn = () => setScale((s) => s + 0.2);
    const handleZoomOut = () => setScale((s) => Math.max(0.6, s - 0.2));
    const handleRotate = () => setRotation((r) => (r + 90) % 360);

    // Updated handleClose to reset PDF viewer state and re-shift resource list
    const handleClose = () => {
        setSelectedPdf(null);
        setPageNumber(1);
        setScale(1);
        setRotation(0);
        setIsDrawerOpen(false);
    };

    // --- Drawer Controls ---
    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setIsDrawerOpen(open);
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

    // Cleanup Blob URLs on close (for when component unmounts or selectedPdf changes)
    useEffect(() => {
        // Cleanup function runs when component unmounts or before selectedPdf changes
        return () => {
            // Check if selectedPdf exists and is a Blob URL (e.g., starts with blob:) before revoking
            if (selectedPdf && selectedPdf.startsWith('blob:')) window.URL.revokeObjectURL(selectedPdf);
        };
    }, [selectedPdf]);

    // Drawer Content Component
    const ResourceDrawerContent = (
        <Box sx={{ width: 350 }} role="presentation">
            <div className="p-4">
                <h3 className="text-xl font-bold mb-4">Available Resources</h3>
                {resources.length === 0 ? (
                    <p className="text-gray-500 italic">No resources found.</p>
                ) : (
                    <List>
                        {resources.map((r) => (
                            <ListItem key={r._id} disablePadding className="border-b border-gray-200">
                                <ListItemButton onClick={() => handleResourceClick(r)}>
                                    <ListItemText primary={r.title.replace(/\.pdf$/i, "")} />
                                    <ListItemIcon className="min-w-0">
                                        <SiStudyverse className="text-blue-600" />
                                    </ListItemIcon>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </div>
        </Box>
    );

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

                {/* Main Content Area: Conditional Rendering */}
                {!selectedPdf ? (
                    // --- Initial View: Full Resource List ---
                    <div className="w-[80%] mx-auto p-8">
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
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevents accidental parent click if any
                                                        handleResourceClick(r);
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
                ) : (
                    // --- PDF Viewer Active View ---
                    <div className="flex relative h-[calc(100vh-64px)]">

                        {/* Drawer for Collapsed Resource List */}
                        <Drawer anchor="left" open={isDrawerOpen} onClose={toggleDrawer(false)}>
                            {ResourceDrawerContent}
                        </Drawer>

                        {/* PDF Viewer Content (main area) */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4">

                            {/* Drawer Toggle Button */}
                            <div className="w-[90%] flex justify-start mb-4 max-w-[1200px]">
                                <Tooltip title="Toggle Resources" arrow>
                                    <Button
                                        onClick={toggleDrawer(true)}
                                        variant="contained"
                                        startIcon={<SiStudyverse />}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Resources
                                    </Button>
                                </Tooltip>
                            </div>

                            {/* PDF Viewer Container */}
                            <div className="pdf-modal-fullscreen w-[90%] h-[90%] max-w-[1200px] max-h-[calc(100vh-160px)] shadow-2xl rounded-lg bg-white flex flex-col">
                                {/* Header (with Close button) */}
                                <div className="pdf-modal-header p-4 flex justify-between items-center border-b">
                                    <h3 className="font-semibold text-lg">PDF Preview</h3>
                                    <button
                                        onClick={handleClose}
                                        className="bg-transparent border-none text-[2.5rem] cursor-pointer text-gray-500 hover:text-gray-800 transition leading-none"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* PDF Content Area */}
                                <div className="pdf-modal-content flex-1 overflow-auto relative" onContextMenu={(e) => e.preventDefault()}>
                                    {/* Watermark Overlay */}
                                    <div className="watermark-overlay">
                                        <div className="watermark-grid">
                                            {Array.from({ length: 16 }).map((_, index) => (
                                                <div key={index} className="watermark-item">
                                                    {getWatermarkText()}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pdf-scroll-wrapper flex justify-center py-4">
                                        <Document
                                            file={memoizedFile}
                                            onLoadSuccess={handleDocumentLoad}
                                            onLoadError={(err) => console.error("PDF Load Error:", err)}
                                            className="flex flex-col items-center gap-4 relative z-0"
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
                    </div>
                )}

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
            </div>
        </>
    );
}