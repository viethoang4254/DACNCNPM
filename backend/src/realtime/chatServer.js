import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const MAX_MESSAGES_PER_CONVERSATION = 200;

const normalizeText = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const getTokenFromHandshake = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.trim();
  }

  const authHeader = socket.handshake?.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return "";
};

const buildMessage = ({ conversationId, senderRole, senderName, text }) => {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    conversationId,
    senderRole,
    senderName: senderName || (senderRole === "agent" ? "Admin" : "Khách"),
    text,
    createdAt: new Date().toISOString(),
  };
};

const toIsoString = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const buildUserConversationId = (userId) => {
  const normalized = String(userId || "").trim();
  if (!normalized) return "";
  return `user:${normalized}`;
};

const isAgentRole = (role) => role === "admin" || role === "chatbox";

const resolveConversationIdForCustomerSocket = (socket, requestedConversationId) => {
  const userId = socket.data.user?.id;
  const role = socket.data.user?.role;
  if (role && !isAgentRole(role) && userId) {
    return buildUserConversationId(userId);
  }

  const requested = String(requestedConversationId || "").trim();
  return requested;
};

const resolveConversationIdForAdmin = ({ conversationId, customerId } = {}) => {
  const fromConversationId = String(conversationId || "").trim();
  if (fromConversationId) return fromConversationId;

  const normalizedCustomerId = String(customerId || "").trim();
  if (!normalizedCustomerId) return "";
  return buildUserConversationId(normalizedCustomerId);
};

