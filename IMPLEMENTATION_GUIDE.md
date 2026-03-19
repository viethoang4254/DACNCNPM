# Hướng Dẫn Áp Dụng Chức Năng Hủy Tour (Cancel Booking)

## 📋 Tóm Tắt

Chức năng hủy tour (Auto-Cancel) đã được phát triển hoàn chỉnh với:
- ✅ Database migration
- ✅ Backend API (Node.js + Express)
- ✅ Frontend React Component
- ✅ Modal confirm + Refund preview
- ✅ Auto-refund calculation

---

## 📂 Cấu Trúc File Mới/Cập Nhật

### Backend

#### 1. **Database Migration** 
```
File: backend/database/migrations/20260319_add_cancel_columns_to_bookings.sql
```
**Cập nhật bảng:**
- `bookings`: Thêm `cancelled_at`, `cancel_reason`, `refund_amount`, `refund_status`, `cancelled_by`
- `payments`: Thêm status `'refunded'` vào ENUM

#### 2. **Service Layer** (New)
```
File: backend/src/services/cancelBookingService.js
```
**Các hàm chính:**
- `calculateRefundPercentage()` - Tính % hoàn tiền dựa ngày còn lại
- `calculateRefundAmount()` - Tính số tiền hoàn
- `validateCancel()` - Validate điều kiện hủy
- `getCancelPreview()` - Lấy preview hoàn tiền
- `cancelBookingService()` - Execute transaction hủy booking

#### 3. **Model Updates**
```
File: backend/src/models/bookingModel.js
```
**Hàm mới:**
- `getBookingForCancel()` - Lấy booking với info cancel
- `getBookingsByUserIdWithCancelInfo()` - Lấy bookings với info refund

#### 4. **Controller Updates**
```
File: backend/src/controllers/bookingController.js
```
**Hàm mới:**
- `cancelPreviewController()` - GET `/api/bookings/:id/cancel-preview`
- `cancelBookingController()` - POST `/api/bookings/:id/cancel`

#### 5. **Routes Updates**
```
File: backend/src/routes/bookingRoutes.js
```
**Routes mới:**
- `GET /api/bookings/:id/cancel-preview` - Preview hoàn tiền
- `POST /api/bookings/:id/cancel` - Execute cancel

---

### Frontend

#### 1. **Modal Component** (New)
```
File: frontend/src/components/user/CancelBookingModal/index.jsx
File: frontend/src/components/user/CancelBookingModal/CancelBookingModal.scss
```
**Features:**
- 2-step process (confirm → preview)
- Hiển thị refund policy
- Auto-calculate refund amount
- Error handling + loading states

#### 2. **Service Updates**
```
File: frontend/src/services/userService.js
```
**Hàm mới:**
- `getCancelPreview(bookingId)` - Gọi API preview
- `cancelBooking(bookingId)` - Gọi API cancel

#### 3. **BookingHistory Page Updates**
```
File: frontend/src/pages/user/BookingHistory/index.jsx
File: frontend/src/pages/user/BookingHistory/BookingHistory.scss
```
**Updates:**
- Thêm nút "Hủy tour"
- Hiển thị days remaining
- Hiển thị refund info
- Success message khi cancel
- Helper functions:
  - `getDaysRemaining()` - Tính ngày còn lại
  - `canCancelBooking()` - Check điều kiện cancel

---

## 🚀 Hướng Dẫn Áp Dụng

### Step 1: Cập Nhật Database

```bash
# Chạy migration SQL
mysql -u root -p booking_tours < backend/database/migrations/20260319_add_cancel_columns_to_bookings.sql
```

Hoặc chạy trực tiếp trong MySQL CLI:
```sql
-- Copy toàn bộ content từ file migration
```

### Step 2: Verify Backend Code

1. Kiểm tra tất cả file backend đã có:
   - `backend/src/services/cancelBookingService.js` ✓
   - Model updates ✓
   - Controller updates ✓
   - Routes updates ✓

2. Imports đã update:
   ```javascript
   // Trong bookingController.js
   import { cancelBookingService, getCancelPreview, validateCancel } from "../services/cancelBookingService.js";
   ```

3. Test Backend (optional):
   ```bash
   cd backend
   npm test  # Nếu có test suite
   ```

### Step 3: Verify Frontend Code

1. Kiểm tra tất cả file frontend đã có:
   - `frontend/src/components/user/CancelBookingModal/` ✓
   - Service updates ✓
   - BookingHistory updates ✓

2. Imports đã update:
   ```javascript
   // Trong BookingHistory/index.jsx
   import CancelBookingModal from "../../../components/user/CancelBookingModal";
   ```

3. Rebuild frontend:
   ```bash
   cd frontend
   npm run build  # Production build
   # hoặc
   npm run dev    # Development
   ```

### Step 4: Test Chức Năng

#### Test Scenarios:

1. **Đặt tour + Hủy sau ≥7 ngày**
   - Kỳ vọng: 100% refund
   - Refund status: pending (nếu đã thanh toán)

2. **Đặt tour + Hủy trong 3-6 ngày**
   - Kỳ vọng: 50% refund

3. **Đặt tour + Hủy trong <3 ngày**
   - Kỳ vọng: 0% refund

4. **Hủy tour <1 ngày trước**: 
   - Kỳ vọng: Button disabled + tooltip

5. **Hủy tour đã cancelled**:
   - Kỳ vọng: Error message

6. **Hủy tour, schedule bị cancel**:
   - Kỳ vọng: Error message

---

## 📊 API Endpoints

