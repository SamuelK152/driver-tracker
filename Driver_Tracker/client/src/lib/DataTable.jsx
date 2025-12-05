const DataTable = ({ columns, data, emptyMessage = "No records found." }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                className="py-4 px-4 text-center text-gray-500"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((row, idx) => (
            <tr key={row._id || idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="py-2 px-4 border-b text-sm">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
