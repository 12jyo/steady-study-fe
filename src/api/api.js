import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000",
});


API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Add a response interceptor to handle forced logout from device
API.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response &&
      error.response.status === 401 &&
      (
        error.response.data?.message === "Logged out from this device" ||
        error.response.data?.message === "Invalid token"
      )
    ) {
      // Clear all credentials and device info
      localStorage.clear();
      // Set a global flag and reason to show forced logout modal
      window.__SHOW_FORCED_LOGOUT_MODAL__ = true;
      window.__FORCED_LOGOUT_REASON__ = error.response.data?.message;
      // Trigger a re-render (for SPA, you may want to use a better state mechanism)
      window.dispatchEvent(new Event("forced-logout"));
    }
    return Promise.reject(error);
  }
);

export default API;