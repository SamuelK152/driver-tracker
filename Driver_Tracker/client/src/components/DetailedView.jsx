import React from "react";

const DetailedView = ({ children, summary, alerts, leftPanel, rightPanel }) => {
  return (
    <div className="detailed-view">
      {children && <div className="mb-6">{children}</div>}

      {summary && (
        <div className="bg-white p-4 rounded shadow mb-6">{summary}</div>
      )}

      {alerts && <div className="mb-6">{alerts}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4 h-full">{leftPanel}</div>
        <div className="bg-white rounded shadow p-4 h-full">{rightPanel}</div>
      </div>
    </div>
  );
};

export default DetailedView;
