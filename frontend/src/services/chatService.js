import apiClient from "../utils/apiClient";

export const startConversation = async () => {
  const response = await apiClient.post("/api/chat/start");
  return response?.data?.data || null;
};

export const sendChatMessage = async ({ conversationId, senderId, message }) => {
  const payload = {
    conversationId,
    senderId,
    message,
    content: message,
  };

  const response = await apiClient.post("/api/chat/send", payload);
  const raw = response?.data?.data || null;

  if (!raw) return null;

  // Keep backward-compatible shape for existing ChatWidget.
  return {
    ...raw,
    message: raw.message || raw.content || message,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
};

const normalizeConversation = (conversation) => ({
  id: conversation?.id ?? conversation?.conversationId ?? conversation?.conversation_id,
  userId: conversation?.userId ?? conversation?.user_id ?? null,
  userName:
    conversation?.userName ??
    conversation?.user_name ??
    conversation?.customerName ??
    conversation?.customer_name ??
    conversation?.ho_ten ??
    "Khach hang",
  lastMessage:
    conversation?.lastMessage ??
    conversation?.last_message ??
    conversation?.previewMessage ??
    conversation?.message ??
    conversation?.content ??
    "",
  createdAt: conversation?.createdAt ?? conversation?.created_at ?? conversation?.updatedAt ?? null,
  status: conversation?.status ?? "open",
  unreadCount: Number(conversation?.unreadCount ?? conversation?.unread_count ?? 0),
});

const normalizeMessage = (message) => ({
  id: message?.id ?? message?.messageId ?? message?.message_id,
  conversationId: message?.conversationId ?? message?.conversation_id,
  senderType:
    message?.senderType ??
    message?.sender_type ??
    (message?.sender_role === "admin" ? "system" : "user"),
  senderId: message?.senderId ?? message?.sender_id ?? null,
  senderName:
    message?.senderName ??
    message?.sender_name ??
    (message?.sender_role === "admin" ? "Admin" : "User"),
  senderRole: message?.senderRole ?? message?.sender_role ?? null,
  content: message?.content ?? message?.message ?? "",
  messageType: message?.messageType ?? message?.message_type ?? "text",
  fileUrl: message?.fileUrl ?? message?.file_url ?? null,
  isRead: Boolean(message?.isRead ?? message?.is_read ?? false),
  createdAt: message?.createdAt ?? message?.created_at ?? null,
});

const extractList = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

export const getAdminConversations = async () => {
  const response = await apiClient.get("/api/chat/conversations");
  return extractList(response.data).map(normalizeConversation);
};

export const getConversationMessages = async (conversationId) => {
  const response = await apiClient.get(`/api/chat/messages/${conversationId}`);
  return extractList(response.data).map(normalizeMessage);
};

export const sendAdminChatMessage = async ({ conversationId, senderId, message }) => {
  const payload = {
    conversationId,
    senderId,
    message,
    content: message,
  };

  try {
    const response = await apiClient.post("/api/chat/send", payload);
    return normalizeMessage(
      response.data?.data || {
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: "system",
        content: message,
        message_type: "text",
        is_read: false,
        created_at: new Date().toISOString(),
      }
    );
  } catch {
    const fallback = await apiClient.post("/api/chat/reply", {
      conversationId,
      content: message,
      message,
      senderId,
    });

    return normalizeMessage(
      fallback.data?.data || {
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: "system",
        content: message,
        message_type: "text",
        is_read: false,
        created_at: new Date().toISOString(),
      }
    );
  }
};

export const formatChatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
