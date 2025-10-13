import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FaUserShield, FaUserGraduate } from "react-icons/fa";

export default function Home() {
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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="flex items-center justify-between bg-white shadow px-8 py-4">
                <div className="flex items-center space-x-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422A12.083 12.083 0 0118 13.5C18 17.642 15.642 21 12 21s-6-3.358-6-7.5a12.083 12.083 0 01-.16-2.922L12 14z"
              />
            </svg> */}
                    </div>
                    <h1 className="text-xl font-semibold text-gray-800">Steady Study 8</h1>
                </div>
            </header>

            <main className="flex-1 flex justify-center items-center">
                <div className="bg-white p-10 rounded-xl shadow-md w-96 text-center">
                    <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
                    <p className="text-gray-500 mb-6">Please select your role to log in.</p>

                    <div className="space-y-4">
                        <button
                            onClick={() => navigate("/admin-login")}
                            className="flex items-center justify-center w-full space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 rounded-lg border border-blue-100 transition"
                        >
                            <FaUserShield className="text-blue-600" />
                            <span>Admin Login</span>
                        </button>

                        <button
                            onClick={() => navigate("/student-login")}
                            className="flex items-center justify-center w-full space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 rounded-lg border border-blue-100 transition"
                        >
                            <FaUserGraduate className="text-blue-600" />
                            <span>Student Login</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}