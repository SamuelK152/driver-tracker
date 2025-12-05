const PageShell = ({ title, actions, children }) => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {actions}
      </div>
      <div className="bg-white rounded shadow p-4">{children}</div>
    </div>
  );
};

export default PageShell;
