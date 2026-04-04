import express from "express";
import cors from "cors";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import tourRoutes from "./routes/tourRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import popupBannerRoutes from "./routes/popupBannerRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFoundHandler from "./middlewares/notFoundHandler.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

// Step 1: Gzip/Brotli-compatible compression for JSON/API + text/static responses.
// This reduces payload size and improves TTFB on slower networks.
app.use(
	compression({
		threshold: 1024,
		level: 6,
	}),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Step 2: Enable cache-control for static assets under /uploads.
// - Images/fonts: long-lived immutable cache for repeat visits.
// - Other files: shorter cache to stay safe for frequently updated files.
app.use(
	"/uploads",
	express.static(path.resolve(__dirname, "..", "uploads"), {
		maxAge: "7d",
		setHeaders: (res, filePath) => {
			const ext = path.extname(filePath).toLowerCase();
			const isHashedStatic = [
				".js",
				".css",
				".png",
				".jpg",
				".jpeg",
				".gif",
				".webp",
				".svg",
				".avif",
				".ico",
				".woff",
				".woff2",
			].includes(ext);

			if (isHashedStatic) {
				res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
				return;
			}

			res.setHeader("Cache-Control", "public, max-age=604800");
		},
	}),
);

app.get("/api/health", (req, res) => {
	// Dynamic health endpoint should not be cached by proxies/CDN.
	res.setHeader("Cache-Control", "no-store");
	res.status(200).json({
		success: true,
		message: "Server is running",
		data: {},
	});
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", popupBannerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;