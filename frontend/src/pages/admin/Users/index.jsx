import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import UserFormModal from "../../../components/admin/UserFormModal";
import {
  createUser as createUserRequest,
  deleteUser as deleteUserRequest,
  getApiMessage,
  getUsers as getUsersRequest,
  updateUser as updateUserRequest,
} from "../../../services/userService";
import "./Users.scss";

const roleLabels = {
  admin: "Admin",
  customer: "customer",
};

const LIMIT = 10;

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    variant: "primary",
  });

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");
      setUsers(await getUsersRequest());
    } catch (err) {
      setError(getApiMessage(err, "Không thể tải danh sách người dùng"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function openNotification(title, message, variant = "primary") {
    setNotification({ open: true, title, message, variant });
  }

  async function createUser(payload) {
    try {
      setSubmitting(true);
      await createUserRequest(payload);
      setShowModal(false);
      setSelectedUser(null);
      await fetchUsers();
      openNotification("Thành công", "Thêm mới thành công.", "primary");
    } catch (err) {
      openNotification(
        "Lỗi",
        getApiMessage(err, "Thêm mới thất bại."),
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateUser(payload) {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await updateUserRequest(selectedUser.id, payload);
      setShowModal(false);
      setSelectedUser(null);
      await fetchUsers();
      openNotification("Thành công", "Cập nhật thành công.", "primary");
    } catch (err) {
      openNotification(
        "Lỗi",
        getApiMessage(err, "Cập nhật thất bại."),
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteUser() {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await deleteUserRequest(selectedUser.id);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      await fetchUsers();
      openNotification("Thành công", "Xóa thành công.", "primary");
    } catch (err) {
      setShowDeleteConfirm(false);
      openNotification("Lỗi", getApiMessage(err, "Xóa thất bại."), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitUser(payload) {
    const normalizedPayload = {
      ...payload,
      ...(payload.mat_khau ? { mat_khau: payload.mat_khau } : {}),
    };

    if (!payload.mat_khau) {
      delete normalizedPayload.mat_khau;
    }

    if (selectedUser) {
      updateUser(normalizedPayload);
      return;
    }

    createUser(normalizedPayload);
  }

  function handleAddUser() {
    setSelectedUser(null);
    setShowModal(true);
  }

  function handleEditUser(user) {
    setSelectedUser(user);
    setShowModal(true);
  }

  function handleDeleteClick(user) {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  }

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(kw) ||
        u.ho_ten?.toLowerCase().includes(kw),
    );
  }, [search, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginatedUsers = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const columns = [
    { key: "id", header: "ID", className: "admin-col-id" },
    { key: "ho_ten", header: "Họ tên" },
    { key: "email", header: "Email" },
    { key: "so_dien_thoai", header: "Số điện thoại" },
    {
      key: "role",
      header: "Vai trò",
      render: (row) => (
        <span className={`status-pill status-pill--${row.role}`}>
          {roleLabels[row.role] || row.role}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Ngày tham gia",
      render: (row) => new Date(row.created_at).toLocaleDateString("vi-VN"),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => handleEditUser(row)}
            disabled={submitting}
            aria-label={`Sửa người dùng ${row.email}`}
            title="Sửa"
          >
            <PiPencilLineFill />
          </button>
          <button
            type="button"
            className="admin-icon-btn admin-icon-btn--danger"
            onClick={() => handleDeleteClick(row)}
            disabled={submitting}
            aria-label={`Xóa người dùng ${row.email}`}
            title="Xóa"
          >
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card admin-page-users">
      <div className="admin-toolbar">
        <div>
          <h3>Người dùng</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="admin-toolbar__meta">
            {filtered.length} người dùng
          </span>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleAddUser}
            disabled={submitting}
          >
            <FaPlus />
            Thêm người dùng
          </button>
          <div className="admin-search-wrap">
            <FaSearch className="admin-search-icon" />
            <input
              className="admin-input-search"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {error && <p className="admin-state admin-state--error">{error}</p>}

      {loading ? (
        <p className="admin-state">Đang tải người dùng...</p>
      ) : (
        <DataTable
          columns={columns}
          data={paginatedUsers}
          emptyText="Không tìm thấy người dùng"
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <UserFormModal
        open={showModal}
        mode={selectedUser ? "edit" : "create"}
        user={selectedUser}
        loading={submitting}
        onClose={() => {
          if (submitting) return;
          setShowModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleSubmitUser}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Xóa người dùng"
        message="Bạn có chắc muốn xóa người dùng này không?"
        confirmText={submitting ? "Đang xóa..." : "Xác nhận xóa"}
        cancelText="Hủy"
        onCancel={() => {
          if (submitting) return;
          setShowDeleteConfirm(false);
          setSelectedUser(null);
        }}
        onConfirm={deleteUser}
        confirmVariant="danger"
      />

      <ConfirmModal
        open={notification.open}
        title={notification.title}
        message={notification.message}
        confirmText="Đóng"
        hideCancel
        onCancel={() => setNotification((prev) => ({ ...prev, open: false }))}
        onConfirm={() => setNotification((prev) => ({ ...prev, open: false }))}
        confirmVariant={notification.variant}
      />
    </div>
  );
}

export default Users;
