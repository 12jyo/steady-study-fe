import "../styles/ViewStudentsModal.css";
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
    { headerName: "Batch Name", field: "title", flex: 1, headerClass: "admin-table-header" },
    {
      headerName: "No. of Students",
      field: "studentsCount",
      flex: 1,
      headerClass: "admin-table-header",
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
      headerClass: "admin-table-header",
      cellRenderer: (params) => (
        <button
          className="action-btn dashboard-view-btn"
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
      {/* <p className="text-gray-600 mb-6">
        Welcome back, Admin. Here’s your school’s overview.
      </p> */}

      {/* Summary Cards */}
  <div className="dashboard-cards-container">
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
          className="ag-theme-alpine admin-table-wrapper"
          style={{ height: 394, width: "100%", borderRadius: '1.2rem', overflow: 'hidden', boxShadow: '0 4px 24px 0 #442D7722', background: 'linear-gradient(120deg, #FCF2A8 0%, #F2DA4C 80%, #E08F35 100%)' }}
        >
          <AgGridReact
            rowData={batches}
            columnDefs={batchColumnDefs}
            domLayout="normal"
            rowHeight={50}
            headerHeight={52}
            getRowClass={() => 'admin-table-row'}
            getRowStyle={() => ({ background: 'rgba(252, 242, 168, 0.85)', borderBottom: '1.5px solid #F2DA4C' })}
            headerClass="admin-table-header"
          />
        </div>
      </div>

      {/* Modal for students in batch */}
      <Modal
        open={openModal}
        className="dashboard-view-modal"
        title={null}
        content={
          <div className="view-students-modal-content">
            <div className="view-students-title">
              {modalBatch ? `Students in ${modalBatch.title}` : "Students"}
            </div>
            {modalStudents.length === 0 ? (
              <div className="view-students-empty">No students in this batch.</div>
            ) : (
              <ul className="view-students-list">
                {modalStudents.map((stu) => (
                  <li key={stu._id} className="view-student-item">
                    <div className="view-student-avatar">
                      {stu.name?.[0]?.toUpperCase() || stu.email?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <div>{stu.name}</div>
                      <div className="view-student-email">{stu.email}</div>
                    </div>
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
