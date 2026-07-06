import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 15000
});

api.interceptors.response.use((response) => {
  const method = response.config?.method?.toLowerCase();
  const url = response.config?.url || "";
  const mutatesData = ["post", "put", "patch", "delete"].includes(method);
  const authOnly = url.startsWith("/auth/");

  if (mutatesData && !authOnly && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("smeos:data-mutated", { detail: { method, url } }));
  }

  return response;
});

export default api;
