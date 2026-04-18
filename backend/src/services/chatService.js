import {
  countMessagesByConversationId,
  createConversation,
  createMessage,
  getAllConversations,
  findOpenConversationByUserId,
  getConversationById,
  getConversationsByUserId,
  getMessagesByConversationId,
  markConversationMessagesAsRead,
} from "../models/chatModel.js";
import { getUserById } from "../models/userModel.js";
import { emitToConversation, emitToUser } from "../socket/index.js";

const buildMessagePayload = (message) => ({
  id: message.id,
  conversation_id: message.conversation_id,
  sender_type: message.sender_type,
  sender_id: message.sender_id,
  sender_name: message.sender_name,
  sender_role: message.sender_role,
  content: message.content,
  message_type: message.message_type,
  file_url: message.file_url,
  is_read: message.is_read,
  created_at: message.created_at,
});

const canAccessConversation = ({ actorRole, actorUserId, conversationOwnerId }) => {
  return actorRole === "admin" || actorUserId === conversationOwnerId;
};

export const startConversationService = async ({ userId }) => {
  const existing = await findOpenConversationByUserId(userId);
  if (existing) {
    return {
      statusCode: 200,
      success: true,
      message: "Current open conversation fetched successfully",
      data: existing,
    };
  }

  const created = await createConversation({ userId });

  return {
    statusCode: 201,
    success: true,
    message: "Conversation started successfully",
    data: created,
  };
};

export const getUserConversationsService = async ({ actorUserId, actorRole, userId }) => {
  if (actorRole !== "admin" && actorUserId !== userId) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  const conversations = await getConversationsByUserId(userId);

  return {
    statusCode: 200,
    success: true,
    message: "Conversations fetched successfully",
    data: conversations,
  };
};

export const getAllConversationsService = async ({ actorRole }) => {
  if (actorRole !== "admin") {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  const conversations = await getAllConversations();

  return {
    statusCode: 200,
    success: true,
    message: "Conversations fetched successfully",
    data: conversations,
  };
};

export const sendUserMessageService = async ({
  actorUserId,
  actorRole,
  conversationId,
  content,
  messageType,
  fileUrl,
}) => {
  if (actorRole !== "customer") {
    return {
      statusCode: 403,
      success: false,
      message: "Only customers can use this endpoint",
      data: {},
    };
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return {
      statusCode: 404,
      success: false,
      message: "Conversation not found",
      data: {},
    };
  }

  if (conversation.user_id !== actorUserId) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  if (conversation.status !== "open") {
    return {
      statusCode: 400,
      success: false,
      message: "Conversation is closed",
      data: {},
    };
  }

  const message = await createMessage({
    conversationId,
    senderType: "user",
    senderId: actorUserId,
    content,
    messageType,
    fileUrl,
  });

  const payload = buildMessagePayload(message);
  emitToConversation("user_message", conversationId, payload);
  emitToUser("user_message", conversation.user_id, payload);

  return {
    statusCode: 201,
    success: true,
    message: "Message sent successfully",
    data: payload,
  };
};

export const sendMessageService = async ({
  actorUserId,
  actorRole,
  conversationId,
  senderId,
  message,
}) => {
  const actorId = Number(actorUserId);
  const conversationIdNumber = Number(conversationId);

  if (!Number.isFinite(actorId) || actorId <= 0) {
    return {
      statusCode: 401,
      success: false,
      message: "Invalid authentication payload",
      data: {},
    };
  }

  if (!Number.isFinite(conversationIdNumber) || conversationIdNumber <= 0) {
    return {
      statusCode: 400,
      success: false,
      message: "conversationId must be a positive integer",
      data: {},
    };
  }

  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedMessage) {
    return {
      statusCode: 400,
      success: false,
      message: "message cannot be empty",
      data: {},
    };
  }

  // Sender identity is always derived from authenticated token.
  const normalizedSenderId = actorId;

  const sender = await getUserById(normalizedSenderId);
  if (!sender) {
    return {
      statusCode: 404,
      success: false,
      message: "senderId not found",
      data: {},
    };
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return {
      statusCode: 404,
      success: false,
      message: "conversationId not found",
      data: {},
    };
  }

  if (actorRole !== "admin" && conversation.user_id !== normalizedSenderId) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  if (conversation.status !== "open") {
    return {
      statusCode: 400,
      success: false,
      message: "Conversation is closed",
      data: {},
    };
  }

  const senderType = actorRole === "admin" ? "system" : "user";

  const createdMessage = await createMessage({
    conversationId: conversationIdNumber,
    senderType,
    senderId: normalizedSenderId,
    content: trimmedMessage,
    messageType: "text",
    fileUrl: null,
  });

  if (!createdMessage) {
    return {
      statusCode: 500,
      success: false,
      message: "Failed to send message",
      data: {},
    };
  }

  const socketPayload = buildMessagePayload(createdMessage);
  const socketEvent = senderType === "system" ? "system_message" : "user_message";

  emitToConversation(socketEvent, conversationIdNumber, socketPayload);
  emitToUser(socketEvent, conversation.user_id, socketPayload);

  return {
    statusCode: 201,
    success: true,
    message: "Message sent successfully",
    data: {
      ...socketPayload,
      conversationId: createdMessage.conversation_id,
      senderId: createdMessage.sender_id,
      message: createdMessage.content || "",
      createdAt: createdMessage.created_at,
    },
  };
};

