import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  return (
    <nav className="flex justify-between items-center bg-white px-8 py-4 shadow-sm">
      <div className="text-xl font-semibold text-blue-700">
        Steady-Study-8
      </div>

      <div className="flex items-center space-x-6">
        <Link
          to="/dashboard"
          className="text-gray-700 hover:text-blue-700 font-medium"
        >
          Dashboard
        </Link>
        <Link
          to="/students"
          className="text-gray-700 hover:text-blue-700 font-medium"
        >
          Students
        </Link>
        <Link
          to="/batches"
          className="text-gray-700 hover:text-blue-700 font-medium border border-gray-300 px-3 py-1 rounded hover:bg-blue-50"
        >
          Batches
        </Link>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white font-medium px-4 py-1.5 rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}