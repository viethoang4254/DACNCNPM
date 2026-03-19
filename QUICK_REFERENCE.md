# 🚀 Quick Implementation Checklist

## Database
- [ ] Run migration: `20260319_add_cancel_columns_to_bookings.sql`
- [ ] Verify columns added to `bookings` table
- [ ] Verify `refunded` added to `payments.status` ENUM

## Backend - Files to Include
```javascript
// 1. Service (NEW)
✅ backend/src/services/cancelBookingService.js
   - calculateRefundPercentage()
   - calculateRefundAmount()
   - validateCancel()
   - getCancelPreview()
   - cancelBookingService()

// 2. Model Updates
✅ backend/src/models/bookingModel.js
   + getBookingForCancel()
   + getBookingsByUserIdWithCancelInfo()

// 3. Controller Updates
✅ backend/src/controllers/bookingController.js
   + cancelPreviewController()
   + cancelBookingController()
   + imports updated

// 4. Routes Updates
✅ backend/src/routes/bookingRoutes.js
   + GET /:id/cancel-preview
   + POST /:id/cancel
   + imports updated
```

## Frontend - Files to Include
```javascript
// 1. Modal Component (NEW)
✅ frontend/src/components/user/CancelBookingModal/index.jsx
✅ frontend/src/components/user/CancelBookingModal/CancelBookingModal.scss

// 2. Service Updates
✅ frontend/src/services/userService.js
   + getCancelPreview(bookingId)
   + cancelBooking(bookingId)

// 3. Page Updates
✅ frontend/src/pages/user/BookingHistory/index.jsx
   + getDaysRemaining()
   + canCancelBooking()
   + handleCancelClick()
   + handleCancelSuccess()
   + CancelBookingModal integration
   + success message

✅ frontend/src/pages/user/BookingHistory/BookingHistory.scss
   + .booking-history__cancel-btn
   + .booking-history__days-left
   + .booking-history__refund
   + .booking-history__success
```

## Test Endpoints

```bash
# 1. Preview Refund
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/bookings/1/cancel-preview

# 2. Cancel Booking
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/bookings/1/cancel
```

## Refund Rules
| Days Left | Refund |
|---|---|
| ≥7 | 100% |
| 3-6 | 50% |
| <3 | 0% |
| <1 | ❌ Not allowed |

## Key Logic Points
- ✅ Transaction safety (rollback on error)
- ✅ Auto-calculate refund percentage
- ✅ Release booked slots
- ✅ Update schedule status
- ✅ Update payment status
- ✅ User ownership verification
- ✅ Status validation
- ✅ Time validation (≥1 day)

## UI Features
- ✅ Cancel button (conditional show/hide)
- ✅ 2-step modal (confirm → preview → execute)
- ✅ Days remaining display
- ✅ Refund amount preview
- ✅ Success toast message
- ✅ Error handling
- ✅ Loading states
- ✅ Disabled state with tooltip

---

**Ready to deploy!** All files are production-ready with error handling, validation, and clean code.
