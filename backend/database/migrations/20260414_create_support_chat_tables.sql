USE booking_tours;

CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversations_user_id (user_id),
  INDEX idx_conversations_status_created (status, created_at),
  INDEX idx_conversations_user_status_created (user_id, status, created_at),
  CONSTRAINT fk_conversations_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_type ENUM('user', 'system') NOT NULL,
  sender_id INT NULL,
  content TEXT,
  message_type ENUM('text', 'image', 'file') NOT NULL DEFAULT 'text',
  file_url VARCHAR(255) NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_conversation_id (conversation_id),
  INDEX idx_messages_sender_id (sender_id),
  INDEX idx_messages_created_at (created_at),
  INDEX idx_messages_conversation_created (conversation_id, created_at, id),
  INDEX idx_messages_conversation_read (conversation_id, is_read),
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES conversations(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
