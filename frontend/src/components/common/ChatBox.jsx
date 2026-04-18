import { useEffect, useMemo, useState } from "react";
import { getAuthUser } from "../../../utils/authStorage";
import { sendChatMessage, startConversation } from "../../../services/chatService";
import useChatMessages from "../../../hooks/useChatMessages";
import Chatbox from "../Chatbox";

function createMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function ChatBox({ title = "Tư vấn đặt tour", status = "online" }) {
  const authUser = useMemo(() => getAuthUser(), []);
  const [conversationId, setConversationId] = useState(null);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [welcomeMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "Chào bạn! Mình có thể hỗ trợ tư vấn tour, lịch khởi hành và giá.",
      createdAt: new Date(),
    },
  ]);

  const { messages, setMessages, loading: loadingMessages } = useChatMessages(conversationId, {
    enableSocket: true,
    pollingInterval: 2500,
  });

  const chatMessages = conversationId ? messages : welcomeMessages;

  useEffect(() => {
    let active = true;

    async function ensureConversation() {
      if (!authUser?.id || conversationId || isConversationLoading) return;

      try {
        setIsConversationLoading(true);
        const conversation = await startConversation();

        if (!active) return;
        if (conversation?.id) {
          setConversationId(Number(conversation.id));
        }
      } catch (sendError) {
        console.error("[ChatBox] failed to start conversation", sendError);
        if (active) {
          setError("Không thể bắt đầu cuộc hội thoại.");
        }
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
  }, [authUser?.id, conversationId, isConversationLoading]);

  // When conversation is ready, hook will keep messages refreshed by polling and socket events.

  const handleSendMessage = async (text) => {
    const trimmedText = String(text || "").trim();
    if (!trimmedText) return;

    if (!authUser?.id) {
      alert("Vui lòng đăng nhập để gửi tin nhắn.");
      return;
    }

    let resolvedConversationId = conversationId;
    setError("");

    if (!resolvedConversationId) {
      setIsConversationLoading(true);
      try {
        const conversation = await startConversation();
        resolvedConversationId = Number(conversation?.id || 0) || null;
        if (resolvedConversationId) {
          setConversationId(resolvedConversationId);
        }
      } catch (startError) {
        console.error("[ChatBox] start conversation failed", startError);
        setError("Không thể mở cuộc hội thoại.");
      } finally {
        setIsConversationLoading(false);
      }
    }

    if (!resolvedConversationId) return;

    const optimisticId = `optimistic-${createMessageId()}`;
    const optimisticMessage = {
      id: optimisticId,
      sender: "user",
      text: trimmedText,
      createdAt: new Date(),
    };

    // Optimistic update: show the outgoing message immediately.
    setMessages((current) => [...current, optimisticMessage]);
    setIsSending(true);

    try {
      const savedMessage = await sendChatMessage({
        conversationId: resolvedConversationId,
        senderId: Number(authUser.id),
        message: trimmedText,
      });

      setMessages((current) =>
        current.map((item) => {
          if (item.id !== optimisticId) return item;

          return {
            id: savedMessage?.id || optimisticId,
            sender: "user",
            text: savedMessage?.message ?? trimmedText,
            createdAt: savedMessage?.createdAt ?? new Date(),
          };
        }),
      );
    } catch (sendError) {
      console.error("[ChatBox] send message failed", sendError);
      setMessages((current) => current.filter((item) => item.id !== optimisticId));
      setError("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      {error ? (
        <p className="chatbox-error" role="alert">
          {error}
        </p>
      ) : null}
      <Chatbox
        title={title}
        status={status}
        messages={chatMessages}
        isTyping={isConversationLoading || loadingMessages}
        isSending={isSending}
        onSend={handleSendMessage}
        placeholder="Nhập tin nhắn…"
      />
    </div>
  );
}

export default ChatBox;
