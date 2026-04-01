import "dotenv/config";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { createUser, getUserByEmail } from "../models/userModel.js";

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
};

const printUsage = () => {
  console.log("\nCreate/Update admin user");
  console.log("Usage:");
  console.log("  npm run seed:admin -- --email admin@example.com --password 123456 --name \"Admin\" --phone 0900000000");
  console.log("\nOptions:");
  console.log("  --email       (required)");
  console.log("  --password    (required)");
  console.log("  --name        (optional, default: Admin)");
  console.log("  --phone       (optional, default: 0900000000)");
  console.log("\nNotes:");
  console.log("- If user exists, role will be set to admin and password updated.");
};

const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  const email = typeof args.email === "string" ? args.email.trim() : "";
  const password = typeof args.password === "string" ? args.password : "";
  const name = typeof args.name === "string" ? args.name.trim() : "Admin";
  const phone = typeof args.phone === "string" ? args.phone.trim() : "0900000000";

  if (!validateEmail(email) || !password) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET in backend .env");
    process.exitCode = 1;
    return;
  }

  try {
    await pool.query("SELECT 1");

    const existing = await getUserByEmail(email);
    const hashed = await bcrypt.hash(password, 10);

    if (!existing) {
      const user = await createUser({
        ho_ten: name || "Admin",
        email,
        mat_khau: hashed,
        so_dien_thoai: phone || "0900000000",
        role: "admin",
      });

      console.log("\nCreated admin user:");
      console.log(`- id: ${user.id}`);
      console.log(`- email: ${user.email}`);
      console.log(`- role: ${user.role}`);
      return;
    }

    await pool.execute(
      "UPDATE users SET role = 'admin', mat_khau = ?, ho_ten = COALESCE(NULLIF(?, ''), ho_ten), so_dien_thoai = COALESCE(NULLIF(?, ''), so_dien_thoai) WHERE email = ?",
      [hashed, name, phone, email]
    );

    console.log("\nUpdated existing user to admin:");
    console.log(`- id: ${existing.id}`);
    console.log(`- email: ${existing.email}`);
    console.log("- role: admin");
  } catch (error) {
    console.error("Failed to create/update admin:", error.message);
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
