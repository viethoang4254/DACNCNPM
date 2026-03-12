function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  hideCancel = false,
  confirmVariant = "danger",
}) {
  if (!open) return null;

  return (
    <div className="confirm-modal__backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal__actions">
          {!hideCancel && (
            <button type="button" className="admin-btn" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button type="button" className={`admin-btn admin-btn--${confirmVariant}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