export const replySystemMessageService = async ({
  actorUserId,
  actorRole,
  conversationId,
  content,
  messageType,
  fileUrl,
}) => {
  if (actorRole !== "admin") {
    return {
      statusCode: 403,
      success: false,
      message: "Only admin can reply from system",
      data: {},
    };
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return {
      statusCode: 404,
      success: false,
      message: "Conversation not found",
      data: {},
    };
  }

  const message = await createMessage({
    conversationId,
    senderType: "system",
    senderId: actorUserId,
    content,
    messageType,
    fileUrl,
  });

  const payload = buildMessagePayload(message);
  emitToConversation("system_message", conversationId, payload);
  emitToUser("system_message", conversation.user_id, payload);

  return {
    statusCode: 201,
    success: true,
    message: "Reply sent successfully",
    data: payload,
  };
};

export const getMessagesService = async ({
  actorUserId,
  actorRole,
  conversationId,
  limit,
  offset,
}) => {
  const conversationIdNumber = Number(conversationId);
  const safeLimit = Number.isFinite(Number(limit))
    ? Math.max(1, Math.min(100, Math.trunc(Number(limit))))
    : 20;
  const safeOffset = Number.isFinite(Number(offset))
    ? Math.max(0, Math.trunc(Number(offset)))
    : 0;

  if (!Number.isFinite(conversationIdNumber) || conversationIdNumber <= 0) {
    return {
      statusCode: 400,
      success: false,
      message: "conversationId must be a positive integer",
      data: {},
    };
  }

  const conversation = await getConversationById(conversationIdNumber);
  if (!conversation) {
    return {
      statusCode: 404,
      success: false,
      message: "Conversation not found",
      data: {},
    };
  }

  if (!canAccessConversation({ actorRole, actorUserId, conversationOwnerId: conversation.user_id })) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  const messages = await getMessagesByConversationId({
    conversationId: conversationIdNumber,
    limit: safeLimit,
    offset: safeOffset,
  });
  const total = await countMessagesByConversationId(conversationIdNumber);

  return {
    statusCode: 200,
    success: true,
    message: "Messages fetched successfully",
    data: messages,
    pagination: {
      limit: safeLimit,
      offset: safeOffset,
      total,
      has_more: safeOffset + messages.length < total,
    },
  };
};

export const markConversationReadService = async ({ actorUserId, actorRole, conversationId }) => {
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return {
      statusCode: 404,
      success: false,
      message: "Conversation not found",
      data: {},
    };
  }

  if (!canAccessConversation({ actorRole, actorUserId, conversationOwnerId: conversation.user_id })) {
    return {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    };
  }

  const excludeSenderType = actorRole === "admin" ? "system" : "user";
  const updatedCount = await markConversationMessagesAsRead({
    conversationId,
    excludeSenderType,
  });

  const payload = {
    conversation_id: conversationId,
    reader_id: actorUserId,
    updated_count: updatedCount,
    read_at: new Date().toISOString(),
  };

  emitToConversation("message_read", conversationId, payload);
  emitToUser("message_read", conversation.user_id, payload);

  return {
    statusCode: 200,
    success: true,
    message: "Messages marked as read",
    data: payload,
  };
};
