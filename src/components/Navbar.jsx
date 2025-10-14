import { Link, useNavigate } from "react-router-dom";
import '../styles/navbar.css';
import { RiLogoutBoxRLine } from "react-icons/ri";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  return (
    <nav className="flex justify-between items-center navbar">
      <div className="logo">
        Steady-Study-8
      </div>

      <div className="flex items-center gap-[3rem] text-[1.2rem]">
        <Link
          to="/dashboard"
          className="nav-item"
        >
          Dashboard
        </Link>
        <Link
          to="/students"
          className="nav-item"
        >
          Students
        </Link>
        <Link
          to="/batches"
          className="nav-item"
        >
          Batches
        </Link>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white font-medium px-4 py-1.5 rounded hover:bg-red-700 transition"
      >
        <RiLogoutBoxRLine size={20} />
      </button>
    </nav>
  );
}