import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  getAllConversationsService,
  getMessagesService,
  getUserConversationsService,
  markConversationReadService,
  replySystemMessageService,
  sendMessageService,
  startConversationService,
} from "../services/chatService.js";

const CHAT_DEBUG_ENABLED = process.env.CHAT_DEBUG === "1";

const logChatDebug = (...args) => {
  if (CHAT_DEBUG_ENABLED) {
    console.log("[chat-debug]", ...args);
  }
};

const getActorUserId = (user) => {
  const parsed = Number(user?.id ?? user?.userId ?? user?.user_id);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const startConversationController = asyncHandler(async (req, res) => {
  const actorUserId = getActorUserId(req.user);
  if (!actorUserId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Invalid authentication payload",
      data: {},
    });
  }

  const result = await startConversationService({
    userId: actorUserId,
  });

  return sendResponse(res, result);
});

export const getUserConversationsController = asyncHandler(async (req, res) => {
  const actorUserId = getActorUserId(req.user);
  if (!actorUserId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Invalid authentication payload",
      data: {},
    });
  }

  const result = await getUserConversationsService({
    actorUserId,
    actorRole: req.user.role,
    userId: Number(req.params.userId),
  });

  return sendResponse(res, result);
});

export const getAllConversationsController = asyncHandler(async (req, res) => {
  const result = await getAllConversationsService({
    actorRole: req.user.role,
  });

  return sendResponse(res, result);
});

export const sendMessageController = asyncHandler(async (req, res) => {
  const actorUserId = getActorUserId(req.user);
  if (!actorUserId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Invalid authentication payload",
      data: {},
    });
  }

  const parsedSenderId = Number(req.body.senderId);

  const result = await sendMessageService({
    actorUserId,
    actorRole: req.user.role,
    conversationId: Number(req.body.conversationId),
    senderId: Number.isFinite(parsedSenderId) && parsedSenderId > 0
      ? parsedSenderId
      : actorUserId,
    message: String(req.body.message || "").trim(),
  });

  return sendResponse(res, result);
});

export const replyMessageController = asyncHandler(async (req, res) => {
  const actorUserId = getActorUserId(req.user);
  if (!actorUserId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Invalid authentication payload",
      data: {},
    });
  }

  const result = await replySystemMessageService({
    actorUserId,
    actorRole: req.user.role,
    conversationId: Number(req.body.conversationId),
    content: req.body.content ? String(req.body.content).trim() : null,
    messageType: req.body.message_type || "text",
    fileUrl: req.body.file_url || null,
  });

  return sendResponse(res, result);
});

export const getMessagesController = asyncHandler(async (req, res) => {
  const actorUserId = getActorUserId(req.user);
  logChatDebug("getMessagesController.input", {
    actorUserId,
    actorRole: req.user?.role,
    rawConversationId: req.params?.conversationId,
    rawLimit: req.query?.limit,
    rawOffset: req.query?.offset,
  });

  if (!actorUserId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Invalid authentication payload",
      data: {},
    });
  }

  const parsedLimit = Number(req.query.limit);
  const parsedOffset = Number(req.query.offset);

  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(100, parsedLimit)) : 20;
  const offset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

  const result = await getMessagesService({
    actorUserId,
    actorRole: req.user.role,
    conversationId: Number(req.params.conversationId),
    limit,
    offset,
  });

  return sendResponse(res, result);
});

export const markReadController = asyncHandler(async (req, res) => {
  const actorUserId = getActorUserId(req.user);
  if (!actorUserId) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Invalid authentication payload",
      data: {},
    });
  }

  const result = await markConversationReadService({
    actorUserId,
    actorRole: req.user.role,
    conversationId: Number(req.params.conversationId),
  });

  return sendResponse(res, result);
});
