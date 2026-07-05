import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { loginSchema, registerSchema } from "../validators/authValidators.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookies.js";

function publicUser(user) {
  const data = typeof user.toJSON === "function" ? user.toJSON() : user;
  delete data.passwordHash;
  return data;
}

export const register = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const existing = await User.findOne({ email: payload.email });

  if (existing) {
    throw new ApiError(409, "Email is already registered.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    name: payload.name,
    businessName: payload.businessName,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    preferredLanguage: payload.preferredLanguage
  });

  setAuthCookie(res, user._id);

  res.status(201).json({
    success: true,
    user: publicUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await User.findOne({ email: payload.email }).select("+passwordHash");

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const ok = await bcrypt.compare(payload.password, user.passwordHash);
  if (!ok) {
    throw new ApiError(401, "Invalid email or password.");
  }

  setAuthCookie(res, user._id);

  res.json({
    success: true,
    user: publicUser(user)
  });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: "Logged out."
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: publicUser(req.user)
  });
});
