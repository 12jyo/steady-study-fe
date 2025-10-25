import { useState, useEffect } from "react";
import API from "../api/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../styles/modal.css";
import { SiStudyverse } from "react-icons/si";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import { getDeviceId } from "../utils/device";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [recentEmails, setRecentEmails] = useState([]);
  // Load recent emails from localStorage
  useEffect(() => {
    const emails = JSON.parse(localStorage.getItem("recentStudentEmails") || "[]");
    setRecentEmails(emails);
  }, []);
  const [password, setPassword] = useState("");
  const [deviceId] = useState(getDeviceId());
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    // if (!value) setEmailError("Email is required.");
    // else 
    // if (!validateEmail(value)) setEmailError("Invalid email address.");
    // else setEmailError("");
  };

  const login = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Both email and password are required.");
      return;
    }
    if (emailError) {
      setError("Please fix the email before continuing.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await API.post("/student/login", { email, password, deviceId });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("studentEmail", email);
      if (res.data.name) {
        localStorage.setItem("studentName", res.data.name);
      }
      // Store recent email
      let emails = JSON.parse(localStorage.getItem("recentStudentEmails") || "[]");
      emails = emails.filter(e => e !== email); // Remove duplicate
      emails.unshift(email);
      if (emails.length > 5) emails = emails.slice(0, 5);
      localStorage.setItem("recentStudentEmails", JSON.stringify(emails));
      toast.success("Login successful!");
      navigate("/student-dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex justify-center items-center h-screen relative"
      style={{
        minHeight: '100vh',
        width: '100vw',
        overflow: 'auto',
      }}
    >
      <button
        onClick={() => navigate("/")}
        className="absolute top-5 left-5 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition back-btn"
      >
        <FaArrowLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex flex-col items-center absolute top-[3rem]">
        <div className="logo flex items-center text-2xl font-bold gap-2" style={{ color: "#2D164D" }}>
          <SiStudyverse size={32} />
          Steady-Study-8
        </div>
      </div>

      <form onSubmit={login} className="login">
        <h2 className="text-xl font-semibold mb-4 text-center">Student Login</h2>

        <div className="flex flex-col gap-[1.5rem] mt-[3.5rem]">
          <div>
            <input
              type="email"
              placeholder="Email"
              className={`border p-2 w-full mb-1 !w-[21rem] modal-input ${emailError ? "border-red-500" : ""}`}
              value={email}
              onChange={handleEmailChange}
              list="recent-student-emails"
              autoComplete="off"
              onBlur={() => {
                // if (!email) setEmailError("Email is required.");
                // else 
                // if (!validateEmail(email)) setEmailError("Invalid email address.");
              }}
            />
            <datalist id="recent-student-emails">
              {recentEmails.map((em) => (
                <option value={em} key={em} />
              ))}
            </datalist>
            {emailError && <p className="text-red-500 text-xs mt-1 error-text">{emailError}</p>}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`border p-2 w-full !w-[21rem] modal-input pr-10 ${password && password.length < 6 ? "border-red-500" : ""
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

        <div className="mt-[2.3rem] flex relative w-1/2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full login-btn ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
              }`}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}