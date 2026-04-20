import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  createPopupBannerService,
  deletePopupBannerService,
  getActivePopupBannerService,
  getAdminPopupBannersService,
  togglePopupBannerService,
  updatePopupBannerService,
} from "../services/popupBannerService.js";

export const getAdminPopupBannersController = asyncHandler(async (req, res) => {
  const result = await getAdminPopupBannersService();
  return sendResponse(res, result);
});

export const getActivePopupBannerController = asyncHandler(async (req, res) => {
  const result = await getActivePopupBannerService({
    authorizationHeader: req.headers.authorization || "",
  });
  return sendResponse(res, result);
});

export const createPopupBannerController = asyncHandler(async (req, res) => {
  const result = await createPopupBannerService({ payload: req.body });
  return sendResponse(res, result);
});

export const updatePopupBannerController = asyncHandler(async (req, res) => {
  const result = await updatePopupBannerService({
    id: Number(req.params.id),
    payload: req.body,
  });
  return sendResponse(res, result);
});

export const deletePopupBannerController = asyncHandler(async (req, res) => {
  const result = await deletePopupBannerService({ id: Number(req.params.id) });
  return sendResponse(res, result);
});

export const togglePopupBannerController = asyncHandler(async (req, res) => {
  const result = await togglePopupBannerService({ id: Number(req.params.id) });
  return sendResponse(res, result);
});
