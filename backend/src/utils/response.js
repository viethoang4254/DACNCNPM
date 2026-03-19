export const sendResponse = (
  res,
  { statusCode = 200, success = true, message = "Success", data = {}, pagination }
) => {
  const payload = {
    success,
    message,
    data,
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
};
