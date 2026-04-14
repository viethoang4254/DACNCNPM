import express from "express";
import { body, param, query } from "express-validator";
import {
  getMessagesController,
  getUserConversationsController,
  markReadController,
  replyMessageController,
  sendMessageController,
  startConversationController,
} from "../controllers/chatController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

const commonMessageValidation = [
  body("conversationId")
    .isInt({ gt: 0 })
    .withMessage("conversationId must be a positive integer"),
  body("content")
    .optional({ nullable: true })
    .isString()
    .withMessage("content must be a string")
    .isLength({ max: 5000 })
    .withMessage("content must be at most 5000 characters"),
  body("message_type")
    .optional()
    .isIn(["text", "image", "file"])
    .withMessage("message_type must be text, image or file"),
  body("file_url")
    .optional({ nullable: true })
    .isString()
    .withMessage("file_url must be a string")
    .isLength({ max: 255 })
    .withMessage("file_url must be at most 255 characters"),
  body().custom((_, { req }) => {
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    const fileUrl = typeof req.body.file_url === "string" ? req.body.file_url.trim() : "";
    const messageType = req.body.message_type || "text";

    if (messageType === "text" && !content) {
      throw new Error("content is required for text message");
    }

    if ((messageType === "image" || messageType === "file") && !fileUrl && !content) {
      throw new Error("file_url or content is required for image/file message");
    }

    return true;
  }),
];

const sendMessageValidation = [
  body("conversationId")
    .isInt({ gt: 0 })
    .withMessage("conversationId must be a positive integer"),
  body("senderId")
    .isInt({ gt: 0 })
    .withMessage("senderId must be a positive integer"),
  body("message")
    .isString()
    .withMessage("message must be a string")
    .custom((value) => {
      if (!String(value).trim()) {
        throw new Error("message cannot be empty");
      }
      return true;
    })
    .isLength({ max: 5000 })
    .withMessage("message must be at most 5000 characters"),
];

router.use(authMiddleware);

router.post("/start", startConversationController);

router.get(
  "/conversations/:userId",
  [param("userId").isInt({ gt: 0 }).withMessage("userId must be a positive integer")],
  validationMiddleware,
  getUserConversationsController
);

router.post("/send", sendMessageValidation, validationMiddleware, sendMessageController);

router.post("/reply", commonMessageValidation, validationMiddleware, replyMessageController);

router.get(
  "/messages/:conversationId",
  [
    param("conversationId")
      .isInt({ gt: 0 })
      .withMessage("conversationId must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ gt: 0, le: 100 })
      .withMessage("limit must be an integer between 1 and 100"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("offset must be a non-negative integer"),
  ],
  validationMiddleware,
  getMessagesController
);

router.put(
  "/read/:conversationId",
  [
    param("conversationId")
      .isInt({ gt: 0 })
      .withMessage("conversationId must be a positive integer"),
  ],
  validationMiddleware,
  markReadController
);

export default router;
