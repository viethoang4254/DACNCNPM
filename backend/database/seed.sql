USE booking_tour;

INSERT INTO users (ho_ten, email, mat_khau, so_dien_thoai, role)
VALUES
  ('System Admin', 'admin@tourvietnam.vn', '$2b$10$EBh3FYpf1kiV3vGXT/7XV.nTDsH72bf2qft.zR69C9XW.CTHiuVQG', '0900000001', 'admin'),
  ('Nguyen Van A', 'customer1@tourvietnam.vn', '$2b$10$S9tUW/59Etw130CmzaZrZO.3TzgW9tZfGdi0wUJ9xmiiNhZlq9Mn6', '0900000002', 'customer'),
  ('Tran Thi B', 'customer2@tourvietnam.vn', '$2b$10$S9tUW/59Etw130CmzaZrZO.3TzgW9tZfGdi0wUJ9xmiiNhZlq9Mn6', '0900000003', 'customer');

INSERT INTO tours (ten_tour, mo_ta, gia, tinh_thanh, diem_khoi_hanh, phuong_tien, so_ngay, so_nguoi_toi_da)
VALUES
  ('Da Nang - Hoi An 3N2D', 'Kham pha Da Nang, Ba Na Hills va pho co Hoi An', 3590000.00, 'da-nang', 'hcm', 'may-bay', 3, 30),
  ('Nha Trang 4N3D', 'Nghi duong bien Nha Trang, dao Hon Mun', 4290000.00, 'khanh-hoa', 'ha-noi', 'may-bay', 4, 25),
  ('Ha Noi - Ha Long 2N1D', 'Tham quan pho co va du thuyen Ha Long', 2490000.00, 'quang-ninh', 'ha-noi', 'xe-khach', 2, 35);

INSERT INTO tour_images (tour_id, image_url)
VALUES
  (1, '/uploads/tours/danang-1.jpg'),
  (1, '/uploads/tours/danang-2.jpg'),
  (2, '/uploads/tours/nhatrang-1.jpg'),
  (3, '/uploads/tours/halong-1.jpg');

INSERT INTO tour_schedules (tour_id, start_date, available_slots)
VALUES
  (1, '2026-04-05', 20),
  (1, '2026-04-15', 30),
  (2, '2026-04-10', 25),
  (3, '2026-04-07', 35);

INSERT INTO bookings (user_id, tour_id, schedule_id, so_nguoi, tong_tien, trang_thai)
VALUES
  (2, 1, 1, 2, 7180000.00, 'confirmed'),
  (3, 2, 3, 1, 4290000.00, 'pending');

INSERT INTO payments (booking_id, amount, method, status)
VALUES
  (1, 7180000.00, 'bank_transfer', 'paid'),
  (2, 4290000.00, 'momo', 'pending');

INSERT INTO reviews (user_id, tour_id, rating, comment)
VALUES
  (2, 1, 5, 'Tour rat tuyet voi, huong dan vien nhiet tinh!');
