import { useEffect, useMemo, useRef, useState } from "react";
import { FaPaperPlane, FaRegSmile, FaTrashAlt } from "react-icons/fa";
import { io } from "socket.io-client";
import { getAuthToken, getAuthUser } from "../../../utils/authStorage";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import "../../../components/admin/AdminBase.scss";
import "./Chat.scss";

const EMOJIS = ["😀", "😅", "😍", "🥰", "😂", "👍", "🙏", "❤️", "🎉", "🤝"];

const insertAtCursor = ({ textarea, value, insertText }) => {
  if (!textarea) return value + insertText;

  const start = typeof textarea.selectionStart === "number" ? textarea.selectionStart : value.length;
  const end = typeof textarea.selectionEnd === "number" ? textarea.selectionEnd : value.length;
  return value.slice(0, start) + insertText + value.slice(end);
};

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const truncate = (value, maxLen = 60) => {
  const str = String(value || "").trim();
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen)}…`;
};

function AdminChat({ apiBaseUrl }) {
  const resolvedBaseUrl = apiBaseUrl || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, conversationId: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, conversationId: "" });
  const [authToken, setAuthToken] = useState(() => getAuthToken());

  const socketRef = useRef(null);
  const activeIdRef = useRef("");
  const messagesByConversationRef = useRef(new Map());
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiWrapRef = useRef(null);
  const ctxMenuRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const adminName = useMemo(() => getAuthUser()?.ho_ten || "Admin", [authToken]);

  useEffect(() => {
    const onAuthChanged = () => setAuthToken(getAuthToken());
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const socket = io(resolvedBaseUrl, {
      autoConnect: true,
      transports: ["websocket"],
      auth: authToken ? { token: authToken } : undefined,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("agent:hello");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setEmojiOpen(false);
      setCtxMenu((prev) => ({ ...prev, open: false }));
      setDeleteConfirm({ open: false, conversationId: "" });
    });

    socket.on("conversations:update", (list) => {
      const next = Array.isArray(list) ? list : [];
      setConversations(next);

      const current = activeIdRef.current;
      if (current && !next.some((c) => c?.id === current)) {
        activeIdRef.current = "";
        setActiveId("");
        setMessages([]);
      }
    });

    socket.on("conversation:history", (payload) => {
      const payloadId = String(payload?.conversationId || "").trim();
      if (!payloadId || payloadId !== activeIdRef.current) return;
      const nextMessages = Array.isArray(payload.messages) ? payload.messages : [];
      messagesByConversationRef.current.set(payloadId, nextMessages);
      setMessages(nextMessages);
    });

    socket.on("message:new", (message) => {
      const payloadId = String(message?.conversationId || "").trim();
      if (!payloadId || payloadId !== activeIdRef.current) return;
      setMessages((prev) => {
        const nextMessages = [...prev, message];
        messagesByConversationRef.current.set(payloadId, nextMessages);
        return nextMessages;
      });
    });

    socket.on("conversation:deleted", (payload) => {
      const deletedId = payload?.conversationId;
      if (!deletedId) return;
      if (deletedId === activeIdRef.current) {
        activeIdRef.current = "";
        setActiveId("");
        setMessages([]);
      }
    });

    socket.on("agent:error", (payload) => {
      const msg = payload?.message || "Unknown error";
      console.error("[chatbox] agent:error:", msg);
    });

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [resolvedBaseUrl, authToken]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (!activeId) return;

    socket.emit("agent:join", { conversationId: activeId }, (resp) => {
      const respId = String(resp?.conversationId || "").trim();
      if (!respId || respId !== activeIdRef.current) return;
      if (Array.isArray(resp?.messages)) {
        messagesByConversationRef.current.set(respId, resp.messages);
        setMessages(resp.messages);
      }

      if (resp?.ok === false && resp?.message) {
        console.error("[chatbox] agent:join ack error:", resp.message);
      }
    });
  }, [activeId]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (!shouldAutoScrollRef.current) return;
    list.scrollTop = list.scrollHeight;
  }, [messages]);

  const updateAutoScrollState = () => {
    const list = listRef.current;
    if (!list) return;
    const thresholdPx = 24;
    const distanceFromBottom = list.scrollHeight - (list.scrollTop + list.clientHeight);
    shouldAutoScrollRef.current = distanceFromBottom <= thresholdPx;
  };

  useEffect(() => {
    if (!emojiOpen && !ctxMenu.open && !deleteConfirm.open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setEmojiOpen(false);
        setCtxMenu((prev) => ({ ...prev, open: false }));
        setDeleteConfirm({ open: false, conversationId: "" });
      }
    };

    const onPointerDown = (e) => {
      const emojiWrap = emojiWrapRef.current;
      if (emojiOpen && emojiWrap && emojiWrap.contains(e.target)) return;

      const ctxMenuEl = ctxMenuRef.current;
      if (ctxMenu.open && ctxMenuEl && ctxMenuEl.contains(e.target)) return;

      setEmojiOpen(false);
      setCtxMenu((prev) => ({ ...prev, open: false }));
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [emojiOpen, ctxMenu.open, deleteConfirm.open]);

  const onSelectConversation = (id) => {
    if (!id) return;
    if (id === activeIdRef.current) return;
    setCtxMenu((prev) => ({ ...prev, open: false }));
    setEmojiOpen(false);
    activeIdRef.current = id;
    shouldAutoScrollRef.current = true;
    const cached = messagesByConversationRef.current.get(id);
    setMessages(Array.isArray(cached) ? cached : []);
    setActiveId(id);
  };

  const sendMessage = () => {
    const normalized = text.trim();
    if (!normalized) return;
    if (!activeIdRef.current) return;

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("agent:message", {
      conversationId: activeIdRef.current,
      text: normalized,
      senderName: adminName,
    });

    setText("");
    setEmojiOpen(false);
    shouldAutoScrollRef.current = true;
  };

  const onKeyDownComposer = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onPickEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const nextValue = insertAtCursor({ textarea, value: text, insertText: emoji });
    setText(nextValue);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    setEmojiOpen(false);
  };

  const onOpenContextMenu = (e, id) => {
    e.preventDefault();
    setCtxMenu({ open: true, x: e.clientX, y: e.clientY, conversationId: id });
  };

  const onRequestDeleteConversation = (id) => {
    if (!id) return;
    setCtxMenu((prev) => ({ ...prev, open: false }));
    setDeleteConfirm({ open: true, conversationId: id });
  };

  const onConfirmDeleteConversation = () => {
    const socket = socketRef.current;
    const id = deleteConfirm.conversationId;
    if (!socket || !id) {
      setDeleteConfirm({ open: false, conversationId: "" });
      return;
    }

    socket.emit("agent:deleteConversation", { conversationId: id });
    setDeleteConfirm({ open: false, conversationId: "" });
  };

  return (
    <main className="chatbox-page">
      <section className="admin-card chatbox-card">
        <header className="chatbox-header">
          <div>
            <h3>Chatbox</h3>
            <div className="chatbox-subtitle">{connected ? "Đang kết nối" : "Mất kết nối"}</div>
          </div>
        </header>

        <div className="chatbox-body">
          <aside className="chatbox-sidebar" aria-label="Danh sách hội thoại">
            {conversations.length === 0 ? (
              <div className="chatbox-empty">Chưa có cuộc trò chuyện nào.</div>
            ) : (
              <ul className="chatbox-conversations">
                {conversations.map((c) => {
                  const id = c?.id;
                  const name = c?.customer?.name || c?.customer?.email || id;
                  const preview = c?.lastMessageText ? truncate(c.lastMessageText, 50) : "";
                  const unread = Number(c?.unreadCount || 0);

                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className={`chatbox-conversation ${id === activeId ? "is-active" : ""} ${unread > 0 ? "is-unread" : ""}`}
                        onClick={() => onSelectConversation(id)}
                        onContextMenu={(e) => onOpenContextMenu(e, id)}
                        title="Chuột phải để xoá cuộc trò chuyện"
                      >
                        <div className="chatbox-conversation__title">
                          <span className="chatbox-conversation__name">{name}</span>
                          {unread > 0 && <span className="chatbox-conversation__badge">{unread}</span>}
                        </div>
                        <div className="chatbox-conversation__preview">{preview}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="chatbox-thread" aria-label="Tin nhắn">
            {!activeId ? (
              <div className="chatbox-thread__empty">Chọn 1 cuộc trò chuyện để xem tin nhắn.</div>
            ) : (
              <>
                <div ref={listRef} className="chatbox-messages" onScroll={updateAutoScrollState}>
                  {messages.length === 0 ? (
                    <div className="chatbox-empty">Chưa có tin nhắn.</div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`chatbox-message ${m.senderRole === "agent" ? "chatbox-message--me" : "chatbox-message--customer"}`}
                      >
                        <div className="chatbox-bubble">
                          <div className="chatbox-bubble__text">{m.text}</div>
                          <div className="chatbox-bubble__meta">
                            <span>{m.senderName}</span>
                            <span>·</span>
                            <span>{formatTime(m.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="chatbox-composer">
                  <textarea
                    ref={textareaRef}
                    className="admin-textarea chatbox-composer__input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDownComposer}
                    placeholder="Nhập tin nhắn..."
                    rows={1}
                  />

                  <div className="chatbox-composer__actions">
                    <div className="chatbox-emoji" ref={emojiWrapRef}>
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => setEmojiOpen((v) => !v)}
                        aria-label="Chọn emoji"
                        title="Emoji"
                      >
                        <FaRegSmile />
                      </button>
                      {emojiOpen && (
                        <div className="chatbox-emoji__panel" role="dialog" aria-label="Bảng emoji">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="chatbox-emoji__item"
                              onClick={() => onPickEmoji(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button type="button" className="admin-btn admin-btn--primary" onClick={sendMessage}>
                      <FaPaperPlane />
                      Gửi
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {ctxMenu.open && (
          <div
            className="chatbox-context-menu"
            style={{ left: `${ctxMenu.x}px`, top: `${ctxMenu.y}px` }}
            ref={ctxMenuRef}
            role="menu"
            aria-label="Tùy chọn hội thoại"
          >
            <button
              type="button"
              className="chatbox-context-menu__item"
              onClick={() => onRequestDeleteConversation(ctxMenu.conversationId)}
            >
              <FaTrashAlt />
              Xóa cuộc trò chuyện
            </button>
          </div>
        )}

        <ConfirmModal
          open={deleteConfirm.open}
          title="Xóa cuộc trò chuyện"
          message="Bạn có chắc muốn xóa cuộc trò chuyện này không?"
          confirmText="Xác nhận xóa"
          cancelText="Hủy"
          onCancel={() => setDeleteConfirm({ open: false, conversationId: "" })}
          onConfirm={onConfirmDeleteConversation}
          confirmVariant="danger"
        />
      </section>
    </main>
  );
}

export default AdminChat;
