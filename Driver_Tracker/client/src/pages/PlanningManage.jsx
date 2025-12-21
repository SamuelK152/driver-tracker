import React from "react";
import { Link } from "react-router-dom";
import PageShell from "../lib/PageShell";

const PlanningManage = () => {
  return (
    <PageShell title="Planning Management">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
        <Link
          to="/planning/manage/priority"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">
            Preference Priority
          </h2>
          <p className="text-gray-600">
            Manage employee priority lists for Vans, Equipment, and Service
            Types.
          </p>
        </Link>

        <Link
          to="/planning/manage/positions"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-green-600">
            Custom Positions
          </h2>
          <p className="text-gray-600">
            Add or remove custom positions for scheduling.
          </p>
        </Link>
      </div>
    </PageShell>
  );
};

export default PlanningManage;
