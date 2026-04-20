import { useEffect, useMemo, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import {
  getUserConversations,
  getConversationMessages,
  sendChatMessage,
  startConversation,
} from "../../../services/chatService";
import { getAuthUser } from "../../../utils/authStorage";
import Chatbox from "../Chatbox";
import "./ChatWidget.scss";

function createMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const WELCOME_MESSAGE = {
  id: "welcome",
  sender: "bot",
  text: "Chào bạn! Mình có thể hỗ trợ tư vấn tour, lịch khởi hành và giá.",
  createdAt: new Date(),
};

function mapApiMessageToChatbox(message) {
  const senderType = String(message?.senderType || "user").toLowerCase();
  const isUser = senderType === "user";

  return {
    id: message?.id ?? createMessageId(),
    sender: isUser ? "user" : "bot",
    text: message?.content || message?.fileUrl || "[No content]",
    createdAt: message?.createdAt || new Date(),
  };
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Không thể gửi tin nhắn. Vui lòng thử lại."
  );
}

function ChatWidget({
  title = "Tư vấn đặt tour",
  status = "online",
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [conversationId, setConversationId] = useState(null);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [messages, setMessages] = useState(() => [WELCOME_MESSAGE]);
  const [isSending, setIsSending] = useState(false);

  const authUser = getAuthUser();

  const toggleLabel = useMemo(
    () => (isOpen ? "Đóng chat" : "Mở chat"),
    [isOpen],
  );

  const applyHistory = (history) => {
    if (!Array.isArray(history) || history.length === 0) {
      setMessages((prev) => {
        if (prev.length === 0) {
          return [WELCOME_MESSAGE];
        }

        const hasPersistedMessages = prev.some((item) => item.id !== WELCOME_MESSAGE.id);
        return hasPersistedMessages ? prev : [WELCOME_MESSAGE];
      });
      return;
    }

    setMessages(history.map(mapApiMessageToChatbox));
  };

  const loadConversationHistory = async (targetConversationId) => {
    if (!targetConversationId || !authUser?.id) return;

    const history = await getConversationMessages(targetConversationId, {
      limit: 100,
      offset: 0,
    });

    applyHistory(history);
  };

  useEffect(() => {
    let active = true;

    async function ensureConversation() {
      if (!isOpen || isConversationLoading) return;
      if (!authUser?.id) return;

      try {
        const userConversations = await getUserConversations(Number(authUser.id));
        if (!active) return;

        if (Array.isArray(userConversations) && userConversations.length > 0) {
          const openConversation = userConversations.find((item) => item.status === "open") || null;
          const latestConversation = openConversation || userConversations[0];
          const resolvedConversationId = Number(latestConversation?.id || 0) || null;

          if (resolvedConversationId) {
            setConversationId(resolvedConversationId);
            await loadConversationHistory(resolvedConversationId);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load user conversations on open:", error);
      }

      if (conversationId) {
        try {
          await loadConversationHistory(conversationId);
        } catch (error) {
          console.error("Failed to load chat history on open:", error);
        }
        return;
      }

      try {
        setIsConversationLoading(true);
        const conversation = await startConversation();
        const resolvedConversationId = Number(conversation?.id || 0) || null;

        if (active && resolvedConversationId) {
          setConversationId(resolvedConversationId);

          try {
            await loadConversationHistory(resolvedConversationId);
          } catch (error) {
            console.error("Failed to load chat history right after startConversation:", error);
          }
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

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (!isOpen || !conversationId || !authUser?.id) return;

      try {
        const history = await getConversationMessages(conversationId, { limit: 100, offset: 0 });
        if (!active) return;

        applyHistory(history);
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [authUser?.id, conversationId, isOpen]);

  useEffect(() => {
    if (!isOpen || !conversationId || !authUser?.id) return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        await loadConversationHistory(conversationId);
      } catch (error) {
        console.error("Failed to refresh chat history:", error);
      }
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [authUser?.id, conversationId, isOpen]);

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

      await loadConversationHistory(resolvedConversationId);
    } catch (error) {
      console.error("Send message failed:", error);

      setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      alert(getErrorMessage(error));
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