export const createChatServer = (httpServer, { corsOrigin } = {}) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || "*",
      methods: ["GET", "POST"],
    },
  });

  // Presence tracking for admins viewing a conversation.
  const adminPresenceCountByConversation = new Map(); // conversationId -> number
  const adminConversationBySocketId = new Map(); // socket.id -> conversationId

  const fetchConversationList = async () => {
    const [rows] = await pool.execute(
      `SELECT
        c.id,
        c.created_at,
        c.last_message_at,
        c.last_message_text,
        c.unread_count,
        c.customer_name AS customer_name_fallback,
        c.customer_email AS customer_email_fallback,
        u.id AS user_id,
        u.ho_ten AS user_name,
        u.email AS user_email
      FROM chat_conversations c
      LEFT JOIN users u ON u.id = c.customer_id
      ORDER BY (c.last_message_at IS NULL) ASC, c.last_message_at DESC, c.created_at DESC`
    );

    return (rows || []).map((row) => {
      const customer = {
        id: row.user_id ?? null,
        name: row.user_name || row.customer_name_fallback || "Khách",
        email: row.user_email || row.customer_email_fallback || "",
      };

      return {
        id: row.id,
        createdAt: toIsoString(row.created_at),
        lastMessageAt: toIsoString(row.last_message_at),
        lastMessageText: row.last_message_text || "",
        unreadCount: Number(row.unread_count || 0),
        customer,
      };
    });
  };

  const emitConversationsUpdate = async () => {
    const list = await fetchConversationList();
    io.to("agents").emit("conversations:update", list);
  };

  const ensureConversation = async ({ conversationId, customerId, customerName, customerEmail } = {}) => {
    const id = String(conversationId || "").trim();
    if (!id) return;

    const normalizedName = typeof customerName === "string" ? customerName.trim() : "";
    const normalizedEmail = typeof customerEmail === "string" ? customerEmail.trim() : "";
    const normalizedCustomerId = customerId != null && String(customerId).trim() ? Number(customerId) : null;

    await pool.execute(
      `INSERT INTO chat_conversations (id, customer_id, customer_name, customer_email, unread_count, last_message_text)
       VALUES (?, ?, ?, ?, 0, '')
       ON DUPLICATE KEY UPDATE
        customer_id = COALESCE(VALUES(customer_id), customer_id),
        customer_name = COALESCE(NULLIF(VALUES(customer_name), ''), customer_name),
        customer_email = COALESCE(NULLIF(VALUES(customer_email), ''), customer_email)`,
      [id, normalizedCustomerId, normalizedName || null, normalizedEmail || null]
    );
  };

  const fetchConversationHistory = async (conversationId) => {
    const id = String(conversationId || "").trim();
    if (!id) return [];

    const safeLimit = Math.max(1, Math.min(500, Number(MAX_MESSAGES_PER_CONVERSATION) || 200));
    const [rows] = await pool.execute(
      `SELECT id, conversation_id, sender_role, sender_name, text, created_at
       FROM chat_messages
       WHERE conversation_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ${safeLimit}`,
      [id]
    );

    const list = (rows || []).map((row) => ({
      id: String(row.id),
      conversationId: row.conversation_id,
      senderRole: row.sender_role,
      senderName: row.sender_name || (row.sender_role === "agent" ? "Admin" : "Khách"),
      text: row.text,
      createdAt: toIsoString(row.created_at),
    }));

    list.reverse();
    return list;
  };

  const markConversationRead = async (conversationId) => {
    const id = String(conversationId || "").trim();
    if (!id) return;
    await pool.execute("UPDATE chat_conversations SET unread_count = 0 WHERE id = ?", [id]);
  };

  const isAdminViewingConversation = (conversationId) => {
    const count = adminPresenceCountByConversation.get(conversationId);
    return Number(count || 0) > 0;
  };

  const setAdminActiveConversation = (socket, conversationId) => {
    const socketId = socket.id;
    const prevConversationId = adminConversationBySocketId.get(socketId);

    if (prevConversationId && prevConversationId !== conversationId) {
      const prevCount = Number(adminPresenceCountByConversation.get(prevConversationId) || 0);
      const nextPrevCount = Math.max(0, prevCount - 1);
      if (nextPrevCount === 0) adminPresenceCountByConversation.delete(prevConversationId);
      else adminPresenceCountByConversation.set(prevConversationId, nextPrevCount);
    }

    if (!conversationId) {
      adminConversationBySocketId.delete(socketId);
      return;
    }

    if (prevConversationId !== conversationId) {
      const currentCount = Number(adminPresenceCountByConversation.get(conversationId) || 0);
      adminPresenceCountByConversation.set(conversationId, currentCount + 1);
    }

    adminConversationBySocketId.set(socketId, conversationId);
  };

  const pushMessage = (conversationId, message) => {
    // Legacy helper kept for compatibility; DB-backed persistence uses persistMessage().
    io.to(`conversation:${conversationId}`).emit("message:new", message);
  };

  const persistMessage = async ({ conversationId, senderRole, senderName, text }) => {
    const id = String(conversationId || "").trim();
    const normalizedText = normalizeText(text);
    if (!id || !normalizedText) return null;

    await ensureConversation({ conversationId: id });

    const normalizedSenderName = typeof senderName === "string" ? senderName.trim() : "";
    const [result] = await pool.execute(
      "INSERT INTO chat_messages (conversation_id, sender_role, sender_name, text) VALUES (?, ?, ?, ?)",
      [id, senderRole, normalizedSenderName || null, normalizedText]
    );

    if (senderRole === "customer") {
      const viewing = isAdminViewingConversation(id) ? 1 : 0;
      await pool.execute(
        "UPDATE chat_conversations SET last_message_at = NOW(), last_message_text = ?, unread_count = CASE WHEN ? THEN 0 ELSE unread_count + 1 END WHERE id = ?",
        [normalizedText, viewing, id]
      );
    } else {
      await pool.execute(
        "UPDATE chat_conversations SET last_message_at = NOW(), last_message_text = ? WHERE id = ?",
        [normalizedText, id]
      );
    }

    const createdAt = new Date().toISOString();
    return {
      id: String(result.insertId),
      conversationId: id,
      senderRole,
      senderName: normalizedSenderName || (senderRole === "agent" ? "Admin" : "Khách"),
      text: normalizedText,
      createdAt,
    };
  };

  const deleteConversation = async (conversationId) => {
    const id = String(conversationId || "").trim();
    if (!id) return false;

    const [rows] = await pool.execute("SELECT 1 AS ok FROM chat_conversations WHERE id = ? LIMIT 1", [id]);
    const existed = Array.isArray(rows) && rows.length > 0;

    await pool.execute("DELETE FROM chat_conversations WHERE id = ?", [id]);

    io.to(`conversation:${id}`).emit("conversation:deleted", { conversationId: id });
    await emitConversationsUpdate();

    return existed;
  };

  io.use((socket, next) => {
    const token = getTokenFromHandshake(socket);
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = decoded;
    } catch {
      // Ignore invalid token; client can still connect as customer.
    }

    return next();
  });

  io.on("connection", (socket) => {
    socket.on("disconnect", () => {
      if (!isAgentRole(socket.data.user?.role)) return;

      const active = adminConversationBySocketId.get(socket.id);
      if (!active) return;

      const currentCount = Number(adminPresenceCountByConversation.get(active) || 0);
      const nextCount = Math.max(0, currentCount - 1);
      if (nextCount === 0) adminPresenceCountByConversation.delete(active);
      else adminPresenceCountByConversation.set(active, nextCount);

      adminConversationBySocketId.delete(socket.id);
    });

    socket.on("agent:hello", async () => {
      if (!isAgentRole(socket.data.user?.role)) {
        socket.emit("agent:error", { message: "Forbidden" });
        return;
      }

      socket.join("agents");
      try {
        socket.emit("conversations:update", await fetchConversationList());
      } catch (error) {
        console.error("[chat] Failed to list conversations:", error.message);
      }
    });

    socket.on("agent:join", async ({ conversationId, customerId } = {}, ack) => {
      if (!isAgentRole(socket.data.user?.role)) {
        socket.emit("agent:error", { message: "Forbidden" });
        if (typeof ack === "function") ack({ ok: false, message: "Forbidden" });
        return;
      }

      const id = resolveConversationIdForAdmin({ conversationId, customerId });
      if (!id) {
        if (typeof ack === "function") ack({ ok: false, message: "Missing conversationId" });
        return;
      }

      for (const room of socket.rooms) {
        if (typeof room === "string" && room.startsWith("conversation:")) {
          socket.leave(room);
        }
      }

      socket.join(`conversation:${id}`);

      setAdminActiveConversation(socket, id);

      // Always try to return history to the agent even if unread/list updates fail.
      try {
        const history = await fetchConversationHistory(id);
        socket.emit("conversation:history", { conversationId: id, messages: history });
        if (typeof ack === "function") ack({ ok: true, conversationId: id, messages: history });
      } catch (error) {
        console.error("[chat] Failed to fetch conversation history:", error.message);
        socket.emit("conversation:history", { conversationId: id, messages: [] });
        socket.emit("agent:error", { message: "Failed to load conversation history" });
        if (typeof ack === "function") ack({ ok: false, conversationId: id, messages: [], message: "Failed to load conversation history" });
      }

      Promise.allSettled([markConversationRead(id), emitConversationsUpdate()]).catch(() => undefined);
    });

    socket.on("agent:message", async ({ conversationId, customerId, text } = {}) => {
      if (!isAgentRole(socket.data.user?.role)) {
        socket.emit("agent:error", { message: "Forbidden" });
        return;
      }

      const id = resolveConversationIdForAdmin({ conversationId, customerId });
      const normalized = normalizeText(text);
      if (!id || !normalized) return;

      const senderName = socket.data.user?.ho_ten || socket.data.user?.name || "Admin";
      try {
        const message = await persistMessage({ conversationId: id, senderRole: "agent", senderName, text: normalized });
        if (!message) return;
        socket.to(`conversation:${id}`).emit("message:new", message);
        socket.emit("message:new", message);
        await emitConversationsUpdate();
      } catch (error) {
        console.error("[chat] Failed to persist agent message:", error.message);
      }
    });

    socket.on("agent:deleteConversation", async ({ conversationId, customerId } = {}) => {
      if (!isAgentRole(socket.data.user?.role)) {
        socket.emit("agent:error", { message: "Forbidden" });
        return;
      }

      const id = resolveConversationIdForAdmin({ conversationId, customerId });
      if (!id) return;

      try {
        const deleted = await deleteConversation(id);
        socket.emit("conversation:delete:result", { conversationId: id, deleted });
      } catch (error) {
        console.error("[chat] Failed to delete conversation:", error.message);
      }
    });

    socket.on("customer:join", async ({ conversationId, customer } = {}, ack) => {
      const id = resolveConversationIdForCustomerSocket(socket, conversationId);
      if (!id) {
        if (typeof ack === "function") ack({ ok: false, message: "Missing conversationId" });
        return;
      }

      const jwtName = socket.data.user?.ho_ten || socket.data.user?.name;
      const jwtCustomer = socket.data.user?.id && !isAgentRole(socket.data.user?.role)
        ? {
            id: socket.data.user.id,
            email: socket.data.user?.email || "",
            ...(jwtName ? { name: jwtName } : {}),
          }
        : null;

      const incomingCustomer = customer && typeof customer === "object" ? customer : {};
      const mergedCustomer = { ...incomingCustomer, ...(jwtCustomer || {}) };

      const customerId = socket.data.user?.id && !isAgentRole(socket.data.user?.role) ? socket.data.user.id : null;
      const customerName = mergedCustomer?.name || mergedCustomer?.ho_ten || "";
      const customerEmail = mergedCustomer?.email || "";

      try {
        await ensureConversation({ conversationId: id, customerId, customerName, customerEmail });
      } catch (error) {
        console.error("[chat] Failed to ensure conversation:", error.message);
      }

      socket.join(`conversation:${id}`);

      // Always try to return history to the customer even if list updates fail.
      try {
        const history = await fetchConversationHistory(id);
        socket.emit("conversation:history", { conversationId: id, messages: history });
        if (typeof ack === "function") ack({ ok: true, conversationId: id, messages: history });
      } catch (error) {
        console.error("[chat] Failed to send customer history:", error.message);
        socket.emit("conversation:history", { conversationId: id, messages: [] });
        if (typeof ack === "function") ack({ ok: false, conversationId: id, messages: [] });
      }

      emitConversationsUpdate().catch((error) => {
        console.error("[chat] Failed to emit conversations:update:", error.message);
      });
    });

    socket.on("customer:message", async ({ conversationId, text, senderName } = {}) => {
      const id = resolveConversationIdForCustomerSocket(socket, conversationId);
      const normalized = normalizeText(text);
      if (!id || !normalized) return;

      const jwtSenderName = socket.data.user?.id && !isAgentRole(socket.data.user?.role)
        ? socket.data.user?.ho_ten || socket.data.user?.name || ""
        : "";

      const effectiveSenderName = jwtSenderName || (typeof senderName === "string" ? senderName.trim() : "");

      const customerId = socket.data.user?.id && !isAgentRole(socket.data.user?.role) ? socket.data.user.id : null;
      try {
        await ensureConversation({ conversationId: id, customerId, customerName: effectiveSenderName, customerEmail: socket.data.user?.email || "" });
        const message = await persistMessage({ conversationId: id, senderRole: "customer", senderName: effectiveSenderName, text: normalized });
        if (!message) return;
        socket.to(`conversation:${id}`).emit("message:new", message);
        socket.emit("message:new", message);
        await emitConversationsUpdate();
      } catch (error) {
        console.error("[chat] Failed to persist customer message:", error.message);
      }
    });
  });

  return io;
};
