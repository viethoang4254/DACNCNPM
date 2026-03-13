import express from "express";
import { body, param, query } from "express-validator";
import {
  addTourImagesController,
  createTourController,
  createTourScheduleController,
  deleteTourImageController,
  deleteTourScheduleController,
  deleteTourController,
  filterToursController,
  getFeaturedToursController,
  getLatestToursController,
  getTourByIdController,
  getTourImagesController,
  getTourItinerariesController,
  getTourReviewsController,
  getTourSchedulesController,
  getToursController,
  getSimilarToursController,
  searchToursController,
  setTourCoverImageController,
  updateTourController,
  updateTourImageController,
  updateTourScheduleController,
} from "../controllers/tourController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import validationMiddleware from "../middlewares/validateMiddleware.js";

const router = express.Router();

const tourBodyValidation = [
  body("ten_tour").trim().notEmpty().withMessage("ten_tour is required"),
  body("mo_ta").optional().isString().withMessage("mo_ta must be a string"),
  body("gia").isFloat({ gt: 0 }).withMessage("gia must be greater than 0"),
  body("tinh_thanh").trim().notEmpty().withMessage("tinh_thanh is required"),
  body("diem_khoi_hanh").trim().notEmpty().withMessage("diem_khoi_hanh is required"),
  body("phuong_tien").trim().notEmpty().withMessage("phuong_tien is required"),
  body("so_ngay").isInt({ gt: 0 }).withMessage("so_ngay must be a positive integer"),
  body("so_nguoi_toi_da").isInt({ gt: 0 }).withMessage("so_nguoi_toi_da must be a positive integer"),
];

const scheduleValidation = [
  body("start_date").isISO8601().withMessage("start_date must be a valid date"),
  body("available_slots").isInt({ min: 0 }).withMessage("available_slots must be >= 0"),
];

router.get(
  "/",
  [
    query("page").optional().isInt({ gt: 0 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ gt: 0 }).withMessage("limit must be a positive integer"),
    query("search").optional().isString(),
    query("keyword").optional().isString(),
    query("tinh_thanh").optional().isString(),
    query("diem_khoi_hanh").optional().isString(),
    query("price").optional().isIn(["under-2", "2-5", "5-10", "over-10"]).withMessage("price is invalid"),
    query("duration").optional().isIn(["1-3", "4-7", "over-7"]).withMessage("duration is invalid"),
    query("minPrice").optional().isFloat({ min: 0 }).withMessage("minPrice must be >= 0"),
    query("maxPrice").optional().isFloat({ min: 0 }).withMessage("maxPrice must be >= 0"),
    query("sort")
      .optional()
      .isIn([
        "newest",
        "price_asc",
        "price_desc",
        "price",
        "-price",
        "latest",
        "gia_asc",
        "gia_desc",
        "created_at_desc",
        "ten_tour_asc",
      ])
      .withMessage("sort is invalid"),
    query("minDays").optional().isInt({ min: 1 }).withMessage("minDays must be >= 1"),
    query("maxDays").optional().isInt({ min: 1 }).withMessage("maxDays must be >= 1"),
  ],
  validationMiddleware,
  getToursController
);

router.get("/search", validationMiddleware, searchToursController);
router.get("/filter", validationMiddleware, filterToursController);
router.get("/featured", getFeaturedToursController);
router.get("/latest", getLatestToursController);
router.get(
  "/similar/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getSimilarToursController
);
router.get(
  "/:id/reviews",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getTourReviewsController
);

router.get(
  "/:id/images",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getTourImagesController
);

router.post(
  "/:id/images",
  authMiddleware,
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  upload.array("images", 10),
  addTourImagesController
);

router.delete(
  "/images/:id",
  authMiddleware,
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  deleteTourImageController
);

router.put(
  "/images/:id/cover",
  authMiddleware,
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  setTourCoverImageController
);

router.put(
  "/images/:id",
  authMiddleware,
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  upload.single("image"),
  validationMiddleware,
  updateTourImageController
);

router.get(
  "/:id/schedules",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getTourSchedulesController
);

router.get(
  "/:id/itineraries",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getTourItinerariesController
);

router.post(
  "/:id/schedules",
  authMiddleware,
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer"), ...scheduleValidation],
  validationMiddleware,
  createTourScheduleController
);

router.put(
  "/schedules/:id",
  authMiddleware,
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer"), ...scheduleValidation],
  validationMiddleware,
  updateTourScheduleController
);

router.delete(
  "/schedules/:id",
  authMiddleware,
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  deleteTourScheduleController
);

router.get(
  "/:id",
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  getTourByIdController
);

router.post("/", authMiddleware, adminMiddleware, tourBodyValidation, validationMiddleware, createTourController);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer"), ...tourBodyValidation],
  validationMiddleware,
  updateTourController
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  [param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer")],
  validationMiddleware,
  deleteTourController
);

export default router;
