import "dotenv/config";
import pool from "../config/db.js";

const main = async () => {
  const sql = `
    SELECT
      c.id,
      c.last_message_text,
      c.last_message_at,
      (
        SELECT COUNT(*)
        FROM chat_messages m
        WHERE m.conversation_id = c.id
      ) AS message_count
    FROM chat_conversations c
    ORDER BY (c.last_message_at IS NULL) ASC, c.last_message_at DESC, c.created_at DESC
    LIMIT 50;
  `;

  const [rows] = await pool.execute(sql);

  console.table(
    (rows || []).map((row) => ({
      id: row.id,
      count: Number(row.message_count || 0),
      last: row.last_message_text || "",
      lastAt: row.last_message_at,
    }))
  );

  await pool.end();
};

main().catch((error) => {
  console.error("[diagChatCounts] Failed:", error);
  process.exitCode = 1;
});
