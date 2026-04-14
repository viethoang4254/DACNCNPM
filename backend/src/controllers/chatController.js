import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  getMessagesService,
  getUserConversationsService,
  markConversationReadService,
  replySystemMessageService,
  sendUserMessageService,
  startConversationService,
} from "../services/chatService.js";

export const startConversationController = asyncHandler(async (req, res) => {
  const result = await startConversationService({
    userId: Number(req.user.id),
  });

  return sendResponse(res, result);
});

export const getUserConversationsController = asyncHandler(async (req, res) => {
  const result = await getUserConversationsService({
    actorUserId: Number(req.user.id),
    actorRole: req.user.role,
    userId: Number(req.params.userId),
  });

  return sendResponse(res, result);
});

export const sendMessageController = asyncHandler(async (req, res) => {
  const result = await sendUserMessageService({
    actorUserId: Number(req.user.id),
    actorRole: req.user.role,
    conversationId: Number(req.body.conversationId),
    content: req.body.content ? String(req.body.content).trim() : null,
    messageType: req.body.message_type || "text",
    fileUrl: req.body.file_url || null,
  });

  return sendResponse(res, result);
});

export const replyMessageController = asyncHandler(async (req, res) => {
  const result = await replySystemMessageService({
    actorUserId: Number(req.user.id),
    actorRole: req.user.role,
    conversationId: Number(req.body.conversationId),
    content: req.body.content ? String(req.body.content).trim() : null,
    messageType: req.body.message_type || "text",
    fileUrl: req.body.file_url || null,
  });

  return sendResponse(res, result);
});

export const getMessagesController = asyncHandler(async (req, res) => {
  const parsedLimit = Number(req.query.limit);
  const parsedOffset = Number(req.query.offset);

  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(100, parsedLimit)) : 20;
  const offset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

  const result = await getMessagesService({
    actorUserId: Number(req.user.id),
    actorRole: req.user.role,
    conversationId: Number(req.params.conversationId),
    limit,
    offset,
  });

  return sendResponse(res, result);
});

export const markReadController = asyncHandler(async (req, res) => {
  const result = await markConversationReadService({
    actorUserId: Number(req.user.id),
    actorRole: req.user.role,
    conversationId: Number(req.params.conversationId),
  });

  return sendResponse(res, result);
});
