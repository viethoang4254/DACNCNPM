UPDATE tour_schedules
SET available_slots = GREATEST(max_slots - booked_slots, 0)
WHERE id >= 1;
ALTER TABLE tour_schedules
  ADD COLUMN max_slots INT NOT NULL AFTER start_date,
  ADD COLUMN booked_slots INT NOT NULL DEFAULT 0 AFTER max_slots,
  ADD COLUMN status ENUM('open', 'warning', 'guaranteed', 'full', 'cancelled', 'completed') NOT NULL DEFAULT 'open' AFTER available_slots,
  ADD COLUMN min_required_ratio DECIMAL(3,2) NOT NULL DEFAULT 0.50 AFTER status,
  ADD INDEX idx_tour_schedules_status (status);

UPDATE tour_schedules ts
INNER JOIN tours t ON t.id = ts.tour_id
SET
  ts.max_slots = COALESCE(ts.max_slots, t.so_nguoi_toi_da),
  ts.booked_slots = LEAST(
    COALESCE(ts.max_slots, t.so_nguoi_toi_da),
    GREATEST(COALESCE(ts.max_slots, t.so_nguoi_toi_da) - COALESCE(ts.available_slots, 0), 0)
  );