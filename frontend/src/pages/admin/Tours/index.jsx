import { useEffect, useState } from "react";
import { FaImages, FaPlus, FaSearch } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";

import DataTable from "../../../components/admin/DataTable";
import Pagination from "../../../components/admin/Pagination";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import TourFormModal from "../../../components/admin/TourFormModal";
import TourImageModal from "../../../components/admin/TourImageModal";

import apiClient from "../../../utils/apiClient";
import { optimizeImageFile, optimizeImageFiles } from "../../../utils/imageCompression";
import "./Tours.scss";

const LIMIT = 10;
const MAX_IMAGE_SIZE_MB = Number(import.meta.env.VITE_MAX_IMAGE_SIZE_MB || 15);
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const tourColumnsLabels = {
  thumbnail: "Ảnh đại diện",
  tourName: "Tên tour",
  province: "Tỉnh thành",
  departure: "Điểm khởi hành",
  transport: "Phương tiện",
  price: "Giá",
  actions: "Thao tác",
};

function AdminTours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    variant: "primary",
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [imageTour, setImageTour] = useState(null);
  const [tourImages, setTourImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [updatingImageId, setUpdatingImageId] = useState(null);
  const [settingCoverImageId, setSettingCoverImageId] = useState(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [editingImageId, setEditingImageId] = useState(null);
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const [editingImageFile, setEditingImageFile] = useState(null);
  const [imagesError, setImagesError] = useState("");

  const getApiMessage = (err, fallback) =>
    err?.response?.data?.data?.errors?.[0]?.msg ||
    err?.response?.data?.message ||
    fallback;

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

    const baseUrl =
      (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(
        /\/+$/,
        "",
      );

    return imageUrl.startsWith("/") ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
  };

  const getOversizedFiles = (files) => files.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES);

  const getValidFiles = (files) => files.filter((file) => file.size <= MAX_IMAGE_SIZE_BYTES);

  const buildOversizedMessage = (files) => {
    if (files.length === 0) return "";
    const names = files.map((file) => file.name).join(", ");
    return `Các ảnh vượt quá giới hạn ${MAX_IMAGE_SIZE_MB}MB: ${names}.`;
  };

  async function fetchTours() {
    try {
      setLoading(true);
      setError("");

      const res = await apiClient.get("/api/tours", {
        params: { page: 1, limit: 200, sort: "latest" },
      });

      const nextTours = Array.isArray(res.data?.data) ? res.data.data : [];
      setTours(nextTours);
      setImageTour((prev) => {
        if (!prev) return prev;
        return nextTours.find((tour) => tour.id === prev.id) || prev;
      });
    } catch (err) {
      setError(getApiMessage(err, "Không thể tải danh sách tour"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTours();
  }, []);

  function openNotification(title, message, variant = "primary") {
    setNotification({ open: true, title, message, variant });
  }

  async function createTour(payload) {
    try {
      setSubmitting(true);
      await apiClient.post("/api/tours", payload);
      setShowModal(false);
      setSelectedTour(null);
      await fetchTours();
      openNotification("Thành công", "Thêm tour thành công", "primary");
    } catch (err) {
      openNotification(
        "Lỗi",
        getApiMessage(err, "Thêm tour thất bại"),
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTour(payload) {
    if (!selectedTour) return;

    try {
      setSubmitting(true);
      await apiClient.put(`/api/tours/${selectedTour.id}`, payload);
      setShowModal(false);
      setSelectedTour(null);
      await fetchTours();
      openNotification("Thành công", "Cập nhật tour thành công", "primary");
    } catch (err) {
      openNotification(
        "Lỗi",
        getApiMessage(err, "Cập nhật tour thất bại"),
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTour() {
    if (!selectedTour) return;

    try {
      setSubmitting(true);
      await apiClient.delete(`/api/tours/${selectedTour.id}`);
      setShowDeleteConfirm(false);
      setSelectedTour(null);
      await fetchTours();
      openNotification("Thành công", "Xóa tour thành công", "primary");
    } catch (err) {
      setShowDeleteConfirm(false);
      openNotification(
        "Lỗi",
        getApiMessage(err, "Xóa tour thất bại"),
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchTourImages(tourId) {
    try {
      setImagesLoading(true);
      setImagesError("");
      const res = await apiClient.get(`/api/tours/${tourId}/images`);
      setTourImages(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setImagesError(getApiMessage(err, "Không thể tải ảnh tour"));
      setTourImages([]);
    } finally {
      setImagesLoading(false);
    }
  }

  function handleOpenImages(tour) {
    setImageTour(tour);
    setShowImagesModal(true);
    setSelectedImageFiles([]);
    setImageUrlInput("");
    setEditingImageId(null);
    setEditingImageUrl("");
    setEditingImageFile(null);
    setSettingCoverImageId(null);
    fetchTourImages(tour.id);
  }

  function handleCloseImages() {
    if (uploadingImages || processingImages || deletingImageId || updatingImageId || settingCoverImageId) return;
    setShowImagesModal(false);
    setImageTour(null);
    setTourImages([]);
    setSelectedImageFiles([]);
    setImageUrlInput("");
    setEditingImageId(null);
    setEditingImageUrl("");
    setEditingImageFile(null);
    setImagesError("");
    setSettingCoverImageId(null);
  }

  async function handleImageFileChange(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) {
      setSelectedImageFiles([]);
      setImagesError("");
      return;
    }

    try {
      setProcessingImages(true);
      setImagesError("");

      const optimizedFiles = await optimizeImageFiles(files);
      const oversizedFiles = getOversizedFiles(optimizedFiles);
      const validFiles = getValidFiles(optimizedFiles);

      setSelectedImageFiles(validFiles);

      if (oversizedFiles.length > 0) {
        const message = buildOversizedMessage(oversizedFiles);
        setImagesError(message);
        openNotification("Lỗi", message, "danger");
        return;
      }

      setImagesError("");
    } catch {
      const message = "Khong the toi uu anh truoc khi tai len.";
      setSelectedImageFiles([]);
      setImagesError(message);
      openNotification("Lỗi", message, "danger");
    } finally {
      setProcessingImages(false);
    }
  }

  async function handleUploadImages() {
    if (!imageTour || selectedImageFiles.length === 0 || processingImages) return;

    try {
      setUploadingImages(true);
      setImagesError("");

      const formData = new FormData();
      selectedImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await apiClient.post(`/api/tours/${imageTour.id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelectedImageFiles([]);
      await Promise.all([fetchTourImages(imageTour.id), fetchTours()]);
      openNotification("Thành công", "Tải ảnh tour thành công", "primary");
    } catch (err) {
      const msg = getApiMessage(err, "Tải ảnh thất bại");
      setImagesError(msg);
      openNotification("Lỗi", msg, "danger");
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleAddImageByUrl() {
    if (!imageTour) return;

    const imageUrl = imageUrlInput.trim();
    if (!imageUrl) {
      setImagesError("Vui lòng nhập URL ảnh.");
      return;
    }

    try {
      setUploadingImages(true);
      setImagesError("");
      await apiClient.post(`/api/tours/${imageTour.id}/images`, { image_url: imageUrl });

      setImageUrlInput("");
      await Promise.all([fetchTourImages(imageTour.id), fetchTours()]);
      openNotification("Thành công", "Thêm ảnh bằng URL thành công", "primary");
    } catch (err) {
      const msg = getApiMessage(err, "Thêm ảnh bằng URL thất bại");
      setImagesError(msg);
      openNotification("Lỗi", msg, "danger");
    } finally {
      setUploadingImages(false);
    }
  }

  function handleStartEditImage(image) {
    setEditingImageId(image.id);
    setEditingImageUrl(image.image_url || "");
    setEditingImageFile(null);
    setImagesError("");
  }

  function handleCancelEditImage() {
    if (updatingImageId) return;
    setEditingImageId(null);
    setEditingImageUrl("");
    setEditingImageFile(null);
  }

  async function handleEditImageFileChange(file) {
    if (!file) {
      setEditingImageFile(null);
      return;
    }

    try {
      setProcessingImages(true);
      setImagesError("");

      const optimizedFile = await optimizeImageFile(file);

      if (optimizedFile.size > MAX_IMAGE_SIZE_BYTES) {
        const message = `Ảnh ${optimizedFile.name} vượt quá giới hạn ${MAX_IMAGE_SIZE_MB}MB.`;
        setEditingImageFile(null);
        setImagesError(message);
        openNotification("Lỗi", message, "danger");
        return;
      }

      setEditingImageFile(optimizedFile);
    } catch {
      const message = "Khong the toi uu anh truoc khi cap nhat.";
      setEditingImageFile(null);
      setImagesError(message);
      openNotification("Lỗi", message, "danger");
    } finally {
      setProcessingImages(false);
    }
  }

  async function handleSaveEditImage(imageId) {
    if (!imageTour || processingImages) return;

    const imageUrl = editingImageUrl.trim();
    if (!imageUrl && !editingImageFile) {
      setImagesError("Vui lòng nhập URL ảnh hoặc chọn tệp ảnh.");
      return;
    }

    try {
      setUpdatingImageId(imageId);
      setImagesError("");

      const formData = new FormData();
      if (imageUrl) {
        formData.append("image_url", imageUrl);
      }
      if (editingImageFile) {
        formData.append("image", editingImageFile);
      }

      await apiClient.put(`/api/tours/images/${imageId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await Promise.all([fetchTourImages(imageTour.id), fetchTours()]);

      setEditingImageId(null);
      setEditingImageUrl("");
      setEditingImageFile(null);
      openNotification("Thành công", "Cập nhật ảnh thành công", "primary");
    } catch (err) {
      const msg = getApiMessage(err, "Cập nhật ảnh thất bại");
      setImagesError(msg);
      openNotification("Lỗi", msg, "danger");
    } finally {
      setUpdatingImageId(null);
    }
  }

  async function handleDeleteImage(imageId) {
    if (!imageTour) return;

    try {
      setDeletingImageId(imageId);
      setImagesError("");
      await apiClient.delete(`/api/tours/images/${imageId}`);
      await Promise.all([fetchTourImages(imageTour.id), fetchTours()]);
      openNotification("Thành công", "Xóa ảnh thành công", "primary");
    } catch (err) {
      const msg = getApiMessage(err, "Xóa ảnh thất bại");
      setImagesError(msg);
      openNotification("Lỗi", msg, "danger");
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSetCoverImage(imageId) {
    if (!imageTour) return;

    try {
      setSettingCoverImageId(imageId);
      setImagesError("");
      await apiClient.put(`/api/tours/images/${imageId}/cover`);
      await Promise.all([fetchTourImages(imageTour.id), fetchTours()]);
      openNotification("Thành công", "Đặt ảnh nền tour thành công", "primary");
    } catch (err) {
      const msg = getApiMessage(err, "Đặt ảnh nền thất bại");
      setImagesError(msg);
      openNotification("Lỗi", msg, "danger");
    } finally {
      setSettingCoverImageId(null);
    }
  }

  function handleSubmitTour(payload) {
    if (selectedTour) {
      updateTour(payload);
      return;
    }
    createTour(payload);
  }

  function handleAddTour() {
    setSelectedTour(null);
    setShowModal(true);
  }

  function handleEditTour(tour) {
    setSelectedTour(tour);
    setShowModal(true);
  }

  function handleDeleteClick(tour) {
    setSelectedTour(tour);
    setShowDeleteConfirm(true);
  }

  const filteredTours = tours.filter((tour) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return [
      tour.ten_tour,
      tour.mo_ta,
      tour.tinh_thanh,
      tour.diem_khoi_hanh,
      tour.phuong_tien,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(keyword),
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / LIMIT));
  const paginatedTours = filteredTours.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const columns = [
    { key: "id", header: "ID" },
    {
      key: "hinh_anh",
      header: tourColumnsLabels.thumbnail,
      render: (row) =>
        row.hinh_anh ? (
          <img className="admin-thumb" src={resolveImageUrl(row.hinh_anh)} alt={row.ten_tour} />
        ) : (
          <div className="admin-thumb-placeholder">IMG</div>
        ),
    },
    { key: "ten_tour", header: tourColumnsLabels.tourName },
    { key: "tinh_thanh", header: tourColumnsLabels.province },
    { key: "diem_khoi_hanh", header: tourColumnsLabels.departure },
    { key: "phuong_tien", header: tourColumnsLabels.transport },
    {
      key: "gia",
      header: tourColumnsLabels.price,
      render: (row) => `${Number(row.gia).toLocaleString("vi-VN")} ₫`,
    },
    {
      key: "actions",
      header: tourColumnsLabels.actions,
      render: (row) => (
        <div className="admin-icon-actions">
          <button
            className="admin-icon-btn"
            onClick={() => handleEditTour(row)}
            disabled={submitting}
            type="button"
            title="Sửa"
          >
            <PiPencilLineFill />
          </button>
          <button
            className="admin-icon-btn"
            onClick={() => handleOpenImages(row)}
            disabled={submitting}
            type="button"
            title="Hình ảnh"
          >
            <FaImages />
          </button>
          <button
            className="admin-icon-btn admin-icon-btn--danger"
            onClick={() => handleDeleteClick(row)}
            disabled={submitting}
            type="button"
            title="Xóa"
          >
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-card admin-page-tours">
      <div className="admin-toolbar">
        <h3>Tour</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="admin-toolbar__meta">
            {filteredTours.length} tour
          </span>

          <button
            className="admin-btn admin-btn--primary"
            onClick={handleAddTour}
            disabled={submitting}
          >
            <FaPlus /> Thêm tour
          </button>

          <div className="admin-search-wrap">
            <FaSearch className="admin-search-icon" />
            <input
              className="admin-input-search"
              placeholder="Tìm theo tên tour, tỉnh thành..."
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
        <p className="admin-state">Đang tải tour...</p>
      ) : (
        <DataTable
          columns={columns}
          data={paginatedTours}
          emptyText="Không tìm thấy tour"
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <TourFormModal
        open={showModal}
        mode={selectedTour ? "edit" : "create"}
        tour={selectedTour}
        loading={submitting}
        onClose={() => {
          if (submitting) return;
          setShowModal(false);
          setSelectedTour(null);
        }}
        onSubmit={handleSubmitTour}
      />

      <TourImageModal
        open={showImagesModal}
        tour={imageTour}
        images={tourImages}
        loading={imagesLoading}
        uploading={uploadingImages}
        processingFiles={processingImages}
        deletingImageId={deletingImageId}
        updatingImageId={updatingImageId}
        selectedFiles={selectedImageFiles}
        imageUrlInput={imageUrlInput}
        editingImageId={editingImageId}
        editingImageUrl={editingImageUrl}
        error={imagesError}
        onClose={handleCloseImages}
        onFileChange={handleImageFileChange}
        onUpload={handleUploadImages}
        onImageUrlInputChange={setImageUrlInput}
        onAddByUrl={handleAddImageByUrl}
        onStartEditImage={handleStartEditImage}
        onCancelEditImage={handleCancelEditImage}
        onEditUrlChange={setEditingImageUrl}
        onEditFileChange={handleEditImageFileChange}
        editingImageFile={editingImageFile}
        onSaveEditImage={handleSaveEditImage}
        onDeleteImage={handleDeleteImage}
        onSetCoverImage={handleSetCoverImage}
        settingCoverImageId={settingCoverImageId}
        coverImageUrl={imageTour?.hinh_anh || ""}
        maxImageSizeMb={MAX_IMAGE_SIZE_MB}
        resolveImageUrl={resolveImageUrl}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Xóa tour"
        message="Bạn có chắc muốn xóa tour này không?"
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        onCancel={() => {
          if (submitting) return;
          setShowDeleteConfirm(false);
          setSelectedTour(null);
        }}
        onConfirm={deleteTour}
        confirmVariant="danger"
      />

      <ConfirmModal
        open={notification.open}
        title={notification.title}
        message={notification.message}
        confirmText="Đóng"
        hideCancel
        onConfirm={() => setNotification((prev) => ({ ...prev, open: false }))}
        confirmVariant={notification.variant}
      />
    </div>
  );
}

export default AdminTours;
