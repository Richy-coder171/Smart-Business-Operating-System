import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "smeos_token";

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

export function setAuthCookie(res, userId) {
  res.cookie(AUTH_COOKIE_NAME, signToken(userId), cookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...cookieOptions(),
    maxAge: undefined
  });
}
