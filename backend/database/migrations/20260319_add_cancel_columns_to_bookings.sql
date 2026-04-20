-- Migration: Add cancel columns to bookings table
-- Created: 2026-03-19
-- Description: Add columns to support booking cancellation with refund tracking

-- Step 1: Alter bookings table - Add cancellation columns
ALTER TABLE bookings
ADD COLUMN cancelled_at DATETIME NULL AFTER trang_thai,
ADD COLUMN cancel_reason VARCHAR(255) NULL AFTER cancelled_at,
ADD COLUMN refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER cancel_reason,
ADD COLUMN refund_status ENUM('none', 'pending', 'processed', 'failed') NOT NULL DEFAULT 'none' AFTER refund_amount,
ADD COLUMN cancelled_by ENUM('user', 'admin') NULL AFTER refund_status,
ADD INDEX idx_bookings_cancelled_at (cancelled_at),
ADD INDEX idx_bookings_refund_status (refund_status);

-- Step 2: Alter payments table - Add 'refunded' status to ENUM
ALTER TABLE payments
MODIFY COLUMN status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending';

-- Step 3: Add index for faster cancellation queries
ALTER TABLE bookings
ADD INDEX idx_bookings_trang_thai_cancelled (trang_thai, cancelled_at);
