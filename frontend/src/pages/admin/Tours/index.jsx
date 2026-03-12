import { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import apiClient from "../../../utils/apiClient";

const LIMIT = 10;

function AdminTours() {
  const [tours, setTours]     = useState([]);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    let active = true;
    async function fetchTours() {
      try {
        setLoading(true);
        const res = await apiClient.get("/api/tours", {
          params: { page: 1, limit: 200, sort: "latest" },
        });
        if (!active) return;
        setTours(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Cannot load tours");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchTours();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return tours;
    return tours.filter(
      (t) =>
        t.ten_tour?.toLowerCase().includes(kw) ||
        t.tinh_thanh?.toLowerCase().includes(kw)
    );
  }, [search, tours]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated  = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const columns = [
    { key: "id", header: "ID" },
    {
      key: "hinh_anh",
      header: "Photo",
      render: (row) =>
        row.hinh_anh ? (
          <img src={row.hinh_anh} alt={row.ten_tour} className="admin-thumb" />
        ) : (
          <div className="admin-thumb-placeholder">🏔</div>
        ),
    },
    { key: "ten_tour",       header: "Tour Name" },
    { key: "tinh_thanh",     header: "Province" },
    { key: "diem_khoi_hanh", header: "Departure" },
    { key: "phuong_tien",    header: "Transport" },
    {
      key: "gia",
      header: "Price",
      render: (row) => `${Number(row.gia).toLocaleString("vi-VN")} ₫`,
    },
    { key: "so_ngay",         header: "Days" },
    { key: "so_nguoi_toi_da", header: "Max Pax" },
  ];

  return (
    <div className="admin-card">
      <div className="admin-toolbar">
        <h3>Tours</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="admin-toolbar__meta">{filtered.length} tours</span>
          <div className="admin-search-wrap">
            <FaSearch className="admin-search-icon" />
            <input
              className="admin-input-search"
              placeholder="Search name or province…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {error && <p className="admin-state admin-state--error">{error}</p>}

      {loading ? (
        <p className="admin-state">Loading tours…</p>
      ) : (
        <DataTable columns={columns} data={paginated} emptyText="No tours found" />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default AdminTours;
