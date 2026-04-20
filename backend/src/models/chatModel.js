import pool from "../config/db.js";

const CHAT_DEBUG_ENABLED = process.env.CHAT_DEBUG === "1";

const logChatDebug = (...args) => {
  if (CHAT_DEBUG_ENABLED) {
    console.log("[chat-debug]", ...args);
  }
};

export const findOpenConversationByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT id, user_id, status, created_at
     FROM conversations
     WHERE user_id = ? AND status = 'open'
     ORDER BY id DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

export const createConversation = async ({ userId }) => {
  const [result] = await pool.execute(
    `INSERT INTO conversations (user_id, status)
     VALUES (?, 'open')`,
    [userId]
  );

  const [rows] = await pool.execute(
    `SELECT id, user_id, status, created_at
     FROM conversations
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return rows[0] || null;
};

export const getConversationById = async (conversationId) => {
  const [rows] = await pool.execute(
    `SELECT id, user_id, status, created_at
     FROM conversations
     WHERE id = ?
     LIMIT 1`,
    [conversationId]
  );

  return rows[0] || null;
};

export const getConversationsByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT id, user_id, status, created_at
     FROM conversations
     WHERE user_id = ?
     ORDER BY id DESC`,
    [userId]
  );

  return rows;
};

export const getAllConversations = async () => {
  const [rows] = await pool.execute(
    `SELECT
      c.id,
      c.user_id,
      c.status,
      c.created_at,
      u.ho_ten AS user_name,
      lm.last_message,
      lm.last_message_at,
      COALESCE(unread.unread_count, 0) AS unread_count
     FROM conversations c
     INNER JOIN users u ON u.id = c.user_id
     LEFT JOIN (
       SELECT m.conversation_id, m.content AS last_message, m.created_at AS last_message_at
       FROM messages m
       INNER JOIN (
         SELECT conversation_id, MAX(id) AS last_message_id
         FROM messages
         GROUP BY conversation_id
       ) latest ON latest.last_message_id = m.id
     ) lm ON lm.conversation_id = c.id
     LEFT JOIN (
       SELECT conversation_id, COUNT(*) AS unread_count
       FROM messages
       WHERE is_read = FALSE AND sender_type = 'user'
       GROUP BY conversation_id
     ) unread ON unread.conversation_id = c.id
     ORDER BY COALESCE(lm.last_message_at, c.created_at) DESC, c.id DESC`
  );

  return rows;
};

export const createMessage = async ({
  conversationId,
  senderType,
  senderId,
  content,
  messageType,
  fileUrl,
}) => {
  const [result] = await pool.execute(
    `INSERT INTO messages (
      conversation_id,
      sender_type,
      sender_id,
      content,
      message_type,
      file_url,
      is_read
    ) VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
    [conversationId, senderType, senderId, content, messageType, fileUrl]
  );

  const [rows] = await pool.execute(
    `SELECT
      m.id,
      m.conversation_id,
      m.sender_type,
      m.sender_id,
      m.content,
      m.message_type,
      m.file_url,
      m.is_read,
      m.created_at,
      u.ho_ten AS sender_name,
      u.role AS sender_role
     FROM messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return rows[0] || null;
};

export const getMessagesByConversationId = async ({ conversationId, limit, offset }) => {
  const conversationIdNumber = Number(conversationId);
  const limitNumber = Number(limit);
  const offsetNumber = Number(offset);

  const safeConversationId = Number.isFinite(conversationIdNumber) && conversationIdNumber > 0
    ? Math.trunc(conversationIdNumber)
    : 0;
  const safeLimit = Number.isFinite(limitNumber)
    ? Math.max(1, Math.min(100, Math.trunc(limitNumber)))
    : 20;
  const safeOffset = Number.isFinite(offsetNumber)
    ? Math.max(0, Math.trunc(offsetNumber))
    : 0;

  logChatDebug("getMessagesByConversationId.params", {
    raw: { conversationId, limit, offset },
    safe: {
      conversationId: safeConversationId,
      limit: safeLimit,
      offset: safeOffset,
    },
  });

  const [rows] = await pool.execute(
    `SELECT
      m.id,
      m.conversation_id,
      m.sender_type,
      m.sender_id,
      m.content,
      m.message_type,
      m.file_url,
      m.is_read,
      m.created_at,
      u.ho_ten AS sender_name,
      u.role AS sender_role
     FROM messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC, m.id ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [safeConversationId]
  );

  return rows;
};

export const countMessagesByConversationId = async (conversationId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM messages
     WHERE conversation_id = ?`,
    [conversationId]
  );

  return Number(rows[0]?.total || 0);
};

export const markConversationMessagesAsRead = async ({ conversationId, excludeSenderType }) => {
  const [result] = await pool.execute(
    `UPDATE messages
     SET is_read = TRUE
     WHERE conversation_id = ?
       AND sender_type <> ?
       AND is_read = FALSE`,
    [conversationId, excludeSenderType]
  );

  return Number(result.affectedRows || 0);
};
