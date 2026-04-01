import { useEffect, useRef, useState } from "react";
import { FaComments, FaPaperPlane, FaRegSmile, FaTimes } from "react-icons/fa";
import { io } from "socket.io-client";
import { getAuthToken, getAuthUser } from "../../../utils/authStorage";
import "./ChatWidget.scss";

const EMOJIS = ["😀", "😅", "😍", "🥰", "😂", "👍", "🙏", "❤️", "🎉", "🤝"];

const insertAtCursor = ({ textarea, value, insertText }) => {
  if (!textarea) return value + insertText;

  const start = typeof textarea.selectionStart === "number" ? textarea.selectionStart : value.length;
  const end = typeof textarea.selectionEnd === "number" ? textarea.selectionEnd : value.length;
  return value.slice(0, start) + insertText + value.slice(end);
};

const STORAGE_KEY = "chat_conversation_id";

const getOrCreateConversationId = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(STORAGE_KEY, id);
  return id;
};

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

function ChatWidget({ apiBaseUrl }) {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [authSnapshot, setAuthSnapshot] = useState(() => {
    const user = getAuthUser();
    return {
      token: getAuthToken(),
      userId: user?.id || null,
      name: user?.ho_ten || "",
      email: user?.email || "",
    };
  });

  const conversationIdRef = useRef("");
  const socketRef = useRef(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiWrapRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const resolvedBaseUrl = apiBaseUrl || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    if (open) shouldAutoScrollRef.current = true;
  }, [open]);

  useEffect(() => {
    const onAuthChanged = () => {
      const user = getAuthUser();
      setAuthSnapshot({
        token: getAuthToken(),
        userId: user?.id || null,
        name: user?.ho_ten || "",
        email: user?.email || "",
      });
    };

    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, []);

  useEffect(() => {
    if (!open) return;

    const resolvedConversationId = authSnapshot.userId ? `user:${authSnapshot.userId}` : getOrCreateConversationId();
    conversationIdRef.current = resolvedConversationId;

    const socket = io(resolvedBaseUrl, {
      autoConnect: true,
      transports: ["websocket"],
      auth: authSnapshot.token ? { token: authSnapshot.token } : undefined,
    });

    socketRef.current = socket;

    const customer = authSnapshot.userId
      ? { id: authSnapshot.userId, name: authSnapshot.name, email: authSnapshot.email }
      : {};

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("customer:join", { conversationId: resolvedConversationId, customer }, (resp) => {
        const respId = String(resp?.conversationId || "").trim();
        if (!respId || respId !== conversationIdRef.current) return;
        if (Array.isArray(resp?.messages)) {
          setMessages(resp.messages);
        }
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("conversation:history", (payload) => {
      if (payload?.conversationId !== conversationIdRef.current) return;
      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
    });

    socket.on("message:new", (message) => {
      if (message?.conversationId !== conversationIdRef.current) return;
      setMessages((prev) => [...prev, message]);
    });

    socket.on("conversation:deleted", (payload) => {
      if (payload?.conversationId !== conversationIdRef.current) return;
      setMessages([]);
    });

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setEmojiOpen(false);
      setMessages([]);
    };
  }, [open, resolvedBaseUrl, authSnapshot.token, authSnapshot.userId]);

  useEffect(() => {
    if (!emojiOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setEmojiOpen(false);
    };

    const onPointerDown = (e) => {
      const wrap = emojiWrapRef.current;
      if (!wrap) return;
      if (wrap.contains(e.target)) return;
      setEmojiOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [emojiOpen]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    if (!shouldAutoScrollRef.current) return;
    list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  const updateAutoScrollState = () => {
    const list = listRef.current;
    if (!list) return;
    const thresholdPx = 24;
    const distanceFromBottom = list.scrollHeight - (list.scrollTop + list.clientHeight);
    shouldAutoScrollRef.current = distanceFromBottom <= thresholdPx;
  };

  const sendMessage = () => {
    const normalized = text.trim();
    if (!normalized) return;

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("customer:message", {
      conversationId: conversationIdRef.current,
      text: normalized,
      senderName: getAuthUser()?.ho_ten || "",
    });

    setText("");
    setEmojiOpen(false);
    shouldAutoScrollRef.current = true;
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

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <section className="chat-widget__panel" aria-label="Chatbox">
          <header className="chat-widget__header">
            <div>
              <h4>Chat hỗ trợ</h4>
              <p>{connected ? "Đang kết nối" : "Mất kết nối"}</p>
            </div>
            <button type="button" className="chat-widget__icon-btn" onClick={() => setOpen(false)} aria-label="Đóng chat">
              <FaTimes />
            </button>
          </header>

          <div ref={listRef} className="chat-widget__messages" onScroll={updateAutoScrollState}>
            {messages.length === 0 ? (
              <div className="chat-widget__empty">Bạn cần hỗ trợ gì? Hãy nhắn tin ở đây.</div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-widget__message ${m.senderRole === "customer" ? "chat-widget__message--me" : "chat-widget__message--agent"}`}
                >
                  <div className="chat-widget__bubble">
                    <div className="chat-widget__bubble-text">{m.text}</div>
                    <div className="chat-widget__bubble-meta">
                      <span>{m.senderName}</span>
                      <span>·</span>
                      <span>{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="chat-widget__composer">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
            />
            <div className="chat-widget__emoji" ref={emojiWrapRef}>
              <button
                type="button"
                className="chat-widget__emoji-btn"
                onClick={() => setEmojiOpen((v) => !v)}
                aria-label="Chọn emoji"
              >
                <FaRegSmile />
              </button>
              {emojiOpen && (
                <div className="chat-widget__emoji-panel" role="dialog" aria-label="Bảng emoji">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="chat-widget__emoji-item"
                      onClick={() => onPickEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={sendMessage} className="chat-widget__send" aria-label="Gửi tin nhắn">
              <FaPaperPlane />
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        className="chat-widget__fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng chat" : "Mở chat"}
      >
        <FaComments />
      </button>
    </div>
  );
}

export default ChatWidget;
