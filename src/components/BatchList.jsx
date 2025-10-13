import React, { useState } from "react";
import API from "../api/api";
import Navbar from "./Navbar";

const BatchList = ({ fetchTrigger }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  React.useEffect(() => {
    if (fetchTrigger) {
      setLoading(true);
      const token = localStorage.getItem("token");
      API.get("/admin/batches", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          setBatches(res.data);
          setFetched(true);
        })
        .finally(() => setLoading(false));
    }
  }, [fetchTrigger]);

  if (!fetched && !loading) return null;
  if (loading) return <div>Loading batches...</div>;

  return (
    <>
      <Navbar />
      <div className="p-4">
      <h2 className="text-xl font-bold mb-4">All Batches</h2>
      <ul className="space-y-2">
        {batches.map((batch) => (
          <li key={batch._id} className="border p-2 rounded shadow-sm">
            {batch.title}
          </li>
        ))}
      </ul>
    </div>
    </>
  );
};

export default BatchList;
