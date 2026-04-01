import "dotenv/config";
import pool from "../config/db.js";

const main = async () => {
  try {
    const [db] = await pool.query("SELECT DATABASE() AS db");
    console.log("DB:", db?.[0]?.db);

    const [t1] = await pool.query("SHOW TABLES LIKE 'chat_conversations'");
    const [t2] = await pool.query("SHOW TABLES LIKE 'chat_messages'");

    console.log("chat_conversations:", t1.length ? "OK" : "MISSING");
    console.log("chat_messages:", t2.length ? "OK" : "MISSING");

    if (!t1.length || !t2.length) {
      process.exitCode = 2;
    }
  } catch (error) {
    console.error("Failed to check chat tables:", error.message);
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
