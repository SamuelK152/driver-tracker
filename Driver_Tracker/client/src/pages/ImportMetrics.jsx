import { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const DISPLAY_FIELDS = [
  "Transporter Id",
  "Driver name",
  "Route code",
  "Projected Return to Station",
  "Delivery Service Type",
  "cortex_vin_number",
  "All stops",
  "Stops complete",
  "not started stops",
  "total packages",
  "cortex_avg_pace_stops_per_hour",
  "App sign in:",
  "App sign out:",
  "cortex_last_stop_execution_time",
  "cortex_total_break_time_used"
];

const ImportMetrics = () => {
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws);
      setData(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/drivers', {
        metrics: data,
        date: selectedDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Data saved successfully!');
      setData([]);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error saving data';
      console.error("Save Error:", error);
      alert(message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard - Import Driver Metrics</h1>
      <div className="mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="border p-2 rounded" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="border p-2 rounded" />
        </div>
        {data.length > 0 && (
          <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 h-[42px]">
            Save to Database
          </button>
        )}
      </div>
      
      {data.length > 0 && (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200">
              <tr>
                {DISPLAY_FIELDS.map((key) => (
                  <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index}>
                  {DISPLAY_FIELDS.map((key) => (
                    <td key={key} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {row[key] !== undefined ? row[key] : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ImportMetrics;
