import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./RevenueChart.scss";

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function RevenueChart({ data = [] }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h3>Doanh thu theo tháng</h3>
      </div>

      {data.length === 0 ? (
        <div className="dashboard-empty">Chưa có dữ liệu</div>
      ) : (
        <div className="dashboard-chart-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e6edf6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  `${Math.round(Number(value || 0) / 1000000)}M`
                }
              />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default RevenueChart;
