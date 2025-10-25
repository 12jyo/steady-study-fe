import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FaUserShield, FaUserGraduate } from "react-icons/fa";
import { SiStudyverse } from "react-icons/si";

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
            <div className="flex flex-col items-center mt-[3rem]">
                <div className="logo flex items-center text-2xl font-bold gap-2" style={{ color: "#2D164D" }}>
                    <SiStudyverse size={32} />
                    Steady-Study-8
                </div>
            </div>

            <main className="flex-1 flex justify-center items-center">
                <div className="h-[30rem] w-[20rem] text-center">
                    <h2 className="text-2xl font-bold mb-2 text-[2.3rem]">Welcome!</h2>
                    <p className="text-gray-500 mb-6">Please select your role to log in.</p>

                    <div className="flex flex-col gap-[1.5rem] mt-[4rem] items-center">
                        <button
                            onClick={() => navigate("/admin-login")}
                            className="flex items-center justify-center w-full space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 rounded-lg border border-blue-100 transition role"
                        >
                            <FaUserShield className="text-blue-600" />
                            <span>Admin Login</span>
                        </button>

                        <button
                            onClick={() => navigate("/student-login")}
                            className="flex items-center justify-center w-full space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 rounded-lg border border-blue-100 transition role"
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