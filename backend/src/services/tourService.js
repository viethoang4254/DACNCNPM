import { getTours } from "../models/tourModel.js";

export const getToursService = async (query) => {
  return getTours(query);
};
