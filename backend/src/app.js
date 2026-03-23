import express from "express";
import cors from "cors";
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
import errorHandler from "./middlewares/errorHandler.js";
import notFoundHandler from "./middlewares/notFoundHandler.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => {
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
app.use("/api/booking", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;