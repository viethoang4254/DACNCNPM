# API Examples - Cancel Booking

## Endpoint 1: GET /api/bookings/:id/cancel-preview

Lấy thông tin hoàn tiền **trước** khi confirm hủy tour.

### Request

```bash
curl -X GET \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  http://localhost:5000/api/bookings/42/cancel-preview
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Cancel preview retrieved successfully",
  "data": {
    "bookingId": 42,
    "tourName": "Tour Hà Nội - Hạ Long - Sapa 5 Ngày 4 Đêm",
    "startDate": "2026-04-15",
    "originalAmount": 12500000,
    "daysLeft": 10,
    "refundPercentage": 100,
    "refundAmount": 12500000,
    "message": "Refund 100% - Full refund"
  }
}
```

### Error Response (400) - < 1 Day

```json
{
  "success": false,
  "message": "Cannot cancel within 24 hours of tour departure (0 days left)",
  "data": {}
}
```

### Error Response (400) - Already Cancelled

```json
{
  "success": false,
  "message": "Booking already cancelled",
  "data": {}
}
```

### Error Response (404)

```json
{
  "success": false,
  "message": "Booking not found or not yours",
  "data": {}
}
```

---

## Endpoint 2: POST /api/bookings/:id/cancel

Thực hiện **hủy tour** - Execute cancellation với auto-refund.

### Request

```bash
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  http://localhost:5000/api/bookings/42/cancel
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "bookingId": 42,
    "tourName": "Tour Hà Nội - Hạ Long - Sapa 5 Ngày 4 Đêm",
    "refundAmount": 12500000,
    "refundPercentage": 100,
    "refundStatus": "pending",
    "cancelledAt": "2026-03-19T14:35:22.000Z",
    "booking": {
      "id": 42,
      "user_id": 5,
      "tour_id": 3,
      "schedule_id": 15,
      "so_nguoi": 2,
      "tong_tien": 12500000,
      "trang_thai": "cancelled",
      "created_at": "2026-03-09T10:15:00.000Z",
      "cancelled_at": "2026-03-19T14:35:22.000Z",
      "refund_amount": 12500000,
      "refund_status": "pending",
      "cancelled_by": "user",
      "user_name": "Nguyễn Văn A",
      "user_email": "user@example.com",
      "ten_tour": "Tour Hà Nội - Hạ Long - Sapa 5 Ngày 4 Đêm",
      "gia": 6250000,
      "tinh_thanh": "Hà Nội",
      "start_date": "2026-04-15",
      "schedule_status": "guaranteed",
      "payment_status": "paid",
      "image": "https://example.com/tour-image.jpg"
    }
  }
}
```

### Success Response Examples (different scenarios)

#### Scenario 1: Full Refund (10 days left)
```json
{
  "data": {
    "refundPercentage": 100,
    "refundAmount": 12500000,
    "refundStatus": "pending"
  }
}
```

#### Scenario 2: Partial Refund (5 days left)
```json
{
  "data": {
    "refundPercentage": 50,
    "refundAmount": 6250000,
    "refundStatus": "pending"
  }
}
```

#### Scenario 3: No Refund (2 days left)
```json
{
  "data": {
    "refundPercentage": 0,
    "refundAmount": 0,
    "refundStatus": "none"
  }
}
```

### Error Response (400) - Cannot Cancel

```json
{
  "success": false,
  "message": "Cannot cancel within 24 hours of tour departure (0 days left)",
  "data": {}
}
```

### Error Response (400) - Already Cancelled

```json
{
  "success": false,
  "message": "Booking already cancelled",
  "data": {}
}
```

### Error Response (400) - Schedule Cancelled

```json
{
  "success": false,
  "message": "Cannot cancel booking with status: cancelled",
  "data": {}
}
```

### Error Response (403) - Not Owner

```json
{
  "success": false,
  "message": "Forbidden",
  "data": {}
}
```

### Error Response (404)

```json
{
  "success": false,
  "message": "Booking not found or not yours",
  "data": {}
}
```

### Error Response (500) - Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "data": {}
}
```

---

## Frontend Usage Example

### Step 1: Get Cancel Preview

```javascript
import { getCancelPreview } from './services/userService';

const booking = { id: 42, ten_tour: "Tour...", start_date: "2026-04-15" };

try {
  const preview = await getCancelPreview(booking.id);
  console.log(`Refund: ${preview.refundAmount} (${preview.refundPercentage}%)`);
  // Output: Refund: 12500000 (100%)
} catch (error) {
  console.error('Cannot preview:', error.response.data.message);
}
```

### Step 2: Execute Cancel

```javascript
import { cancelBooking } from './services/userService';

try {
  const result = await cancelBooking(booking.id);
  console.log('Cancelled successfully!');
  console.log(`Refund Amount: ${result.refundAmount}`);
  console.log(`Refund Status: ${result.refundStatus}`);
  
  // Update UI
  setBookingStatus('cancelled');
  showToast(`Hủy tour thành công! Hoàn tiền: ${result.refundAmount}`);
} catch (error) {
  console.error('Cancel failed:', error.response.data.message);
  showError(error.response.data.message);
}
```

---

## Refund Calculation Examples

### Example 1: 10 Days Left
- Original: 12,500,000 VND
- Days left: 10 (≥7)
- Refund %: **100%**
- Refund amount: **12,500,000 VND**

### Example 2: 5 Days Left
- Original: 12,500,000 VND
- Days left: 5 (3-6 range)
- Refund %: **50%**
- Refund amount: **6,250,000 VND**

### Example 3: 2 Days Left
- Original: 12,500,000 VND
- Days left: 2 (<3)
- Refund %: **0%**
- Refund amount: **0 VND**

### Example 4: Cannot Cancel
- Original: 12,500,000 VND
- Days left: 0.5 (<1)
- Status: **❌ ERROR - Cannot cancel**

---

## Status Flow After Cancel

### Before Cancel:
```
bookings:
  trang_thai: "confirmed"
  cancelled_at: NULL
  refund_amount: 0
  refund_status: "none"

tour_schedules:
  booked_slots: 5 (was 7)

payments:
  status: "paid"
```

### After Cancel:
```
bookings:
  trang_thai: "cancelled"
  cancelled_at: "2026-03-19T14:35:22Z"
  refund_amount: 12500000
  refund_status: "pending"
  cancelled_by: "user"

tour_schedules:
  booked_slots: 3 (decreased from 5)
  status: "open" or "guaranteed" (recalculated)

payments:
  status: "refunded"
```

---

## Debugging Tips

### 1. Check if booking exists
```sql
SELECT id, trang_thai, cancelled_at, refund_amount 
FROM bookings 
WHERE id = 42;
```

### 2. Check tour schedule
```sql
SELECT id, booked_slots, max_slots, available_slots 
FROM tour_schedules 
WHERE id = (SELECT schedule_id FROM bookings WHERE id = 42);
```

### 3. Check payment
```sql
SELECT id, status 
FROM payments 
WHERE booking_id = 42;
```

### 4. Check for transaction issues
```sql
-- If transaction failed, check if booking has conflicting state
SELECT * FROM bookings 
WHERE id = 42 
AND trang_thai NOT IN ('pending', 'confirmed', 'cancelled');
```

---

**All endpoints require:** Bearer token authentication

**Timezone:** All dates in UTC+0 (ISO 8601 format)

**Rate Limiting:** No limit set (implement if needed)
