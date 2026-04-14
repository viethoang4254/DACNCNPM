import { Server } from "socket.io";

let ioInstance = null;

const conversationRoom = (conversationId) => `conversation:${conversationId}`;
const userRoom = (userId) => `user:${userId}`;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  ioInstance.on("connection", (socket) => {
    socket.on("join_conversation", (conversationId) => {
      const id = Number(conversationId);
      if (!Number.isInteger(id) || id <= 0) {
        return;
      }
      socket.join(conversationRoom(id));
    });

    socket.on("join_user", (userId) => {
      const id = Number(userId);
      if (!Number.isInteger(id) || id <= 0) {
        return;
      }
      socket.join(userRoom(id));
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;

export const emitToConversation = (eventName, conversationId, payload) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(conversationRoom(conversationId)).emit(eventName, payload);
};

export const emitToUser = (eventName, userId, payload) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(userRoom(userId)).emit(eventName, payload);
};
