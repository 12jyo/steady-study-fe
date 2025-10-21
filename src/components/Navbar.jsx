import { NavLink, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import Modal from "./Modal";
import { useState } from "react";
import { AiOutlineLogout } from "react-icons/ai";
import { Tooltip } from "@mui/material";
import "../../src/App.css";
import { SiStudyverse } from "react-icons/si";
import API from "../api/api";
import { toast } from "react-toastify";
import { getDeviceId } from "../utils/device";

export default function Navbar() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    const token = localStorage.getItem("token");
    const deviceId = getDeviceId();

    try {
      await API.post(
        "/admin/logout",
        { deviceId }, // ✅ send deviceId
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Logged out successfully!");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error(err.response?.data?.message || "Logout failed");
    }

    localStorage.removeItem("token");
    setShowLogoutModal(false);
    navigate("/");
  };

  return (
    <>
      <nav className="flex justify-between items-center navbar">
        <div className="logo">
          <SiStudyverse />
          Steady-Study-8
        </div>

        <div className="flex items-center gap-[3rem] text-[1.2rem]">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-item active-nav-item" : "nav-item"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/students"
            className={({ isActive }) =>
              isActive ? "nav-item active-nav-item" : "nav-item"
            }
          >
            Students
          </NavLink>
          <NavLink
            to="/batches"
            className={({ isActive }) =>
              isActive ? "nav-item active-nav-item" : "nav-item"
            }
          >
            Batches
          </NavLink>
        </div>

        <Tooltip title="Logout" arrow>
          <button onClick={handleLogout} className="logout">
            <AiOutlineLogout size={20} />
          </button>
        </Tooltip>
      </nav>

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
    </>
  );
}