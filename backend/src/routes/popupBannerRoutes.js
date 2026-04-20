import express from "express";
import { getActivePopupBannerController } from "../controllers/popupBannerController.js";

const router = express.Router();

router.get("/popup-banner", getActivePopupBannerController);

export default router;
