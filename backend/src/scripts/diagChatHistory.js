import "dotenv/config";
import pool from "../config/db.js";

const conversationId = process.argv[2];
if (!conversationId) {
  console.error("Usage: node src/scripts/diagChatHistory.js <conversationId>");
  process.exit(1);
}

const main = async () => {
  const sql = `
    SELECT id, conversation_id, sender_role, sender_name, text, created_at
    FROM chat_messages
    WHERE conversation_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 10
  `;

  const [rows] = await pool.execute(sql, [String(conversationId).trim()]);

  console.table(
    (rows || []).map((row) => ({
      id: String(row.id),
      conversationId: row.conversation_id,
      senderRole: row.sender_role,
      senderName: row.sender_name,
      text: row.text,
      createdAt: row.created_at,
    }))
  );

  await pool.end();
};

main().catch((error) => {
  console.error("[diagChatHistory] Failed:", error);
  process.exitCode = 1;
});
