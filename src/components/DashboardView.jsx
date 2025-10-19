import { FaUsers, FaGraduationCap } from "react-icons/fa";
import { AgGridReact } from "ag-grid-react";
import { useState } from "react";
import "../styles/dashboardView.css";
import "../../src/App.css";
import Modal from "./Modal";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export default function DashboardView({ students, batches }) {
  const [openModal, setOpenModal] = useState(false);
  const [modalStudents, setModalStudents] = useState([]);
  const [modalBatch, setModalBatch] = useState(null);

  const handleViewBatch = (batch) => {
    setModalBatch(batch);
    const batchStudents = students.filter((stu) =>
      Array.isArray(stu.batchIds) && stu.batchIds.some((b) => b._id === batch._id)
    );
    setModalStudents(batchStudents);
    setOpenModal(true);
  };

  // AG Grid columns for batches
  const batchColumnDefs = [
    { headerName: "Batch Name", field: "title", flex: 1 },
    {
      headerName: "Students",
      field: "studentsCount",
      flex: 1,
      valueGetter: (params) =>
        students.filter(
          (stu) =>
            Array.isArray(stu.batchIds) &&
            stu.batchIds.some((b) => b._id === params.data._id)
        ).length,
    },
    {
      headerName: "Action",
      field: "action",
      flex: 1,
      cellRenderer: (params) => (
        <button
          className="view-btn"
          onClick={() => handleViewBatch(params.data)}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="content-container">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome back, Admin. Here’s your school’s overview.
      </p>

      {/* Summary Cards */}
      <div className="flex gap-[3rem] mb-10">
        <div className="card">
          <div className="card-icon">
            <FaUsers className="icon" />
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

      {/* Student Batches Table */}
      <div className="batch-table-container bg-white rounded-lg shadow mt-[3rem] p-5">
        <h2 className="text-lg font-semibold mb-4">Student Batches</h2>
        <div
          className="ag-theme-alpine"
          style={{ height: 394, width: "100%" }}
        >
          <AgGridReact
            rowData={batches}
            columnDefs={batchColumnDefs}
            domLayout="normal"
            rowHeight={50}
            headerHeight={52}
          />
        </div>
      </div>

      {/* Modal for students in batch */}
      <Modal
        open={openModal}
        title={modalBatch ? `Students in ${modalBatch.title}` : "Students"}
        content={
          <div>
            {modalStudents.length === 0 ? (
              <div className="text-gray-500 italic">
                No students in this batch.
              </div>
            ) : (
              <ul className="list-disc pl-5">
                {modalStudents.map((stu) => (
                  <li key={stu._id}>
                    {stu.name} ({stu.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
        onCancel={() => setOpenModal(false)}
        cancelText="Close"
        onSave={undefined}
      />
    </div>
  );
}
