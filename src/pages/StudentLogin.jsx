import { useState, useEffect } from "react";
import API from "../api/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../styles/modal.css";
import { SiStudyverse } from "react-icons/si";

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
            toast.success("Login successful!");
            navigate("/student-dashboard");
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid credentials");
        }
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="flex flex-col items-center absolute top-[3rem]">
                <div className="logo flex items-center text-2xl font-bold gap-2">
                    <SiStudyverse size={32} />
                    Steady-Study-8
                </div>
            </div>
            <form onSubmit={login} className="login">
                <h2 className="text-xl font-semibold mb-4 text-center">Student Login</h2>
                <div className="flex flex-col gap-[1.5rem] mt-[3.5rem]">

                    <input
                        type="email"
                        placeholder="Email"
                        className="border p-2 w-full mb-3 modal-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="border p-2 w-full mb-3 modal-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="mt-[2.3rem] flex absolute w-1/2 left-[26%]">
                    <button className="w-full login-btn">
                        Login
                    </button>
                </div>
            </form>
        </div>
    );
}