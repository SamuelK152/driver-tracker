import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Options = () => {
  const [timezone, setTimezone] = useState('UTC');
  const [targetClockOutTime, setTargetClockOutTime] = useState('17:00');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (response.ok) {
          if (data.timezone) setTimezone(data.timezone);
          if (data.targetClockOutTime) setTargetClockOutTime(data.targetClockOutTime);
        } else {
          setError('Failed to load settings');
        }
      } catch (err) {
        setError('Error connecting to server');
      }
    };

    fetchSettings();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5000/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timezone, targetClockOutTime })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Settings updated successfully');
      } else {
        setError(data.message || 'Failed to update settings');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded shadow mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Options</h2>
      
      {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timezone">
            Time Zone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="UTC">UTC</option>
            <option value="PST">PST (Pacific Standard Time)</option>
            <option value="EST">EST (Eastern Standard Time)</option>
            <option value="CST">CST (Central Standard Time)</option>
            <option value="MST">MST (Mountain Standard Time)</option>
            {/* Add more timezones as needed */}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="targetClockOutTime">
            Target Clock Out Time (24h format)
          </label>
          <input
            type="time"
            id="targetClockOutTime"
            value={targetClockOutTime}
            onChange={(e) => setTargetClockOutTime(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Options;
