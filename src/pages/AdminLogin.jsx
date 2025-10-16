import { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import "../styles/modal.css";
import { SiStudyverse } from "react-icons/si";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Prevent navigating back
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Both email and password are required.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await API.post("/admin/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen justify-center items-center relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-5 left-5 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition back-btn"
      >
        <FaArrowLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Logo */}
      <div className="flex flex-col items-center absolute top-[3rem]">
        <div className="logo flex items-center text-2xl font-bold gap-2">
          <SiStudyverse size={32} />
          Steady-Study-8
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="login">
        <h2 className="text-xl font-semibold mb-4 text-center">Admin Login</h2>

        <div className="flex flex-col gap-[1.5rem] mt-[3.5rem]">
          {/* Email Input */}
          <input
            type="email"
            placeholder="Email"
            className={`border p-2 w-full mb-3 modal-input ${
              email && !validateEmail(email) ? "border-red-500" : ""
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password Input with Toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`border p-2 w-full mb-3 modal-input pr-10 ${
                password && password.length < 6 ? "border-red-500" : ""
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="show-password"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        {/* Submit Button */}
        <div className="mt-[2.3rem] flex absolute w-1/2 left-[26%]">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full login-btn ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}