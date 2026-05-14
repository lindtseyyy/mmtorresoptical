import axios from 'axios';

// 🎯 Define your base URL here
// Use environment variables (VITE_API_BASE_URL, REACT_APP_API_BASE_URL, etc.) 
// for switching between development, staging, and production environments.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// 1. Create a custom instance of Axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Optional: Set a request timeout (e.g., 10 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Add an Interceptor to automatically attach the Auth Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // 💡 If a token exists, add the Authorization header to EVERY request
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response interceptor — redirect to login on expired/invalid JWT, extract server errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const serverMessage = error.response?.data;
    if (serverMessage) {
      if (typeof serverMessage === "string") {
        error.message = serverMessage;
      } else if (typeof serverMessage === "object") {
        const messages = Object.values(serverMessage).flat().join(", ");
        if (messages) error.message = messages;
      }
    }

    return Promise.reject(error);
  }
);

export default api;