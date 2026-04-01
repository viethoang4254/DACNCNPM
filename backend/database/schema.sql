SET NAMES utf8mb4;

DROP DATABASE IF EXISTS booking_tours;
CREATE DATABASE booking_tours
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE booking_tours;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ho_ten VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL,
  mat_khau VARCHAR(255) NOT NULL,
  so_dien_thoai VARCHAR(20) NOT NULL,
  role ENUM('admin','chatbox', 'customer') NOT NULL DEFAULT 'customer',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten_tour VARCHAR(255) NOT NULL,
  mo_ta TEXT,
  gia DECIMAL(12,2) NOT NULL,
  tinh_thanh VARCHAR(120) NOT NULL,
  diem_khoi_hanh VARCHAR(120) NOT NULL,
  phuong_tien VARCHAR(120) NOT NULL,
  so_ngay INT NOT NULL,
  so_nguoi_toi_da INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tours_tinh_thanh (tinh_thanh),
  INDEX idx_tours_diem_khoi_hanh (diem_khoi_hanh),
  INDEX idx_tours_gia (gia),
  INDEX idx_tours_created_at (created_at),
  CONSTRAINT chk_tours_so_ngay CHECK (so_ngay > 0),
  CONSTRAINT chk_tours_so_nguoi_toi_da CHECK (so_nguoi_toi_da > 0),
  CONSTRAINT chk_tours_gia CHECK (gia >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tour_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tour_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  INDEX idx_tour_images_tour_id (tour_id),
  CONSTRAINT fk_tour_images_tour
    FOREIGN KEY (tour_id)
    REFERENCES tours(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tour_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tour_id INT NOT NULL,
  start_date DATE NOT NULL,
  available_slots INT NOT NULL,
  INDEX idx_tour_schedules_tour_id (tour_id),
  INDEX idx_tour_schedules_start_date (start_date),
  CONSTRAINT uq_tour_schedule UNIQUE (tour_id, start_date),
  CONSTRAINT fk_tour_schedules_tour
    FOREIGN KEY (tour_id)
    REFERENCES tours(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_tour_schedules_slots CHECK (available_slots >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tour_itineraries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tour_id INT NOT NULL,
  day_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tour_itineraries_tour_id (tour_id),
  INDEX idx_tour_itineraries_day_number (day_number),
  CONSTRAINT uq_tour_itineraries_tour_day UNIQUE (tour_id, day_number),
  CONSTRAINT fk_tour_itineraries_tour
    FOREIGN KEY (tour_id)
    REFERENCES tours(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_tour_itineraries_day_number CHECK (day_number > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tour_id INT NOT NULL,
  schedule_id INT NOT NULL,
  so_nguoi INT NOT NULL,
  tong_tien DECIMAL(12,2) NOT NULL,
  trang_thai ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bookings_user_id (user_id),
  INDEX idx_bookings_tour_id (tour_id),
  INDEX idx_bookings_schedule_id (schedule_id),
  INDEX idx_bookings_created_at (created_at),
  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_tour
    FOREIGN KEY (tour_id)
    REFERENCES tours(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_schedule
    FOREIGN KEY (schedule_id)
    REFERENCES tour_schedules(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT chk_bookings_people CHECK (so_nguoi > 0),
  CONSTRAINT chk_bookings_total CHECK (tong_tien >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payments_booking_id (booking_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_created_at (created_at),
  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tour_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reviews_user_id (user_id),
  INDEX idx_reviews_tour_id (tour_id),
  INDEX idx_reviews_created_at (created_at),
  UNIQUE KEY uq_reviews_user_tour (user_id, tour_id),
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_tour
    FOREIGN KEY (tour_id)
    REFERENCES tours(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_conversations (
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

CREATE TABLE chat_messages (
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
