import { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
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

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/admin/login", { email, password });
            localStorage.setItem("token", res.data.token);
            navigate("/dashboard");
        } catch (err) {
            setError("Invalid credentials", err);
        }
    };

    return (
        <div className="flex h-screen justify-center items-center bg-gray-100">
            <h3>Steady Study 8</h3>
            <form onSubmit={handleLogin} className="bg-white p-8 shadow-md rounded w-96">
                <h2 className="text-xl font-semibold mb-4 text-center">Admin Login</h2>
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
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button className="bg-blue-600 text-white py-2 w-full rounded">Login</button>
            </form>
        </div>
    );
}