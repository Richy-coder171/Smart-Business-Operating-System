import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { isDbConnected } from "../config/db.js";
import { AUTH_COOKIE_NAME } from "../utils/authCookies.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    if (!isDbConnected()) {
      throw new ApiError(503, "Database is unavailable. Authentication cannot be checked.");
    }

    const bearer = req.get("authorization")?.startsWith("Bearer ")
      ? req.get("authorization").slice(7)
      : null;
    const token = req.cookies?.[AUTH_COOKIE_NAME] || bearer;

    if (!token) {
      throw new ApiError(401, "Authentication required.");
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user) {
      throw new ApiError(401, "Authentication required.");
    }

    req.user = user;
    req.ownerId = user._id;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Authentication required."));
    }
    return next(error);
  }
}
