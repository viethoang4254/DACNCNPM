import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import "./BookingPieChart.scss";

const COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626"];

function BookingPieChart({
  status = { paid: 0, cod: 0, pending: 0, cancelled: 0 },
}) {
  const data = [
    { name: "Đã thanh toán", value: Number(status.paid || 0) },
    { name: "COD", value: Number(status.cod || 0) },
    { name: "Chưa thanh toán", value: Number(status.pending || 0) },
    { name: "Đã hủy", value: Number(status.cancelled || 0) },
  ];

  const hasData = data.some((item) => item.value > 0);

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h3>Tỉ lệ trạng thái đơn</h3>
      </div>

      {!hasData ? (
        <div className="dashboard-empty">Chưa có dữ liệu</div>
      ) : (
        <div className="dashboard-pie-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={92}
                innerRadius={56}
                label
              >
                {data.map((item, index) => (
                  <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <ul className="dashboard-pie-legend">
            {data.map((item, index) => (
              <li key={item.name}>
                <span
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <em>{item.name}</em>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default BookingPieChart;
