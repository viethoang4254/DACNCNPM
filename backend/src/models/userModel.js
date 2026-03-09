import pool from "../config/db.js";

export const createUser = async ({ ho_ten, email, mat_khau, so_dien_thoai, role }) => {
  const [result] = await pool.execute(
    "INSERT INTO users (ho_ten, email, mat_khau, so_dien_thoai, role) VALUES (?, ?, ?, ?, ?)",
    [ho_ten, email, mat_khau, so_dien_thoai, role]
  );

  return getUserById(result.insertId);
};

export const getUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    "SELECT id, ho_ten, email, mat_khau, so_dien_thoai, role, created_at FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
};

export const getUserById = async (id) => {
  const [rows] = await pool.execute(
    "SELECT id, ho_ten, email, so_dien_thoai, role, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
};

export const getUserByIdWithPassword = async (id) => {
  const [rows] = await pool.execute(
    "SELECT id, ho_ten, email, mat_khau, so_dien_thoai, role, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
};

export const getUsers = async () => {
  const [rows] = await pool.execute(
    "SELECT id, ho_ten, email, so_dien_thoai, role, created_at FROM users ORDER BY id DESC"
  );
  return rows;
};

export const updateUserProfile = async (id, { ho_ten, so_dien_thoai }) => {
  await pool.execute("UPDATE users SET ho_ten = ?, so_dien_thoai = ? WHERE id = ?", [ho_ten, so_dien_thoai, id]);
  return getUserById(id);
};

export const updateUserPassword = async (id, mat_khau) => {
  await pool.execute("UPDATE users SET mat_khau = ? WHERE id = ?", [mat_khau, id]);
  return true;
};

export const deleteUserById = async (id) => {
  const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows > 0;
};
