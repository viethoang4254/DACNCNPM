import pool from "../config/db.js";

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
     LIMIT ? OFFSET ?`,
    [conversationId, limit, offset]
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
