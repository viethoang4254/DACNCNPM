import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const TOTAL_USERS = 100;

const names = [
  "Nguyễn Văn", "Trần Thị", "Lê Văn", "Phạm Thị", "Hoàng Văn",
  "Võ Thị", "Đặng Văn", "Bùi Thị", "Đỗ Văn", "Hồ Thị"
];

async function seedUsers() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "2701",
    database: "vietxanh_travel",
  });

  console.log("🚀 Seeding users...");

  // ✅ hash 1 lần duy nhất
  const hashedPassword = await bcrypt.hash("123456", 10);

  for (let i = 0; i < TOTAL_USERS; i++) {
    const name =
      names[Math.floor(Math.random() * names.length)] +
      " " +
      String.fromCharCode(65 + Math.floor(Math.random() * 26));

    const email = `user${Date.now()}_${i}@gmail.com`;

    const phone = "09" + Math.floor(10000000 + Math.random() * 89999999);

    await connection.execute(
      `INSERT INTO users (ho_ten, email, mat_khau, so_dien_thoai, role)
       VALUES (?, ?, ?, ?, 'customer')`,
      [name, email, hashedPassword, phone] // ✅ dùng hash chuẩn
    );
  }

  console.log("✅ Done 100 users!");
  console.log("👉 Password mặc định: 123456");

  process.exit();
}

seedUsers();