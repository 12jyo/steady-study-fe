import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";

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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const navigate = useNavigate();

    const COOLDOWN_MS = 800;
    const contentRef = useRef(null);
    const lastTriggerTsRef = useRef(0);
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [overlayMsg, setOverlayMsg] = useState("⚠ Suspicious action detected\nYour actions may be monitored");

    const triggerOverlay = useCallback((reason) => {
        const t = Date.now();
        if (t - lastTriggerTsRef.current < COOLDOWN_MS) return;
        lastTriggerTsRef.current = t;

        if (reason) setOverlayMsg(`⚠ Suspicious action detected\n(${reason})`);
        contentRef.current?.classList.add("blurred");
        setOverlayVisible(true);
    }, []);

    const clearOverlay = useCallback(() => {
        setOverlayVisible(false);
        contentRef.current?.classList.remove("blurred");
    }, []);

    const isSuspiciousKey = (e) => {
        const k = e.key;
        if (k === "Meta" || k === "OS") return "meta-key"; // Command/Windows
        if (e.metaKey) return `meta-combo-${k}`;          // macOS screenshot combos, etc.
        if ((e.ctrlKey || e.metaKey) && ["s", "p"].includes(k?.toLowerCase?.() || "")) return `ctrl-${k?.toLowerCase?.()}`;
        if (k === "Alt" || k === "AltGraph") return "alt/option";
        if (k === "Shift") return "shift";
        if (/^[0-9]$/.test(k)) return "digit-" + k;
        if (/^F([1-9]|1[0-9]|2[0-4])$/.test(k)) return "function-" + k;
        if (k === "PrintScreen" || k === "Print" || k === "Snap") return "printscreen";
        return null;
    };

    // Best-effort: attempt to sanitize clipboard (may be blocked without permissions)
    const attemptClearClipboard = async () => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText("");
            }
        } catch (error) {
            console.error("Clipboard clear failed:", error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        }
    }, [navigate]);

    useEffect(() => {
        window.history.pushState(null, "", window.location.href);
        const handlePopState = () => window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        if (!selectedPdf) return; // attach only while viewer is open

        const onKeyDown = (e) => {
            const reason = isSuspiciousKey(e);
            if (!reason) return;
            try { e.preventDefault(); } catch (error) { console.error("PreventDefault failed:", error); }
            triggerOverlay(reason);

            // Try to clear clipboard for likely screenshot combos on macOS
            if (
                reason.includes("printscreen") ||
                reason.startsWith("meta-combo-3") ||
                reason.startsWith("meta-combo-4") ||
                reason.startsWith("meta-combo-5")
            ) {
                setTimeout(() => { attemptClearClipboard(); }, 0);
            }
        };

        // Some environments dispatch PrintScreen on keyup only — catch both
        const onKeyUp = (e) => {
            if (e.key === "PrintScreen" || e.key === "Print" || e.key === "Snap") {
                try { e.preventDefault(); } catch (error) { console.error("PreventDefault failed:", error); }
                triggerOverlay("printscreen");
                setTimeout(() => { attemptClearClipboard(); }, 0);
            }
        };

        const onPaste = (e) => {
            if (!e.clipboardData) return;
            for (const it of e.clipboardData.items) {
                if (it.kind === "file" && it.type.startsWith("image/")) {
                    triggerOverlay("image-paste");
                    break;
                }
            }
        };

        const onContext = (e) => { e.preventDefault(); triggerOverlay("right-click"); };
        const onCopy = (e) => { e.preventDefault(); triggerOverlay("copy"); };
        const onVisibility = () => { if (document.visibilityState === "hidden") triggerOverlay("tab-switch"); };
        const onDocClick = () => { if (overlayVisible) clearOverlay(); };

        window.addEventListener("keydown", onKeyDown, { capture: true });
        window.addEventListener("keyup", onKeyUp, { capture: true });
        window.addEventListener("paste", onPaste, { capture: true });
        document.addEventListener("contextmenu", onContext, { capture: true });
        document.addEventListener("copy", onCopy, { capture: true });
        document.addEventListener("visibilitychange", onVisibility);
        document.addEventListener("click", onDocClick, { capture: true });

        return () => {
            window.removeEventListener("keydown", onKeyDown, { capture: true });
            window.removeEventListener("keyup", onKeyUp, { capture: true });
            window.removeEventListener("paste", onPaste, { capture: true });
            document.removeEventListener("contextmenu", onContext, { capture: true });
            document.removeEventListener("copy", onCopy, { capture: true });
            document.removeEventListener("visibilitychange", onVisibility);
            document.removeEventListener("click", onDocClick, { capture: true });
        };
    }, [selectedPdf, triggerOverlay, clearOverlay, overlayVisible]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/student-login");
            return;
        }

        API.get("/student/resources", { headers: { Authorization: `Bearer ${token}` } })
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
            window.URL.revokeObjectURL(url);
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
        const datePart = now.toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" });
        const timePart = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
        const sessionInfo = localStorage.getItem("studentId") || "";
        return `${email} - ${datePart} ${timePart} - ${sessionInfo}`;
    };

    const isPdf = (url) => {
        if (!url) return false;
        const cleanUrl = url.split("?")[0].toLowerCase();
        return cleanUrl.endsWith(".pdf");
    };

    const handleResourceClick = async (r) => {
        if (!isPdf(r.url)) return;
        try {
            const token = localStorage.getItem("token");
            const res = await API.get(`/student/resource/${r._id}/file`, { responseType: "blob", headers: { Authorization: `Bearer ${token}` } });
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            if (selectedPdf) window.URL.revokeObjectURL(selectedPdf);

            setPageNumber(1);
            setScale(1);
            setRotation(0);
            setSelectedPdf(url);
            setIsDrawerOpen(false);
        } catch (err) {
            toast.error("Failed to load PDF preview.", err);
        }
    };

    const handleDocumentLoad = ({ numPages }) => { setNumPages(numPages); setPageNumber(1); };
    const handlePrev = () => setPageNumber((p) => Math.max(p - 1, 1));
    const handleNext = () => setPageNumber((p) => Math.min(p + 1, numPages || 1));
    const handleZoomIn = () => setScale((s) => s + 0.2);
    const handleZoomOut = () => setScale((s) => Math.max(0.6, s - 0.2));
    const handleRotate = () => setRotation((r) => (r + 90) % 360);

    const handleClose = () => {
        setSelectedPdf(null);
        setPageNumber(1);
        setScale(1);
        setRotation(0);
        setIsDrawerOpen(false);
        clearOverlay();
    };

    // Drawer Controls
    const toggleDrawer = (open) => (event) => {
        if (event?.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) return;
        setIsDrawerOpen(open);
    };

    useEffect(() => {
        const handleClickOutside = (e) => { if (!(e.target).closest(".profile-menu")) setShowMenu(false); };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const memoizedFile = useMemo(() => {
        if (!selectedPdf) return null;
        return { url: selectedPdf, httpHeaders: { Authorization: `Bearer ${localStorage.getItem("token")}` }, withCredentials: true };
    }, [selectedPdf]);

    useEffect(() => {
        return () => { if (selectedPdf && selectedPdf.startsWith("blob:")) window.URL.revokeObjectURL(selectedPdf); };
    }, [selectedPdf]);

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
            <div ref={contentRef} id="content" className="protected-content">
                <div className="min-h-screen bg-gray-50 select-none">
                    <nav className="flex justify-between items-center navbar">
                        <div className="logo">
                            <SiStudyverse />
                            Steady-Study-8
                        </div>

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
                                    <div className="border-b border-[#e1d8d8] relative pl-[0.8rem] pr-[0.8rem] pt-[0.3rem] pb-[0.3rem]">
                                        <div>{localStorage.getItem("studentName") || ""}</div>
                                    </div>
                                    <button
                                        onClick={() => { setShowMenu(false); handleResetPassword(); }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-gray-700 border-none profile-menu-item"
                                    >
                                        <RiLockPasswordLine className="text-blue-600" /> Reset Password
                                    </button>
                                    <button
                                        onClick={() => { setShowMenu(false); handleLogout(); }}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-red-600 border-none profile-menu-item"
                                    >
                                        <AiOutlineLogout /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </nav>

                    {!selectedPdf ? (
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
                                                        onClick={(e) => { e.stopPropagation(); handleResourceClick(r); }}
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
                        <div className="flex relative h-[calc(100vh-64px)]">

                            <div className={`deterrent-overlay ${overlayVisible ? "show" : ""}`} id="screenshot-overlay">
                                {overlayMsg.split("\n").map((line, idx) => (
                                    <div key={idx}>{line}</div>
                                ))}
                            </div>

                            <div className="watermark-fixed" aria-hidden>
                                {getWatermarkText()}
                            </div>

                            <Drawer anchor="left" open={isDrawerOpen} onClose={toggleDrawer(false)}>
                                {ResourceDrawerContent}
                            </Drawer>

                            <div className="flex-1 flex flex-col items-center justify-center p-4">
                                <div className="w-[90%] flex justify-start mb-4 max-w-[1200px]">
                                    <Tooltip title="Toggle Resources" arrow>
                                        <Button onClick={toggleDrawer(true)} variant="contained" startIcon={<SiStudyverse />} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            Resources
                                        </Button>
                                    </Tooltip>
                                </div>

                                <div className="pdf-modal-fullscreen w-[90%] h-[90%] max-w-[1200px] max-h-[calc(100vh-160px)] shadow-2xl rounded-lg bg-white flex flex-col">
                                    <div className="pdf-modal-header p-4 flex justify-between items-center border-b">
                                        <h3 className="font-semibold text-lg">PDF Preview</h3>
                                        <button onClick={handleClose} className="bg-transparent border-none text-[2.5rem] cursor-pointer text-gray-500 hover:text-gray-800 transition leading-none">×</button>
                                    </div>

                                    <div className="pdf-modal-content flex-1 overflow-auto relative" onContextMenu={(e) => e.preventDefault()}>
                                        <div className="watermark-overlay">
                                            <div className="watermark-grid">
                                                {Array.from({ length: 16 }).map((_, index) => (
                                                    <div key={index} className="watermark-item">{getWatermarkText()}</div>
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

                                    <div className="pdf-modal-footer">
                                        <div className="flex items-center gap-[1rem]">
                                            <button onClick={handlePrev} disabled={pageNumber <= 1} className={`text-gray-600 hover:text-blue-600 disabled:text-gray-300 pdf-page-button${pageNumber <= 1 ? " disabled" : ""}`}>
                                                <FcPrevious />
                                            </button>
                                            <span className="text-sm text-gray-700">Page {pageNumber} of {numPages || "?"}</span>
                                            <button onClick={handleNext} disabled={!!numPages && pageNumber >= numPages} className={`text-gray-600 hover:text-blue-600 disabled:text-gray-300 pdf-page-button${!!numPages && pageNumber >= numPages ? " disabled" : ""}`}>
                                                <FcNext />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-[1rem]">
                                            <Tooltip title="Zoom In" arrow>
                                                <button onClick={handleZoomIn} className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition pdf-control">
                                                    <FaSearchPlus size={20} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Zoom Out" arrow>
                                                <button onClick={handleZoomOut} className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition pdf-control">
                                                    <FaSearchMinus size={20} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Rotate" arrow>
                                                <button onClick={handleRotate} className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition pdf-control">
                                                    <FaSyncAlt size={20} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
            </div>
        </>
    );
}