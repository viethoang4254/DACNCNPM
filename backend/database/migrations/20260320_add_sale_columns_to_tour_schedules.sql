-- Migration: Add sale flags to tour schedules
-- Created: 2026-03-20

ALTER TABLE tour_schedules
ADD COLUMN is_on_sale BOOLEAN DEFAULT FALSE,
ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0;
