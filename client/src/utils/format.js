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

export function statusText(error) {
  if (!error) return "";
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === "ECONNABORTED") return "Request timed out. Please retry.";
  return "Backend is unavailable. Please check the server.";
}
