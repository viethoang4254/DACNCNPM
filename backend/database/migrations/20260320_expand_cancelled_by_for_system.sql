-- Migration: Allow system as cancelled_by source
-- Created: 2026-03-20

ALTER TABLE bookings
MODIFY COLUMN cancelled_by ENUM('user', 'admin', 'system') NULL;
