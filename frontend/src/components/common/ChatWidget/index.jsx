import { useEffect, useMemo, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import {
  sendChatMessage,
  startConversation,
} from "../../../services/chatService";
import { getAuthUser } from "../../../utils/authStorage";
import Chatbox from "../Chatbox";
import "./ChatWidget.scss";

function createMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function ChatWidget({
  title = "Tư vấn đặt tour",
  status = "online",
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [conversationId, setConversationId] = useState(null);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      sender: "bot",
      text: "Chào bạn! Mình có thể hỗ trợ tư vấn tour, lịch khởi hành và giá.",
      createdAt: new Date(),
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  const authUser = useMemo(() => getAuthUser(), []);

  const toggleLabel = useMemo(
    () => (isOpen ? "Đóng chat" : "Mở chat"),
    [isOpen],
  );

  useEffect(() => {
    let active = true;

    async function ensureConversation() {
      if (!isOpen || conversationId || isConversationLoading) return;
      if (!authUser?.id) return;

      try {
        setIsConversationLoading(true);
        const conversation = await startConversation();

        if (active && conversation?.id) {
          setConversationId(Number(conversation.id));
        }
      } catch (error) {
        console.error("Failed to start conversation:", error);
      } finally {
        if (active) {
          setIsConversationLoading(false);
        }
      }
    }

    ensureConversation();

    return () => {
      active = false;
    };
  }, [authUser?.id, conversationId, isConversationLoading, isOpen]);

  const handleSendMessage = async (text) => {
    const trimmedText = String(text || "").trim();

    // Guard empty payload to avoid unnecessary API calls.
    if (!trimmedText) return;

    if (!authUser?.id) {
      alert("Vui lòng đăng nhập để gửi tin nhắn.");
      return;
    }

    const optimisticId = `optimistic-${createMessageId()}`;
    const optimisticMessage = {
      id: optimisticId,
      sender: "user",
      text: trimmedText,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setIsSending(true);

    try {
      let resolvedConversationId = conversationId;

      if (!resolvedConversationId) {
        const conversation = await startConversation();
        resolvedConversationId = Number(conversation?.id || 0) || null;

        if (resolvedConversationId) {
          setConversationId(resolvedConversationId);
        }
      }

      if (!resolvedConversationId) {
        throw new Error("Conversation is not available");
      }

      const savedMessage = await sendChatMessage({
        conversationId: resolvedConversationId,
        senderId: Number(authUser.id),
        message: trimmedText,
      });

      setMessages((prev) =>
        prev.map((item) => {
          if (item.id !== optimisticId) return item;

          return {
            id: savedMessage?.id || optimisticId,
            sender: "user",
            text: savedMessage?.message || trimmedText,
            createdAt: savedMessage?.createdAt || new Date(),
          };
        }),
      );
    } catch (error) {
      console.error("Send message failed:", error);

      setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  const onAttach = (file) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        sender: "bot",
        text: `Đã đính kèm: ${file.name}`,
        createdAt: new Date(),
      },
    ]);
  };

  return (
    <div className="chat-widget" data-open={isOpen ? "true" : "false"}>
      <div
        className="chat-widget__panel"
        aria-hidden={isOpen ? "false" : "true"}
      >
        {isOpen && (
          <Chatbox
            title={title}
            status={status}
            messages={messages}
            isTyping={false}
            isSending={isSending}
            onSend={handleSendMessage}
            onAttach={onAttach}
          />
        )}
      </div>

      <button
        type="button"
        className="chat-widget__toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={toggleLabel}
      >
        {isOpen ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  );
}

export default ChatWidget;
