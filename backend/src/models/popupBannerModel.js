import pool from "../config/db.js";

export const getAdminPopupBanners = async () => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      title,
      image_url,
      link,
      is_active,
      start_date,
      end_date,
      priority,
      target_type,
      created_at
    FROM popup_banners
    ORDER BY priority DESC, start_date DESC, id DESC`,
  );

  return rows;
};

export const getActivePopupBanner = async ({ isLoggedIn }) => {
  const targetAudience = isLoggedIn ? "logged_in" : "guest";

  const [rows] = await pool.execute(
    `SELECT
      id,
      title,
      image_url,
      link,
      is_active,
      start_date,
      end_date,
      priority,
      target_type,
      created_at
    FROM popup_banners
    WHERE is_active = TRUE
      AND NOW() BETWEEN start_date AND end_date
      AND (target_type = 'all' OR target_type = ?)
    ORDER BY priority DESC, start_date DESC, id DESC
    LIMIT 1`,
    [targetAudience],
  );

  return rows[0] || null;
};

export const createPopupBanner = async ({
  title,
  image_url,
  link,
  is_active,
  start_date,
  end_date,
  priority,
  target_type,
}) => {
  const [result] = await pool.execute(
    `INSERT INTO popup_banners
      (title, image_url, link, is_active, start_date, end_date, priority, target_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      image_url,
      link || null,
      Boolean(is_active),
      start_date,
      end_date,
      priority,
      target_type,
    ],
  );

  return Number(result.insertId);
};

export const updatePopupBannerById = async (
  id,
  {
    title,
    image_url,
    link,
    is_active,
    start_date,
    end_date,
    priority,
    target_type,
  },
) => {
  const [result] = await pool.execute(
    `UPDATE popup_banners
     SET title = ?,
         image_url = ?,
         link = ?,
         is_active = ?,
         start_date = ?,
         end_date = ?,
         priority = ?,
         target_type = ?
     WHERE id = ?`,
    [
      title,
      image_url,
      link || null,
      Boolean(is_active),
      start_date,
      end_date,
      priority,
      target_type,
      id,
    ],
  );

  return Number(result?.affectedRows || 0) > 0;
};

export const deletePopupBannerById = async (id) => {
  const [result] = await pool.execute("DELETE FROM popup_banners WHERE id = ?", [id]);

  return Number(result?.affectedRows || 0) > 0;
};

export const togglePopupBannerActiveById = async (id) => {
  const [result] = await pool.execute(
    `UPDATE popup_banners
     SET is_active = NOT is_active
     WHERE id = ?`,
    [id],
  );

  return Number(result?.affectedRows || 0) > 0;
};

export const getPopupBannerById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      title,
      image_url,
      link,
      is_active,
      start_date,
      end_date,
      priority,
      target_type,
      created_at
     FROM popup_banners
     WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
};
