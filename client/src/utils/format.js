export function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

export function formatIntent(value) {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function statusText(error) {
  if (!error) return "";
  const fieldErrors = error.response?.data?.details?.fieldErrors;
  if (fieldErrors) {
    const first = Object.values(fieldErrors).flat().filter(Boolean)[0];
    if (first) return first;
  }
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === "ECONNABORTED") return "Request timed out. Please retry.";
  return "Backend is unavailable. Please check the server.";
}
