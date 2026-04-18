import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getConversationMessages } from "../services/chatService";

const DEFAULT_POLLING_INTERVAL = 2500;

const normalizeIncomingMessage = (message) => ({
  id: message?.id ?? message?.messageId ?? message?.message_id,
  conversationId: message?.conversationId ?? message?.conversation_id,
  senderType: message?.senderType ?? message?.sender_type,
  senderRole: message?.senderRole ?? message?.sender_role,
  sender: message?.sender ?? (message?.sender_type === "user" ? "user" : message?.sender_role === "admin" ? "admin" : undefined),
  role: message?.role ?? message?.senderRole ?? message?.sender_role,
  content: message?.content ?? message?.message ?? "",
  createdAt: message?.createdAt ?? message?.created_at,
});

const getSocketUrl = () => {
  return import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || window.location.origin;
};

const joinConversationRoom = (socket, conversationId) => {
  if (!socket || !conversationId) return;
  socket.emit("join_conversation", conversationId);
};

// Normalize incoming socket payloads so the UI can use the same message shape.

export default function useChatMessages(conversationId, options = {}) {
  const { enableSocket = true, pollingInterval = DEFAULT_POLLING_INTERVAL } = options;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const mountedRef = useRef(true);

  const refreshMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const list = await getConversationMessages(conversationId);
      if (!mountedRef.current) return;
      setMessages(list);
      setError("");
      return list;
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("[useChatMessages] fetch failed", err);
      setError("Không thể tải tin nhắn.");
      return [];
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [conversationId]);

  const addIncomingMessage = useCallback(
    (message) => {
      if (!message || !conversationId) return;

      const normalized = normalizeIncomingMessage(message);
      if (Number(normalized.conversationId) !== Number(conversationId)) return;

      setMessages((current) => {
        if (current.some((item) => String(item.id) === String(normalized.id))) {
          return current;
        }

        return [...current, normalized];
      });
    },
    [conversationId],
  );

  useEffect(() => {
    mountedRef.current = true;

    // When no conversation is active, keep an empty message list and don't poll.
    if (!conversationId) {
      setMessages([]);
      setError("");
      setLoading(false);
      return undefined;
    }

    refreshMessages();
    const intervalId = window.setInterval(() => {
      refreshMessages();
    }, pollingInterval);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [conversationId, pollingInterval, refreshMessages]);

  useEffect(() => {
    if (!enableSocket || !conversationId) return undefined;

    const url = getSocketUrl();
    const socket = io(url, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    const handleUpdate = (payload) => {
      addIncomingMessage(payload);
    };

    socket.on("connect", () => {
      joinConversationRoom(socket, conversationId);
    });

    socket.on("newMessage", handleUpdate);
    socket.on("user_message", handleUpdate);
    socket.on("system_message", handleUpdate);

    socket.on("connect_error", (err) => {
      console.warn("[useChatMessages] socket connect error", err);
    });

    return () => {
      socket.off("connect");
      socket.off("newMessage", handleUpdate);
      socket.off("user_message", handleUpdate);
      socket.off("system_message", handleUpdate);
      socket.disconnect();
    };
  }, [conversationId, enableSocket, addIncomingMessage]);

  // Expose a setter so parent components can update messages optimistically.

  return {
    messages,
    loading,
    error,
    refreshMessages,
    setMessages,
  };
}
