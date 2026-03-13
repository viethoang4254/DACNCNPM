import "./TourImageModal.scss";
import { CgSpinner } from "react-icons/cg";
import { MdDelete, MdImage } from "react-icons/md";
import { PiPencilLineFill } from "react-icons/pi";

function TourImageModal({
  open,
  tour,
  images,
  loading,
  uploading,
  processingFiles,
  deletingImageId,
  selectedFiles,
  error,
  imageUrlInput,
  onImageUrlInputChange,
  onAddByUrl,
  editingImageId,
  editingImageUrl,
  updatingImageId,
  onStartEditImage,
  onCancelEditImage,
  onEditUrlChange,
  onEditFileChange,
  editingImageFile,
  onSaveEditImage,
  onClose,
  onFileChange,
  onUpload,
  onDeleteImage,
  onSetCoverImage,
  settingCoverImageId,
  coverImageUrl,
  maxImageSizeMb,
  resolveImageUrl,
}) {
  if (!open) return null;

  const isCurrentCover = (imageUrl) => {
    if (!coverImageUrl) return false;
    return resolveImageUrl(coverImageUrl) === resolveImageUrl(imageUrl);
  };

  return (
    <div
      className="admin-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-images-modal-title"
    >
      <div className="tour-images-modal">
        <div className="tour-images-modal__header">
          <div>
            <h3 id="tour-images-modal-title">Quản lý hình ảnh</h3>
            <p>
              {tour ? `Tour #${tour.id} - ${tour.ten_tour}` : "Hình ảnh tour"}
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={onClose}
            disabled={
              processingFiles ||
              uploading ||
              Boolean(deletingImageId) ||
              Boolean(settingCoverImageId)
            }
          >
            Đóng
          </button>
        </div>

        <div className="tour-images-modal__body">
          <div className="tour-images-modal__upload-row">
            <input
              type="file"
              multiple
              accept="image/*"
              className="admin-input"
              onChange={onFileChange}
              disabled={processingFiles || uploading || loading}
            />
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={onUpload}
              disabled={
                processingFiles ||
                uploading ||
                loading ||
                selectedFiles.length === 0
              }
            >
              {processingFiles
                ? "Đang tối ưu..."
                : uploading
                  ? "Đang tải lên..."
                  : `Tải lên (${selectedFiles.length})`}
            </button>
          </div>
          <p className="tour-images-modal__helper">
            Ảnh sẽ được resize và nén tự động trước khi tải lên. Mỗi ảnh sau tối
            ưu tối đa {maxImageSizeMb}MB.
          </p>

          <div className="tour-images-modal__url-row">
            <input
              type="url"
              className="admin-input"
              placeholder="Dán URL ảnh (https://...)"
              value={imageUrlInput}
              onChange={(event) => onImageUrlInputChange(event.target.value)}
              disabled={
                uploading ||
                processingFiles ||
                loading ||
                Boolean(deletingImageId) ||
                Boolean(updatingImageId)
              }
            />
            <button
              type="button"
              className="admin-btn"
              onClick={onAddByUrl}
              disabled={
                uploading ||
                processingFiles ||
                loading ||
                Boolean(deletingImageId) ||
                Boolean(updatingImageId) ||
                !imageUrlInput.trim()
              }
            >
              Thêm bằng URL
            </button>
          </div>

          {error && <p className="admin-state admin-state--error">{error}</p>}

          {loading ? (
            <p className="admin-state">Đang tải hình ảnh...</p>
          ) : images.length === 0 ? (
            <p className="admin-state">Chưa có hình ảnh cho tour này</p>
          ) : (
            <div className="tour-images-grid">
              {images.map((image) => (
                <article className="tour-images-card" key={image.id}>
                  <img
                    src={resolveImageUrl(image.image_url)}
                    alt={`Tour ${tour?.id} image ${image.id}`}
                  />
                  <div className="tour-images-card__footer">
                    <span>ID: {image.id}</span>
                    <div className="tour-images-card__actions">
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => onStartEditImage(image)}
                        disabled={
                          Boolean(deletingImageId) || Boolean(updatingImageId)
                        }
                        title="Sửa URL"
                        aria-label={`Sửa URL ảnh ${image.id}`}
                      >
                        <PiPencilLineFill />
                      </button>
                      <button
                        type="button"
                        className={`admin-icon-btn ${isCurrentCover(image.image_url) ? "tour-images-card__icon-btn--active" : ""}`}
                        onClick={() => onSetCoverImage(image.id)}
                        disabled={
                          Boolean(deletingImageId) ||
                          Boolean(updatingImageId) ||
                          Boolean(settingCoverImageId)
                        }
                        title={
                          isCurrentCover(image.image_url)
                            ? "Đang là ảnh nền"
                            : "Đặt làm ảnh nền"
                        }
                        aria-label={
                          isCurrentCover(image.image_url)
                            ? `Ảnh ${image.id} đang là ảnh nền`
                            : `Đặt ảnh ${image.id} làm ảnh nền`
                        }
                      >
                        {settingCoverImageId === image.id ? (
                          <CgSpinner className="tour-images-card__icon-spin" />
                        ) : (
                          <MdImage />
                        )}
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--danger"
                        onClick={() => onDeleteImage(image.id)}
                        disabled={
                          Boolean(deletingImageId) || Boolean(updatingImageId)
                        }
                        title="Xóa ảnh"
                        aria-label={`Xóa ảnh ${image.id}`}
                      >
                        {deletingImageId === image.id ? (
                          <CgSpinner className="tour-images-card__icon-spin" />
                        ) : (
                          <MdDelete />
                        )}
                      </button>
                    </div>
                  </div>

                  {editingImageId === image.id && (
                    <div className="tour-images-card__edit-row">
                      <input
                        type="url"
                        className="admin-input"
                        value={editingImageUrl}
                        onChange={(event) =>
                          onEditUrlChange(event.target.value)
                        }
                        placeholder="https://..."
                        disabled={Boolean(updatingImageId)}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="admin-input"
                        onChange={(event) =>
                          onEditFileChange(event.target.files?.[0] || null)
                        }
                        disabled={processingFiles || Boolean(updatingImageId)}
                      />
                      {editingImageFile && (
                        <p className="admin-state">
                          Đã chọn: {editingImageFile.name}
                        </p>
                      )}
                      <div className="tour-images-card__edit-actions">
                        <button
                          type="button"
                          className="admin-btn"
                          onClick={onCancelEditImage}
                          disabled={Boolean(updatingImageId)}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--primary"
                          onClick={() => onSaveEditImage(image.id)}
                          disabled={
                            processingFiles ||
                            Boolean(updatingImageId) ||
                            (!editingImageUrl.trim() && !editingImageFile)
                          }
                        >
                          {processingFiles
                            ? "Đang tối ưu..."
                            : updatingImageId === image.id
                              ? "Đang lưu..."
                              : "Lưu thay đổi"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TourImageModal;
