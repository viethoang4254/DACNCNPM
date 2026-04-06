import { useEffect, useMemo, useState } from "react";
import {
  FaEye,
  FaImage,
  FaPlus,
  FaSearch,
  FaToggleOff,
  FaToggleOn,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";
import { toast } from "react-toastify";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import {
  createPopupBanner,
  deletePopupBanner,
  getPopupApiMessage,
  getPopupBanners,
  togglePopupBanner,
  uploadPopupBannerImage,
  updatePopupBanner,
} from "../../../services/popupBannerService";
import "./PopupBanners.scss";

const LIMIT = 10;

const DEFAULT_FORM = {
  title: "",
  image_url: "",
  link: "",
  start_date: "",
  end_date: "",
  priority: 0,
  target_type: "all",
  is_active: true,
};

const targetTypeLabel = {
  all: "Tất cả",
  guest: "Khách vãng lai",
  logged_in: "Đã đăng nhập",
};

const toLocalInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const mapBannerToForm = (banner) => ({
  title: banner?.title || "",
  image_url: banner?.image_url || "",
  link: banner?.link || "",
  start_date: toLocalInputDateTime(banner?.start_date),
  end_date: toLocalInputDateTime(banner?.end_date),
  priority: Number(banner?.priority || 0),
  target_type: banner?.target_type || "all",
  is_active: Boolean(banner?.is_active),
});

function PopupBannerFormModal({
  open,
  mode,
  loading,
  initialData,
  onClose,
  onSubmit,
  onPreview,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialData ? mapBannerToForm(initialData) : DEFAULT_FORM);
    setSelectedImageFile(null);
    setUploadingImage(false);
  }, [initialData, open]);

  if (!open) return null;

  const validateForm = () => {
    if (!String(form.image_url || "").trim() && !selectedImageFile) {
      toast.error("Vui lòng nhập URL ảnh hoặc chọn tệp ảnh");
      return false;
    }

    if (!String(form.title || "").trim()) {
      toast.error("Vui lòng nhập tiêu đề popup");
      return false;
    }

    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc hợp lệ");
      return false;
    }

    if (startDate >= endDate) {
      toast.error("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    let finalImageUrl = String(form.image_url || "").trim();

    if (!finalImageUrl && selectedImageFile) {
      try {
        setUploadingImage(true);
        const uploadedImageUrl =
          await uploadPopupBannerImage(selectedImageFile);

        if (!uploadedImageUrl) {
          toast.error("Không nhận được URL ảnh sau khi upload");
          return;
        }

        finalImageUrl = uploadedImageUrl;
      } catch (error) {
        toast.error(getPopupApiMessage(error, "Upload ảnh thất bại"));
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    onSubmit({
      ...form,
      title: form.title.trim(),
      image_url: finalImageUrl,
      link: form.link.trim(),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      priority: Number(form.priority || 0),
      is_active: Boolean(form.is_active),
      target_type: form.target_type,
    });
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      toast.error("Vui lòng chọn tệp ảnh trước khi tải lên");
      return;
    }

    try {
      setUploadingImage(true);
      const uploadedImageUrl = await uploadPopupBannerImage(selectedImageFile);

      if (!uploadedImageUrl) {
        toast.error("Không nhận được URL ảnh sau khi upload");
        return;
      }

      setForm((prev) => ({ ...prev, image_url: uploadedImageUrl }));
      toast.success("Upload ảnh thành công");
      setSelectedImageFile(null);
    } catch (error) {
      toast.error(getPopupApiMessage(error, "Upload ảnh thất bại"));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="admin-modal__backdrop" onClick={onClose}>
      <div
        className="popup-banner-form-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="popup-banner-form-modal__header">
          <div>
            <h3>{mode === "edit" ? "Chỉnh sửa popup" : "Tạo popup mới"}</h3>
            <p>Cấu hình popup marketing hiển thị tại trang chủ.</p>
          </div>
          <button
            type="button"
            className="popup-banner-form-modal__close"
            onClick={onClose}
            disabled={loading || uploadingImage}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form className="popup-banner-form-modal__body" onSubmit={handleSubmit}>
          <div className="popup-banner-form-grid">
            <div className="full">
              <label className="tour-form-modal__label" htmlFor="popup-title">
                Tiêu đề
              </label>
              <input
                id="popup-title"
                className="admin-input"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Khuyến mãi tour hè"
              />
            </div>

            <div className="full">
              <label
                className="tour-form-modal__label"
                htmlFor="popup-image-file"
              >
                Chọn tệp ảnh
              </label>
              <div className="popup-banner-upload-row">
                <input
                  id="popup-image-file"
                  type="file"
                  accept="image/*"
                  className="popup-banner-file-input"
                  onChange={(event) =>
                    setSelectedImageFile(event.target.files?.[0] || null)
                  }
                  disabled={loading || uploadingImage}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn--primary popup-banner-upload-btn"
                  onClick={handleUploadImage}
                  disabled={!selectedImageFile || loading || uploadingImage}
                >
                  {uploadingImage
                    ? "Đang tải lên..."
                    : `Tải lên (${selectedImageFile ? 1 : 0})`}
                </button>
              </div>
              {selectedImageFile ? (
                <p className="popup-banner-upload-file">
                  Đã chọn: {selectedImageFile.name}
                </p>
              ) : null}
            </div>

            <div className="full">
              <label
                className="tour-form-modal__label"
                htmlFor="popup-image-url"
              >
                URL ảnh banner
              </label>
              <input
                id="popup-image-url"
                className="admin-input"
                value={form.image_url}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    image_url: event.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="full">
              <label className="tour-form-modal__label" htmlFor="popup-link">
                Link điều hướng
              </label>
              <input
                id="popup-link"
                className="admin-input"
                value={form.link}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, link: event.target.value }))
                }
                placeholder="/tours hoặc https://..."
              />
            </div>

            <div>
              <label
                className="tour-form-modal__label"
                htmlFor="popup-start-date"
              >
                Bắt đầu hiển thị
              </label>
              <input
                id="popup-start-date"
                className="admin-input"
                type="datetime-local"
                value={form.start_date}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    start_date: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label
                className="tour-form-modal__label"
                htmlFor="popup-end-date"
              >
                Kết thúc hiển thị
              </label>
              <input
                id="popup-end-date"
                className="admin-input"
                type="datetime-local"
                value={form.end_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, end_date: event.target.value }))
                }
                required
              />
            </div>

            <div>
              <label
                className="tour-form-modal__label"
                htmlFor="popup-priority"
              >
                Priority
              </label>
              <input
                id="popup-priority"
                className="admin-input"
                type="number"
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priority: event.target.value }))
                }
              />
            </div>

            <div>
              <label
                className="tour-form-modal__label"
                htmlFor="popup-target-type"
              >
                Đối tượng hiển thị
              </label>
              <select
                id="popup-target-type"
                className="admin-select"
                value={form.target_type}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    target_type: event.target.value,
                  }))
                }
              >
                <option value="all">Tất cả</option>
                <option value="guest">Khách vãng lai</option>
                <option value="logged_in">Đã đăng nhập</option>
              </select>
            </div>

            <div className="full popup-banner-inline">
              <input
                id="popup-is-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    is_active: event.target.checked,
                  }))
                }
              />
              <label htmlFor="popup-is-active">
                Bật popup ngay sau khi lưu
              </label>
            </div>
          </div>

          <div className="popup-banner-form-modal__footer">
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => onPreview(form)}
              disabled={loading || uploadingImage}
            >
              <FaEye />
              Xem trước
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={onClose}
              disabled={loading || uploadingImage}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={loading || uploadingImage}
            >
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PopupBannerPreviewModal({ open, banner, onClose }) {
  if (!open || !banner) return null;

  return (
    <div className="admin-modal__backdrop" onClick={onClose}>
      <div
        className="popup-banner-preview-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {banner.image_url ? (
          <img
            className="popup-banner-preview-modal__image"
            src={banner.image_url}
            alt={banner.title || "Xem trước popup"}
          />
        ) : null}

        <div className="popup-banner-preview-modal__content">
          <h4>{banner.title || "Popup Banner"}</h4>
          <p>
            Áp dụng cho: {targetTypeLabel[banner.target_type] || "Tất cả"} | Độ
            ưu tiên: {Number(banner.priority || 0)}
          </p>

          <div className="popup-banner-preview-modal__actions">
            {banner.link ? (
              <a
                className="admin-btn admin-btn--primary"
                href={banner.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Mở link
              </a>
            ) : null}
            <button type="button" className="admin-btn" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PopupBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPopupBanners();
      setBanners(data);
    } catch (err) {
      setError(getPopupApiMessage(err, "Không thể tải danh sách popup"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const filteredBanners = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return banners;

    return banners.filter(
      (item) =>
        item.title?.toLowerCase().includes(kw) ||
        item.link?.toLowerCase().includes(kw),
    );
  }, [banners, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredBanners.length / LIMIT));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedBanners = filteredBanners.slice(
    (page - 1) * LIMIT,
    page * LIMIT,
  );

  const handleCreate = async (payload) => {
    try {
      setSubmitting(true);
      await createPopupBanner(payload);
      toast.success("Tạo popup thành công");
      setShowFormModal(false);
      setEditingBanner(null);
      await fetchBanners();
    } catch (err) {
      toast.error(getPopupApiMessage(err, "Không thể tạo popup"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editingBanner) return;

    try {
      setSubmitting(true);
      await updatePopupBanner(editingBanner.id, payload);
      toast.success("Cập nhật popup thành công");
      setShowFormModal(false);
      setEditingBanner(null);
      await fetchBanners();
    } catch (err) {
      toast.error(getPopupApiMessage(err, "Không thể cập nhật popup"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingBanner) return;

    try {
      setSubmitting(true);
      await deletePopupBanner(editingBanner.id);
      toast.success("Xóa popup thành công");
      setShowDeleteConfirm(false);
      setEditingBanner(null);
      await fetchBanners();
    } catch (err) {
      toast.error(getPopupApiMessage(err, "Không thể xóa popup"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (banner) => {
    try {
      setSubmitting(true);
      await togglePopupBanner(banner.id);
      toast.success("Đã đổi trạng thái popup");
      await fetchBanners();
    } catch (err) {
      toast.error(getPopupApiMessage(err, "Không thể đổi trạng thái popup"));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "title", header: "Tiêu đề" },
    {
      key: "image_url",
      header: "Ảnh",
      className: "admin-col-image",
      render: (row) =>
        row.image_url ? (
          <img className="popup-thumb" src={row.image_url} alt={row.title} />
        ) : (
          <div className="popup-thumb--empty">
            <FaImage />
          </div>
        ),
    },
    {
      key: "display_time",
      header: "Thời gian",
      render: (row) => (
        <span>
          {formatDateTime(row.start_date)} - {formatDateTime(row.end_date)}
        </span>
      ),
    },
    {
      key: "target_type",
      header: "Đối tượng",
      render: (row) => targetTypeLabel[row.target_type] || row.target_type,
    },
    {
      key: "is_active",
      header: "Trạng thái",
      className: "admin-col-status",
      render: (row) => (
        <span
          className={`status-pill status-pill--${row.is_active ? "confirmed" : "cancelled"}`}
        >
          {row.is_active ? "Đang bật" : "Đang tắt"}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Ưu tiên",
      className: "admin-col-priority",
      render: (row) => Number(row.priority || 0),
    },
    {
      key: "actions",
      header: "Thao tác",
      className: "admin-col-actions",
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => {
              setPreviewBanner(row);
              setShowPreviewModal(true);
            }}
            disabled={submitting}
            title="Xem trước"
            aria-label={`Xem trước popup ${row.title}`}
          >
            <FaEye />
          </button>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => {
              setEditingBanner(row);
              setShowFormModal(true);
            }}
            disabled={submitting}
            title="Sửa"
            aria-label={`Sửa popup ${row.title}`}
          >
            <PiPencilLineFill />
          </button>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => handleToggle(row)}
            disabled={submitting}
            title={row.is_active ? "Tắt" : "Bật"}
            aria-label={`${row.is_active ? "Tắt" : "Bật"} popup ${row.title}`}
          >
            {row.is_active ? <FaToggleOn /> : <FaToggleOff />}
          </button>
          <button
            type="button"
            className="admin-icon-btn admin-icon-btn--danger"
            onClick={() => {
              setEditingBanner(row);
              setShowDeleteConfirm(true);
            }}
            disabled={submitting}
            title="Xóa"
            aria-label={`Xóa popup ${row.title}`}
          >
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card admin-page-popups">
      <div className="admin-toolbar">
        <div>
          <h3>Quản lý Popup Banner</h3>
          <span className="admin-toolbar__meta">
            {filteredBanners.length} popup banner
          </span>
        </div>

        <div className="admin-page-popups__toolbar-actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => {
              setEditingBanner(null);
              setShowFormModal(true);
            }}
            disabled={submitting}
          >
            <FaPlus />
            Tạo banner
          </button>

          <div className="admin-search-wrap">
            <FaSearch className="admin-search-icon" />
            <input
              className="admin-input-search"
              placeholder="Tìm theo tiêu đề hoặc link..."
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {error ? <p className="admin-state admin-state--error">{error}</p> : null}

      {loading ? (
        <p className="admin-state">Đang tải danh sách popup...</p>
      ) : (
        <DataTable
          columns={columns}
          data={paginatedBanners}
          emptyText="Chưa có popup nào"
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <PopupBannerFormModal
        open={showFormModal}
        mode={editingBanner ? "edit" : "create"}
        loading={submitting}
        initialData={editingBanner}
        onClose={() => {
          if (submitting) return;
          setShowFormModal(false);
          setEditingBanner(null);
        }}
        onSubmit={editingBanner ? handleUpdate : handleCreate}
        onPreview={(draftBanner) => {
          setPreviewBanner(draftBanner);
          setShowPreviewModal(true);
        }}
      />

      <PopupBannerPreviewModal
        open={showPreviewModal}
        banner={previewBanner}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewBanner(null);
        }}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Xóa popup banner"
        message="Bạn có chắc chắn muốn xóa popup banner này không?"
        confirmText={submitting ? "Đang xóa..." : "Xác nhận xóa"}
        cancelText="Hủy"
        onCancel={() => {
          if (submitting) return;
          setShowDeleteConfirm(false);
          setEditingBanner(null);
        }}
        onConfirm={handleDelete}
        confirmVariant="danger"
      />
    </div>
  );
}

export default PopupBanners;
