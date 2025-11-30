import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [newEquip, setNewEquip] = useState({ type: 'Phone', serialNumber: '', notes: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/equipment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEquipment(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching equipment", error);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/equipment', newEquip, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewEquip({ type: 'Phone', serialNumber: '', notes: '' });
      fetchEquipment();
    } catch (error) {
      console.error("Error adding equipment", error);
      alert("Error adding equipment");
    }
  };

  const markMissing = async (id) => {
    if (!window.confirm("Are you sure you want to mark this item as missing? This will create an issue.")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/equipment/${id}/missing`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEquipment();
    } catch (error) {
      console.error("Error marking missing", error);
      alert("Error marking missing");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Equipment Inventory</h1>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Add New Equipment</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select 
            className="border p-2 rounded"
            value={newEquip.type} onChange={e => setNewEquip({...newEquip, type: e.target.value})}
          >
            <option value="Phone">Phone</option>
            <option value="Gas Card">Gas Card</option>
            <option value="Dolly">Dolly</option>
            <option value="Other">Other</option>
          </select>
          <input 
            type="text" placeholder="Serial Number" className="border p-2 rounded" required
            value={newEquip.serialNumber} onChange={e => setNewEquip({...newEquip, serialNumber: e.target.value})}
          />
          <input 
            type="text" placeholder="Notes" className="border p-2 rounded"
            value={newEquip.notes} onChange={e => setNewEquip({...newEquip, notes: e.target.value})}
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Add Equipment
          </button>
        </form>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Type</th>
                <th className="py-2 px-4 border-b text-left">Serial #</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Notes</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{item.type}</td>
                  <td className="py-2 px-4 border-b">{item.serialNumber}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded text-sm ${
                      item.status === 'Available' ? 'bg-green-100 text-green-800' : 
                      item.status === 'Missing' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{item.notes}</td>
                  <td className="py-2 px-4 border-b">
                    {item.status !== 'Missing' && (
                      <button 
                        onClick={() => markMissing(item._id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Mark Missing
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Equipment;
