import { isDbConnected } from "../config/db.js";

export function requireDb(req, res, next) {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: "Database is unavailable. Check MongoDB connection and retry."
    });
  }
  return next();
}
