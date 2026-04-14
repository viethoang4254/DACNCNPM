import apiClient from "../utils/apiClient";

export const startConversation = async () => {
  const response = await apiClient.post("/api/chat/start");
  return response?.data?.data || null;
};

export const sendChatMessage = async ({ conversationId, senderId, message }) => {
  const response = await apiClient.post("/api/chat/send", {
    conversationId,
    senderId,
    message,
  });

  return response?.data?.data || null;
};
