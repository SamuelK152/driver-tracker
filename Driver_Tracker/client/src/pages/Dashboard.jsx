import React, { useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import PageShell from "../lib/PageShell";

const Dashboard = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await apiClient.get("/api/drivers/today");
      setMetrics(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching metrics", error);
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      await apiClient.post("/api/assignments/auto-assign", {});
      await fetchMetrics();
      alert("Equipment auto-assigned successfully!");
    } catch (error) {
      console.error("Error auto-assigning", error);
      alert("Error auto-assigning equipment");
      setLoading(false);
    }
  };

  return <PageShell title="Today's Dashboard"></PageShell>;
};

export default Dashboard;
