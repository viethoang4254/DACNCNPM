// import express from "express";
// import { OrdersController } from "@paypal/paypal-server-sdk";
// import client from "../utils/paypalClient.js";

// const router = express.Router();
// const ordersController = new OrdersController(client);

// // PayPal needs absolute return/cancel URLs.
// // In production, set FRONTEND_URL. In local dev, we can derive it from the request origin.
// const FALLBACK_FRONTEND_BASE_URL = process.env.FRONTEND_URL || "http://localhost:5073";

// function getFrontendBaseUrl(req) {
//   if (process.env.FRONTEND_URL) {
//     return process.env.FRONTEND_URL;
//   }

//   const origin = req.get("origin");
//   if (origin) {
//     try {
//       return new URL(origin).origin;
//     } catch {
//       // ignore invalid origin
//     }
//   }

//   const referer = req.get("referer");
//   if (referer) {
//     try {
//       return new URL(referer).origin;
//     } catch {
//       // ignore invalid referer
//     }
//   }

//   return FALLBACK_FRONTEND_BASE_URL;
// }

// function getErrorMessage(error, fallbackMessage) {
//   const detail =
//     error?.result?.details?.[0]?.description ||
//     error?.result?.message ||
//     error?.message;
//   return detail || fallbackMessage;
// }

// router.post("/create", async (req, res) => {
//   try {
//     const frontendBaseUrl = getFrontendBaseUrl(req);
//     const { amount, bookingId } = req.body;

//     const parsedAmount = Number(amount);
//     const parsedBookingId = Number(bookingId);
//     if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
//       return res.status(400).json({ message: "amount không hợp lệ" });
//     }

//     if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
//       return res.status(400).json({ message: "bookingId không hợp lệ" });
//     }

//     const response = await ordersController.createOrder({
//       body: {
//         intent: "CAPTURE",
//         purchaseUnits: [
//           {
//             referenceId: String(parsedBookingId),
//             amount: {
//               currencyCode: "USD",
//               value: parsedAmount.toFixed(2),
//             },
//           },
//         ],
//         applicationContext: {
//           returnUrl: `${frontendBaseUrl}/paypal-success?bookingId=${parsedBookingId}&orderId=${responseBody.id}`,
//           //returnUrl: `${frontendBaseUrl}/paypal-success?bookingId=${parsedBookingId}`,
//           cancelUrl: `${frontendBaseUrl}/paypal-cancel?bookingId=${parsedBookingId}`,
//         },
//       },
//     });

//     const responseBody = response?.result || response;
//     const approvalUrl = responseBody?.links?.find((l) => l.rel === "approve")?.href;

//     if (!approvalUrl) {
//       return res.status(502).json({ message: "Không lấy được approvalUrl từ PayPal" });
//     }

//     res.json({
//       orderId: responseBody?.id,
//       approvalUrl,
//     });

//   } catch (err) {
//     console.error("[paypal/create]", err);
//     const statusCode = Number(err?.statusCode || err?.statusCodeNumber || 500);
//     res.status(Number.isInteger(statusCode) ? statusCode : 500).json({
//       message: getErrorMessage(err, "PayPal create error"),
//     });
//   }
// });

// router.post("/capture", async (req, res) => {
//   try {
//     const { orderId } = req.body;

//     if (!orderId || typeof orderId !== "string") {
//       return res.status(400).json({ message: "orderId không hợp lệ" });
//     }

//     const response = await ordersController.captureOrder({
//       id: orderId,
//     });

//     res.json(response?.result || response);

//   } catch (err) {
//     console.error("[paypal/capture]", err);
//     const statusCode = Number(err?.statusCode || err?.statusCodeNumber || 500);
//     res.status(Number.isInteger(statusCode) ? statusCode : 500).json({
//       message: getErrorMessage(err, "PayPal capture error"),
//     });
//   }
// });
// router.get("/test", async (req, res) => {
//   res.send("PayPal route OK");
// });

// export default router;

import express from "express";
import { OrdersController } from "@paypal/paypal-server-sdk";
import client from "../utils/paypalClient.js";

const router = express.Router();
const ordersController = new OrdersController(client);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5073";

function getErrorMessage(error, fallback) {
  return (
    error?.result?.details?.[0]?.description ||
    error?.result?.message ||
    error?.message ||
    fallback
  );
}

//
// ✅ CREATE ORDER
//
router.post("/create", async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    const parsedAmount = Number(amount);
    const parsedBookingId = Number(bookingId);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "amount không hợp lệ" });
    }

    if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
      return res.status(400).json({ message: "bookingId không hợp lệ" });
    }

    const response = await ordersController.createOrder({
      body: {
        intent: "CAPTURE",
        purchaseUnits: [
          {
            referenceId: String(parsedBookingId),
            amount: {
              currencyCode: "USD",
              value: parsedAmount.toFixed(2),
            },
          },
        ],
        applicationContext: {
          // ✅ CHUẨN: có bookingId, KHÔNG cần orderId
          returnUrl: `${FRONTEND_URL}/paypal-success?bookingId=${parsedBookingId}`,
          cancelUrl: `${FRONTEND_URL}/paypal-cancel?bookingId=${parsedBookingId}`,
        },
      },
    });

    const data = response.result;

    const approvalUrl = data.links.find(
      (l) => l.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      return res.status(500).json({ message: "Không lấy được approvalUrl" });
    }

    res.json({
      orderId: data.id, // dùng cho debug
      approvalUrl,
    });
  } catch (err) {
    console.error("[paypal/create]", err);
    res.status(500).json({
      message: getErrorMessage(err, "PayPal create error"),
    });
  }
});

//
// ✅ CAPTURE ORDER
//
router.post("/capture", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Thiếu orderId" });
    }

    console.log("CAPTURE orderId:", orderId);

    const response = await ordersController.captureOrder({
      id: orderId,
    });

    const result = response.result;

    res.json({
      status: result.status, // COMPLETED
    });
  } catch (err) {
    console.error("[paypal/capture]", err);
    res.status(500).json({
      message: getErrorMessage(err, "Capture thất bại"),
    });
  }
});

export default router;