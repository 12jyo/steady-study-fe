import { useState, useEffect } from "react";
import API from "../api/api";

export default function FileUploader({ batches: propBatches }) {
  const [batchId, setBatchId] = useState("");
  const [file, setFile] = useState(null);
  const [batches, setBatches] = useState(propBatches || []);

  useEffect(() => {
    if (!propBatches) {
      API.get("/admin/batches").then(res => setBatches(res.data));
    }
  }, [propBatches]);

  const upload = async () => {
    const formData = new FormData();
    formData.append("batchId", batchId);
    formData.append("file", file);
    await API.post("/admin/upload", formData);
    alert("File uploaded successfully!");
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Upload PDF</h3>
      <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="border p-2 mr-2">
        <option value="">Select Batch</option>
        {batches && batches.map((b) => <option key={b._id} value={b._id}>{b.title}</option>)}
      </select>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mr-2" />
      <button onClick={upload} className="bg-orange-600 text-white px-4 py-2 rounded">Upload</button>
    </div>
  );
}