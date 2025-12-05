import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import DataTable from "../lib/DataTable";

const IssueLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get("/api/issues/logs");
      setLogs(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching logs", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Issue Log</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable
          columns={[
            {
              key: "timestamp",
              header: "Timestamp",
              render: (row) => new Date(row.timestamp).toLocaleString(),
            },
            { key: "action", header: "Action" },
            {
              key: "user",
              header: "User",
              render: (row) => row.user?.username || "Unknown",
            },
            { key: "details", header: "Details" },
          ]}
          data={logs}
          emptyMessage="No issue logs yet."
        />
      )}
    </div>
  );
};

export default IssueLog;
