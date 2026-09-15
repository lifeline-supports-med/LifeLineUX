// Central axios instance for the LifeLine .NET 9 API.
// - Adds Authorization: Bearer <access token> automatically.
// - Unwraps the universal ApiResponse<T> envelope into plain T (throws ApiError on !isSuccess).
// - Single-flight refresh via /auth/refresh-token on 401; one retry of the original request.
// - Surfaces 429 with toast + the Retry-After hint.
// - 422 validation errors are flattened into ApiError.fieldErrors.

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokens";
import type { ApiResponse, AuthSession } from "./types";

export class ApiError extends Error {
  status: number;
  fieldErrors?: string[];
  constructor(message: string, status: number, fieldErrors?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error("VITE_API_BASE_URL is not configured.");
}

export const http: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 120000, // 30 seconds — a stalled request now fails loudly instead of hanging forever
});

// ────────────────────────── Request: attach bearer ──────────────────────────
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ────────────────────────── Response: refresh + errors ──────────────────────
let isRefreshing = false;
let refreshWaiters: Array<(token: string | null) => void> = [];

function notifyWaiters(token: string | null) {
  refreshWaiters.forEach((cb) => cb(token));
  refreshWaiters = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await axios.post<ApiResponse<AuthSession>>(
      `${baseURL}/auth/refresh-token`,
      { accessToken, refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    if (res.data?.isSuccess && res.data.data) {
      setTokens(res.data.data);
      return res.data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const envelope = error.response?.data;

    // 401 → try refresh once, then retry the original request.
    if (status === 401 && original && !original._retry && !original.url?.includes("/auth/refresh-token")) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshWaiters.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${token}`;
            resolve(http(original));
          });
        });
      }
      isRefreshing = true;
      try {
        const token = await refreshAccessToken();
        isRefreshing = false;
        notifyWaiters(token);
        if (!token) {
          clearTokens();
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            window.location.href = "/login";
          }
          throw new ApiError(
            envelope?.message || "Your session has expired. Please log in again.",
            401,
          );
        }
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      } catch (e) {
        isRefreshing = false;
        notifyWaiters(null);
        throw e;
      }
    }

    // 429 → toast with Retry-After.
    if (status === 429) {
      const retryAfter = error.response?.headers?.["retry-after"];
      toast.error(
        `Too many attempts. Please wait ${retryAfter ?? "a moment"}${retryAfter ? "s" : ""} and try again.`,
      );
    }

    const message =
      envelope?.message ||
      (Array.isArray(envelope?.errors) && envelope.errors[0]) ||
      error.message ||
      "Request failed.";
    throw new ApiError(message, status ?? 0, envelope?.errors ?? undefined);
  },
);

// ─────────────────────── Envelope unwrap helpers ────────────────────────────
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.get<ApiResponse<T>>(url, config);
  return unwrap(res.data);
}
export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.post<ApiResponse<T>>(url, body, config);
  return unwrap(res.data);
}
export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.put<ApiResponse<T>>(url, body, config);
  return unwrap(res.data);
}
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.delete<ApiResponse<T>>(url, config);
  return unwrap(res.data);
}

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (!envelope || envelope.isSuccess === false) {
    throw new ApiError(
      envelope?.message || "Request failed.",
      envelope?.statusCode ?? 0,
      envelope?.errors ?? undefined,
    );
  }
  return envelope.data as T;
}
