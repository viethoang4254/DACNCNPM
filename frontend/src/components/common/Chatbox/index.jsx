import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";
import "./Chatbox.scss";

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatTimestamp(value) {
  const date = normalizeDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isUserSideMessage(message) {
  if (!message || typeof message !== "object") return false;

  if (message.side === "right") return true;
  if (message.side === "left") return false;

  if (message.isUser === true) return true;
  if (message.isUser === false) return false;

  const senderType = typeof message.senderType === "string" ? message.senderType.toLowerCase() : "";
  const senderRole = typeof message.senderRole === "string" ? message.senderRole.toLowerCase() : "";
  const sender = typeof message.sender === "string" ? message.sender.toLowerCase() : "";
  const role = typeof message.role === "string" ? message.role.toLowerCase() : "";

  return (
    senderType === "user" ||
    senderRole === "user" ||
    sender === "user" ||
    sender === "me" ||
    sender === "customer" ||
    role === "user"
  );
}

function Chatbox({
  title = "Hỗ trợ đặt tour",
  status = "online",
  messages = [],
  isTyping = false,
  isSending: isSendingProp,
  onSend,
  onAttach,
  placeholder = "Nhập tin nhắn…",
}) {
  const composerId = useId();
  const fileInputId = useId();

  const [draft, setDraft] = useState("");
  const [isSendingLocal, setIsSendingLocal] = useState(false);

  const isSending = isSendingProp ?? isSendingLocal;

  const scrollerRef = useRef(null);
  const fileInputRef = useRef(null);

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => {
        const text = message.text ?? message.content ?? message.message ?? "";

        return {
          ...message,
          _text: text,
          _side: isUserSideMessage(message) ? "right" : "left",
          _timestamp: formatTimestamp(message.createdAt ?? message.created_at),
        };
      }),
    [messages],
  );

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [renderedMessages.length, isTyping]);

  async function handleSubmit(event) {
    event.preventDefault();

    const text = draft.trim();
    if (!text || !onSend || isSending) return;

    let maybePromise;
    try {
      maybePromise = onSend(text);
      setDraft("");
    } catch {
      setDraft(text);
      return;
    }

    if (isSendingProp !== undefined) return;

    try {
      setIsSendingLocal(true);
      await Promise.resolve(maybePromise);
    } finally {
      setIsSendingLocal(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  function triggerAttach() {
    if (isSending) return;
    fileInputRef.current?.click();
  }

  function handleAttachChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    onAttach?.(file);

    // Allow selecting the same file again.
    event.target.value = "";
  }

  const isOnline = status === "online";

  return (
    <section className="chatbox" aria-label="Chatbox">
      <header className="chatbox__header">
        <div className="chatbox__header-main">
          <p className="chatbox__title">{title}</p>
          <p className="chatbox__status" data-status={isOnline ? "online" : "offline"}>
            <span className="chatbox__status-dot" aria-hidden="true" />
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </header>

      <div className="chatbox__messages" ref={scrollerRef} role="log" aria-live="polite">
        {renderedMessages.map((message) => (
          <div
            key={message.id}
            className={`chatbox__message chatbox__message--${message._side}`}
          >
            <div
              className="chatbox__bubble"
              aria-label={message._side === "right" ? "Tin nhắn của bạn" : "Tin nhắn hệ thống"}
            >
              {message._text}
            </div>
            {message._timestamp && (
              <div className="chatbox__timestamp" aria-hidden="true">
                {message._timestamp}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="chatbox__message chatbox__message--left">
            <div className="chatbox__bubble chatbox__bubble--typing" aria-label="Đang nhập">
              <span className="chatbox__typing-dot" />
              <span className="chatbox__typing-dot" />
              <span className="chatbox__typing-dot" />
            </div>
          </div>
        )}
      </div>

      <form className="chatbox__composer" onSubmit={handleSubmit} aria-label="Soạn tin nhắn">
        <label className="chatbox__composer-label" htmlFor={composerId}>
          Tin nhắn
        </label>

        <button
          className="chatbox__icon-button"
          type="button"
          onClick={triggerAttach}
          aria-label="Đính kèm"
          disabled={isSending}
        >
          <FiPaperclip />
        </button>

        <input
          ref={fileInputRef}
          id={fileInputId}
          className="chatbox__file-input"
          type="file"
          onChange={handleAttachChange}
          tabIndex={-1}
          aria-hidden="true"
        />

        <textarea
          id={composerId}
          className="chatbox__input"
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isSending}
        />

        <button
          className="chatbox__send"
          type="submit"
          aria-label="Gửi"
          disabled={isSending || !draft.trim()}
        >
          {isSending ? <span className="chatbox__spinner" aria-hidden="true" /> : <FiSend />}
        </button>
      </form>
    </section>
  );
}

export default Chatbox;
