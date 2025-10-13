import { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function StudentLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [deviceId, setDeviceId] = useState("WEB-DEVICE-001");
    const navigate = useNavigate();

    // Disable back button
    useEffect(() => {
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href);
        };
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const login = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/student/login", { email, password, deviceId });
            localStorage.setItem("token", res.data.token);
            alert("✅ Login successful!");
            navigate("/student-dashboard");
        } catch (err) {
            alert(err.response?.data?.message || "Invalid credentials");
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <form onSubmit={login} className="bg-white p-8 shadow-md rounded w-96">
                <h2 className="text-xl font-semibold mb-4 text-center">Student Login</h2>
                <input
                    type="email"
                    placeholder="Email"
                    className="border p-2 w-full mb-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="border p-2 w-full mb-3"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button className="bg-blue-600 text-white py-2 w-full rounded">
                    Login
                </button>
            </form>
        </div>
    );
}