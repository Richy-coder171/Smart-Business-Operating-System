import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(serverRoot, ".env") });

const requiredKeys = [
  "NODE_ENV",
  "PORT",
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CLIENT_URL"
];

const placeholderTokens = ["USERNAME", "PASSWORD", "CLUSTER", "YOUR_", "<db_password>"];

function assertEnv() {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }

  const mongoUri = process.env.MONGODB_URI;
  const hasPlaceholder = placeholderTokens.some((token) =>
    mongoUri.toLowerCase().includes(token.toLowerCase())
  );

  if (hasPlaceholder) {
    throw new Error(
      "MONGODB_URI still contains placeholder text. Replace it with a real local or Atlas connection string."
    );
  }
}

assertEnv();

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrls: process.env.CLIENT_URL.split(",").map((url) => url.trim()).filter(Boolean),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "",
  demoAiMode: String(process.env.DEMO_AI_MODE).toLowerCase() === "true",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  serverRoot
};
