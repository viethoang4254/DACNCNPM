import { MdDelete, MdVisibility } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";
import DataTable from "../DataTable";
import "./ItineraryTable.scss";

function ItineraryTable({
  data = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
}) {
  const columns = [
    { key: "id", header: "ID" },
    { key: "ten_tour", header: "Tour", className: "itinerary-table__tour" },
    {
      key: "so_ngay",
      header: "Số ngày",
      render: (row) => (
        <span className="itinerary-table__badge">{row.so_ngay}</span>
      ),
    },
    {
      key: "itinerary_count",
      header: "Số lịch trình",
      render: (row) => (
        <span className="itinerary-table__badge">{row.itinerary_count}</span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            type="button"
            className="admin-icon-btn"
            title="Xem lịch trình"
            onClick={() => onView?.(row)}
            disabled={loading}
          >
            <MdVisibility />
          </button>
          <button
            type="button"
            className="admin-icon-btn"
            title="Sửa lịch trình"
            onClick={() => onEdit?.(row)}
            disabled={loading}
          >
            <PiPencilLineFill />
          </button>
          <button
            type="button"
            className="admin-icon-btn admin-icon-btn--danger"
            title="Xóa lịch trình"
            onClick={() => onDelete?.(row)}
            disabled={loading}
          >
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyText="Chưa có dữ liệu itinerary"
      keyField="id"
    />
  );
}

export default ItineraryTable;
