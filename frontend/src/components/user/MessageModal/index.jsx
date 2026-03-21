import "./MessageModal.scss";

function MessageModal({
  isOpen,
  type = "success",
  title,
  message,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="message-modal" role="dialog" aria-modal="true">
      <div className="message-modal__overlay" onClick={onClose} />
      <div className={`message-modal__dialog message-modal__dialog--${type}`}>
        <div className="message-modal__icon" aria-hidden="true">
          {type === "success" ? "✓" : "!"}
        </div>

        <h3>{title}</h3>
        <p>{message}</p>

        <button type="button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

export default MessageModal;
