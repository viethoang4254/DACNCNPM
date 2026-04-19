import { useEffect, useMemo, useRef, useState } from "react";
import { FaPaperPlane, FaSpinner, FaComments, FaUser, FaRobot } from "react-icons/fa";
import { getAuthUser } from "../../utils/authStorage";
import useChatMessages from "../../hooks/useChatMessages";
import {
  formatChatDateTime,
  getAdminConversations,

  getConversationMessages,
  markConversationRead,

  sendAdminChatMessage,
} from "../../services/chatService";
import "./AdminChat.scss";

function ConversationList({ conversations, selectedConversationId, onSelect }) {
  return (
    <div className="admin-chat__sidebar-list">
      {conversations.length === 0 ? (
        <div className="admin-chat__empty-state">Chưa có cuộc hội thoại nào.</div>
      ) : (
        conversations.map((conversation) => {
          const isActive = conversation.id === selectedConversationId;

          return (
            <button
              key={conversation.id}
              type="button"
              className={`admin-chat__conversation ${isActive ? "is-active" : ""}`}
              onClick={() => onSelect(conversation)}
            >
              <div className="admin-chat__conversation-avatar">
                <FaUser />
              </div>
              <div className="admin-chat__conversation-body">
                <div className="admin-chat__conversation-row">
                  <strong>{conversation.userName}</strong>
                  <span>{formatChatDateTime(conversation.createdAt)}</span>
                </div>
                <p>{conversation.lastMessage || "Chưa có tin nhắn"}</p>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

function MessageList({ messages, loading, selectedConversation }) {
  if (loading) {
    return (
      <div className="admin-chat__messages-loading">
        <FaSpinner className="admin-chat__spinner" />
        <span>Đang tải tin nhắn...</span>
      </div>
    );
  }

  if (!selectedConversation) {
    return <div className="admin-chat__empty-chat">Chọn một cuộc hội thoại để xem nội dung chat.</div>;
  }

  if (messages.length === 0) {
    return <div className="admin-chat__empty-chat">Chưa có tin nhắn trong cuộc hội thoại này.</div>;
  }

  return (
    <div className="admin-chat__messages-list">
      {messages.map((message) => {
        const isAdmin = message.senderType === "system" || message.senderRole === "admin";

        return (
          <div
            key={message.id}
            className={`admin-chat__message-row ${isAdmin ? "is-admin" : "is-user"}`}
          >
            <div className="admin-chat__message-meta">
              <span className="admin-chat__message-author">
                {isAdmin ? <FaRobot /> : <FaUser />}
                {isAdmin ? "Admin" : selectedConversation.userName}
              </span>
              <span className="admin-chat__message-time">
                {formatChatDateTime(message.createdAt)}
              </span>
            </div>
            <div className={`admin-chat__message-bubble ${isAdmin ? "is-admin" : "is-user"}`}>
              {message.content || message.fileUrl || "[No content]"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminChat() {
  const authUser = getAuthUser();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const {
    messages,
    loading: loadingMessages,
    error: messagesError,
    setMessages,
  } = useChatMessages(selectedConversationId, { enableSocket: true, pollingInterval: 2500 });

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      setError("");
      const data = await getAdminConversations();
      setConversations(data);

      if (data.length > 0) {
        setSelectedConversationId((currentId) =>
          data.some((conversation) => conversation.id === currentId)
            ? currentId
            : data[0].id,
        );
      } else {
        setSelectedConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("[AdminChat] Failed to load conversations:", err);
      setError("Không thể tải danh sách hội thoại.");
      setConversations([]);
      setSelectedConversationId(null);
      setMessages([]);
    } finally {
      setLoadingConversations(false);
    }
  };


  const loadMessages = async (conversationId) => {
    if (!conversationId) return;

    try {
      setLoadingMessages(true);
      setError("");
      const data = await getConversationMessages(conversationId);
      setMessages(data);

      await markConversationRead(conversationId);
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    } catch (err) {
      console.error("[AdminChat] Failed to load messages:", err);
      setMessages([]);
      setError("Không thể tải lịch sử chat.");
    } finally {
      setLoadingMessages(false);
    }
  };


  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {

    if (!selectedConversationId) return;
    loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        const data = await getConversationMessages(selectedConversationId);
        setMessages(data);
      } catch {
        // Ignore transient polling errors; manual actions still surface errors.
      }
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [selectedConversationId]);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const data = await getAdminConversations();
        setConversations(data);
      } catch {
        // Ignore transient polling errors; explicit refresh still reports errors.
      }
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {

    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleResize = () => scrollToBottom();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectConversation = (conversation) => {
    if (!conversation?.id) return;
    setSelectedConversationId(conversation.id);
  };

  const handleSendMessage = async () => {
    const content = draft.trim();
    if (!content || !selectedConversation) return;

    try {
      setSending(true);
      setError("");
      const sentMessage = await sendAdminChatMessage({
        conversationId: selectedConversation.id,
        senderId: authUser?.id,
        message: content,
      });

      setMessages((currentMessages) => [...currentMessages, sentMessage]);
      setDraft("");
      setConversations((currentConversations) => {
        const updated = currentConversations.map((conversation) =>
          conversation.id === selectedConversation.id
            ? {
                ...conversation,
                lastMessage: content,
                createdAt: sentMessage.createdAt || new Date().toISOString(),
              }
            : conversation,
        );

        return [
          updated.find((conversation) => conversation.id === selectedConversation.id),
          ...updated.filter((conversation) => conversation.id !== selectedConversation.id),
        ].filter(Boolean);
      });
    } catch (err) {
      console.error("[AdminChat] Failed to send message:", err);
      setError("Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sending && draft.trim()) {
        handleSendMessage();
      }
    }
  };

  return (
    <section className="admin-chat-page admin-card">
      <header className="admin-chat__header">
        <div>
          <h2>Support Chat</h2>
          <p>Quản lý hội thoại giữa khách hàng và hệ thống.</p>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={loadConversations} disabled={loadingConversations}>
          {loadingConversations ? <FaSpinner className="admin-chat__spinner" /> : <FaComments />}
          Làm mới
        </button>
      </header>

      {error || messagesError ? (
        <p className="admin-state admin-state--error">{error || messagesError}</p>
      ) : null}

      <div className="admin-chat__layout">
        <aside className="admin-chat__sidebar">
          <div className="admin-chat__sidebar-head">
            <h3>Cuộc hội thoại</h3>
            <span>{conversations.length}</span>
          </div>
          {loadingConversations ? (
            <div className="admin-chat__messages-loading admin-chat__messages-loading--sidebar">
              <FaSpinner className="admin-chat__spinner" />
              <span>Đang tải conversations...</span>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelect={handleSelectConversation}
            />
          )}
        </aside>

        <main className="admin-chat__panel">
          <div className="admin-chat__panel-head">
            <div>
              <h3>{selectedConversation ? selectedConversation.userName : "Chưa chọn hội thoại"}</h3>
              <p>
                {selectedConversation
                  ? `Conversation #${selectedConversation.id} · ${selectedConversation.status}`
                  : "Chọn một cuộc hội thoại ở sidebar để xem lịch sử chat."}
              </p>
            </div>
          </div>

          <div className="admin-chat__messages">
            <MessageList
              messages={messages}
              loading={loadingMessages}
              selectedConversation={selectedConversation}
            />
            <div ref={messagesEndRef} />
          </div>

          <footer className="admin-chat__composer">
            <textarea
              className="admin-chat__input"
              placeholder="Nhập tin nhắn trả lời..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              disabled={!selectedConversation || sending}
            />
            <button
              type="button"
              className="admin-btn admin-btn--primary admin-chat__send-btn"
              onClick={handleSendMessage}
              disabled={!selectedConversation || sending || !draft.trim()}
            >
              {sending ? <FaSpinner className="admin-chat__spinner" /> : <FaPaperPlane />}
              Gửi
            </button>
          </footer>
        </main>
      </div>
    </section>
  );
}

export default AdminChat;
