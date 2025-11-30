import React, { useState, useEffect } from 'react';
import axios from 'axios';

const IssueLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/issues/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      
      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Timestamp</th>
                <th className="py-2 px-4 border-b text-left">Action</th>
                <th className="py-2 px-4 border-b text-left">User</th>
                <th className="py-2 px-4 border-b text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 border-b font-medium">{log.action}</td>
                  <td className="py-2 px-4 border-b">{log.user?.username || 'Unknown'}</td>
                  <td className="py-2 px-4 border-b text-sm">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IssueLog;
