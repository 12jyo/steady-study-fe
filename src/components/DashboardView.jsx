import { FaUsers, FaGraduationCap } from "react-icons/fa";
import '../styles/dashboardView.css';
import '../../src/App.css'

export default function DashboardView({ students, batches }) {
  return (
    <div className="content-container">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome back, Admin. Here’s your school’s overview.
      </p>

      <div className="flex gap-[3rem]">
        <div className="card">
          <div className="card-icon">
            <FaUsers className="icon"/>
          </div>
          <div>
            <p className="text-gray-600 font-medium m-[0px]">Total Students</p>
            <p className="text-[3rem] m-[0px]">{students.length}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-icon">
            <FaGraduationCap className="icon" />
          </div>
          <div>
            <p className="text-gray-600 font-medium m-[0px]">Active Batches</p>
            <p className="text-[3rem] m-[0px]">{batches.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}