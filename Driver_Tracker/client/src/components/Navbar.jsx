import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <nav className="bg-blue-600 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Driver Tracker</Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-blue-200">Dashboard</Link>
          <Link to="/import" className="hover:text-blue-200">Import Metrics</Link>
          <Link to="/history" className="hover:text-blue-200">History</Link>
          <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
