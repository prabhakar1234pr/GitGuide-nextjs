import { getAuthHeaders } from "./api-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Sync user from Clerk to Supabase
 * Called automatically when user logs in
 * @param role - Optional role (manager | employee) from sign-up flow
 */
export async function syncUser(role?: "manager" | "employee") {
  try {
    const headers = await getAuthHeaders();

    const body = role ? JSON.stringify({ role }) : undefined;
    const response = await fetch(`${API_URL}/api/users/sync`, {
      method: "POST",
      headers: body
        ? { ...headers, "Content-Type": "application/json" }
        : headers,
      body,
    });

    if (!response.ok) {
      let errorMessage = `Failed to sync user (${response.status})`;
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to sync user:", error);
    throw error;
  }
}

/**
 * Get current authenticated user from Supabase
 */
export async function getCurrentUser() {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/users/me`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Failed to get user (${response.status})`;
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get user:", error);
    throw error;
  }
}
