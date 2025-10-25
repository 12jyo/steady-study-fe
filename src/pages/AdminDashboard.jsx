import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/api";
import Navbar from "../components/Navbar";
import DashboardView from "../components/DashboardView";
import StudentsView from "../components/StudentsView";
import BatchesView from "../components/BatchesView";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to home if not logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        }
    }, [navigate]);

    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);

    const fetchOverview = async () => {
        try {
            const [studentsRes, batchesRes] = await Promise.all([
                API.get("/admin/students"),
                API.get("/admin/batches"),
            ]);
            setStudents(studentsRes.data || []);
            setBatches(batchesRes.data || []);
        } catch (err) {
            console.error("❌ Failed to fetch dashboard overview:", err);
        }
    };

    useEffect(() => {
        const path = location.pathname.replace(/\/$/, "");
        if (
            (path.endsWith("/admin") || path.endsWith("/dashboard")) &&
            students.length === 0
        ) {
            fetchOverview();
        }
    }, [location.pathname]);

    const handleDashboardClick = () => navigate("/admin/dashboard");
    const handleStudentsClick = () => navigate("/admin/students");
    const handleBatchesClick = () => navigate("/admin/batches");

    return (
        <div className="">
            <Navbar
                onDashboardClick={handleDashboardClick}
                onStudentsClick={handleStudentsClick}
                onBatchesClick={handleBatchesClick}
            />

            <main className="p-8">
                <Routes>
                    <Route
                        path="/dashboard"
                        element={<DashboardView students={students} batches={batches} />}
                    />

                    {/* <Route path="/students" element={<StudentsView />} />

                    <Route path="/batches" element={<BatchesView />} /> */}

                    <Route
                        path="/"
                        element={<DashboardView students={students} batches={batches} />}
                    />
                </Routes>
            </main>
        </div>
    );
}