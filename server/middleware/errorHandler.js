import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      details: error.flatten()
    });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      details: Object.values(error.errors).map((entry) => entry.message)
    });
  }

  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists."
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid identifier."
    });
  }

  if (process.env.NODE_ENV !== "test") {
    console.error(error.message);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error."
  });
}
