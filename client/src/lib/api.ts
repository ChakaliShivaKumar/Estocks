import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies for authentication
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle standardized API responses
    if (response.data && typeof response.data === "object" && "success" in response.data) {
      if (response.data.success && response.data.data) {
        return { ...response, data: response.data.data };
      }
      if (!response.data.success && response.data.error) {
        const error = new Error(response.data.error.message || "API Error");
        (error as any).code = response.data.error.code;
        (error as any).details = response.data.error.details;
        return Promise.reject(error);
      }
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      const networkError = new Error("Network error. Please check your connection.");
      return Promise.reject(networkError);
    }

    // Handle API errors
    const status = error.response.status;
    const data = error.response.data as any;

    let errorMessage = "An error occurred";

    if (data?.error) {
      if (typeof data.error === "string") {
        errorMessage = data.error;
      } else if (data.error?.message) {
        errorMessage = data.error.message;
      }
    } else if (data?.message) {
      errorMessage = data.message;
    }

    const apiError = new Error(errorMessage);
    (apiError as any).status = status;
    (apiError as any).code = data?.error?.code || `HTTP_${status}`;
    (apiError as any).details = data?.error?.details;

    // Handle specific status codes
    if (status === 401) {
      // Unauthorized - redirect to login
      window.location.href = "/login";
    } else if (status === 403) {
      // Forbidden
      apiError.message = "You don't have permission to perform this action.";
    } else if (status === 404) {
      apiError.message = "Resource not found.";
    } else if (status === 429) {
      apiError.message = "Too many requests. Please try again later.";
    } else if (status >= 500) {
      apiError.message = "Server error. Please try again later.";
    }

    return Promise.reject(apiError);
  }
);

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

// Helper function to check if error is an ApiError
export function isApiError(error: any): error is ApiError {
  return error instanceof Error && ("status" in error || "code" in error);
}

export default apiClient;

