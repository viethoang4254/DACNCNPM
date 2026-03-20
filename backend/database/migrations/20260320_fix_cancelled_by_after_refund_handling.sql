-- Migration: Sửa dữ liệu cancelled_by bị ghi đè khi admin xử lý hoàn tiền
-- Created: 2026-03-20
--
-- Bối cảnh:
-- Trước đây khi approve/reject refund, hệ thống có cập nhật cancelled_by = 'admin'.
-- Điều này làm sai ngữ nghĩa vì admin chỉ xử lý hoàn tiền, không phải người hủy đơn.
--
-- Phạm vi sửa:
-- Chỉ cập nhật các booking đã hủy, có refund_status processed/failed,
-- bị gán cancelled_by = 'admin' trong khoảng thời gian rollout tính năng.
--
-- Có thể chạy kiểm tra trước khi UPDATE:
-- SELECT id, user_id, refund_status, cancelled_by, cancelled_at
-- FROM bookings
-- WHERE trang_thai = 'cancelled'
--   AND cancelled_by = 'admin'
--   AND refund_status IN ('processed', 'failed')
--   AND cancelled_at >= '2026-03-20 00:00:00';

UPDATE bookings b
SET b.cancelled_by = 'user'
WHERE b.trang_thai = 'cancelled'
  AND b.cancelled_by = 'admin'
  AND b.refund_status IN ('processed', 'failed')
  AND b.cancelled_at >= '2026-03-20 00:00:00';
