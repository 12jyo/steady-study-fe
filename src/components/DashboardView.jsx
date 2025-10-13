import { FaUsers, FaGraduationCap } from "react-icons/fa";

export default function DashboardView({ students, batches }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome back, Admin. Here’s your school’s overview.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        <div className="bg-white shadow-sm rounded-lg p-5 flex justify-between items-center">
          <div>
            <h3 className="text-gray-600 font-medium">Total Students</h3>
            <p className="text-3xl font-bold mt-1">{students.length}</p>
            <p className="text-sm text-gray-400 mt-1">
              +{students.length ? "5" : "0"} since last month
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <FaUsers className="text-blue-600 text-2xl" />
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-5 flex justify-between items-center">
          <div>
            <h3 className="text-gray-600 font-medium">Active Batches</h3>
            <p className="text-3xl font-bold mt-1">{batches.length}</p>
            <p className="text-sm text-gray-400 mt-1">
              All batches are on schedule
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <FaGraduationCap className="text-blue-600 text-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}