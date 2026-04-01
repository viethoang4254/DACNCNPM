import "dotenv/config";
import pool from "../config/db.js";

const createChatConversationsSql = `
CREATE TABLE IF NOT EXISTS chat_conversations (
  id VARCHAR(64) PRIMARY KEY,
  customer_id INT NULL,
  customer_name VARCHAR(150) NULL,
  customer_email VARCHAR(191) NULL,
  last_message_at DATETIME NULL,
  last_message_text TEXT NULL,
  unread_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_conversations_customer_id (customer_id),
  INDEX idx_chat_conversations_last_message_at (last_message_at),
  CONSTRAINT fk_chat_conversations_customer
    FOREIGN KEY (customer_id)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const createChatMessagesSql = `
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL,
  sender_role ENUM('agent', 'customer') NOT NULL,
  sender_name VARCHAR(150) NULL,
  text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_messages_conversation_created (conversation_id, created_at),
  CONSTRAINT fk_chat_messages_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES chat_conversations(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const main = async () => {
  try {
    const [db] = await pool.query("SELECT DATABASE() AS db");
    console.log("DB:", db?.[0]?.db);

    await pool.query(createChatConversationsSql);
    await pool.query(createChatMessagesSql);

    const [t1] = await pool.query("SHOW TABLES LIKE 'chat_conversations'");
    const [t2] = await pool.query("SHOW TABLES LIKE 'chat_messages'");

    console.log("chat_conversations:", t1.length ? "OK" : "MISSING");
    console.log("chat_messages:", t2.length ? "OK" : "MISSING");

    console.log("Done.");
  } catch (error) {
    console.error("Failed to migrate chat tables:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  }
};

main();
