import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import apiClient from "../../../utils/apiClient";

function ChartRevenue() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchRevenue() {
      try {
        setLoading(true);
        const res = await apiClient.get("/api/admin/revenue");
        if (!active) return;
        setRows(Array.isArray(res.data?.data) ? res.data.data.reverse() : []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Cannot load revenue chart");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchRevenue();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="admin-state">Loading chart...</p>;
  if (error) return <p className="admin-state admin-state--error">{error}</p>;

  return (
    <div className="admin-card">
      <h3>Monthly Revenue</h3>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => Number(value).toLocaleString("vi-VN")} />
            <Line type="monotone" dataKey="revenue" stroke="#f37821" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChartRevenue;