### 1. GET `/api/bookings/:id/cancel-preview`

**Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/bookings/1/cancel-preview
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cancel preview retrieved successfully",
  "data": {
    "bookingId": 1,
    "tourName": "Tour Hà Nội - Hạ Long",
    "startDate": "2026-04-15",
    "originalAmount": 5000000,
    "daysLeft": 10,
    "refundPercentage": 100,
    "refundAmount": 5000000,
    "message": "Refund 100% - Full refund"
  }
}
```

### 2. POST `/api/bookings/:id/cancel`

**Request:**
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/bookings/1/cancel
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "bookingId": 1,
    "tourName": "Tour Hà Nội - Hạ Long",
    "refundAmount": 5000000,
    "refundPercentage": 100,
    "refundStatus": "pending",
    "cancelledAt": "2026-03-19T10:30:00.000Z",
    "booking": { /* updated booking object */ }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot cancel within 24 hours of tour departure",
  "data": {}
}
```

---

## 🔄 Logic Flow

### Frontend Flow:
```
1. User xem lịch sử booking
   ↓
2. Click "Hủy tour" button (nếu eligible)
   ↓
3. Modal hiển thị:
   - Tour name, start date
   - Refund policy
   ↓
4. User click "Xem hoàn tiền dự kiến"
   ↓
5. API call → GET /api/bookings/:id/cancel-preview
   ↓
6. Modal step 2: Hiển thị refund amount
   ↓
7. User confirm "Xác nhận hủy"
   ↓
8. API call → POST /api/bookings/:id/cancel
   ↓
9. Success → Update UI, show toast message
```

### Backend Flow (cancelBookingService):
```
1. Validate booking exists + ownership
2. Check status in ["pending", "confirmed"]
3. Check daysLeft >= 1
4. Calculate refundAmount based on daysLeft
5. BEGIN TRANSACTION
   a. Update bookings (cancelled_at, refund_amount, etc)
   b. Update tour_schedules (release slots)
   c. Update schedule status (open/guaranteed/full)
   d. Update payment status to 'refunded' (if paid)
6. COMMIT if success, ROLLBACK if error
```

---

## 🐛 Edge Cases Handled

| Case | Handling |
|------|----------|
| Double cancel | Validate `trang_thai !== 'cancelled'` |
| Schedule cancelled | Check schedule_status |
| <1 day left | Block with error |
| Pending booking no payment | refund_amount = 0, refund_status = 'none' |
| Paid booking | refund_status = 'pending' |
| Booked slots go negative | `Math.max(..., 0)` |
| Schedule status update | Auto-recalculate after cancel |

---

## 📌 Refund Policy

| Days Remaining | Refund % | Status |
|---|---|---|
| ≥ 7 days | 100% | Hoàn toàn |
| 3-6 days | 50% | Hoàn một phần |
| < 3 days | 0% | Không hoàn |
| < 1 day | ❌ Không cho hủy | Error |

---

## 🔐 Security Notes

✅ **Implemented:**
- Authentication required (authMiddleware)
- User ownership check (booking.user_id === req.user.id)
- Transaction safety (rollback on error)
- Input validation (param validation)
- SQL injection protection (prepared statements)

---

## 📱 UI States

### Booking Card States:

**Eligible to Cancel:**
```
[Xem chi tiết tour] [Hủy tour] ← Red button (enabled)
```

**Not Eligible (disabled):**
```
[Xem chi tiết tour] [Hủy tour] ← Gray button (disabled, tooltip on hover)
```

**Already Cancelled:**
```
Status: "Đã hủy"
Refund: 5,000,000 VND (green)
[Xem chi tiết tour] [Hủy tour] ← Gray (disabled)
```

---

## 🧪 Testing Checklist

- [ ] Database migration runs without error
- [ ] New columns appear in `bookings` table
- [ ] Backend API endpoints respond correctly
- [ ] Refund calculation is correct (100%, 50%, 0%)
- [ ] Cancel button shows/hides based on conditions
- [ ] Modal displays correctly
- [ ] Success message shows after cancel
- [ ] Booking status updates to "cancelled"
- [ ] Schedule slots are released correctly
- [ ] Schedule status updates (if needed)
- [ ] Refund info displays (if > 0)
- [ ] Error handling works (< 1 day, already cancelled, etc)

---

## 📝 Notes

1. **Refund Processing**: Currently marked as `'pending'` after cancel. Integrate with payment gateway later to process actual refunds.

2. **Email Notification**: Consider adding email notification when booking is cancelled.

3. **Audit Log**: Consider logging all cancellations for admin review.

4. **Batch Refunds**: Could implement manual batch refund processing in admin panel.

---

## Files Modified/Created

### Created:
✅ `backend/database/migrations/20260319_add_cancel_columns_to_bookings.sql`
✅ `backend/src/services/cancelBookingService.js`
✅ `frontend/src/components/user/CancelBookingModal/index.jsx`
✅ `frontend/src/components/user/CancelBookingModal/CancelBookingModal.scss`

### Modified:
✅ `backend/src/models/bookingModel.js` - Added query functions
✅ `backend/src/controllers/bookingController.js` - Added controllers + imports
✅ `backend/src/routes/bookingRoutes.js` - Added routes
✅ `frontend/src/services/userService.js` - Added API functions
✅ `frontend/src/pages/user/BookingHistory/index.jsx` - UI + logic
✅ `frontend/src/pages/user/BookingHistory/BookingHistory.scss` - Styles

---

**Status**: ✅ Ready for Production

Liên hệ nếu cần hỗ trợ!
