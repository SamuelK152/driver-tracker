const Dashboard = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">Welcome to the Driver Tracker Dashboard. New features coming soon.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
          <p className="text-gray-500">Overview of driver performance will appear here.</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
          <p className="text-gray-500">Latest uploads and updates.</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">System Status</h3>
          <p className="text-green-500">All systems operational</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
