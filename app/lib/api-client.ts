"use client";

import type { CreateProjectData } from "./types";
// Re-export type for convenience
export type { CreateProjectData } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Get auth headers using client-side Clerk hook
 */
export function getAuthHeadersClient(token: string | null): HeadersInit {
  if (!token) {
    throw new Error("No authentication token available");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Create a new project (client-side)
 */
export async function createProjectClient(
  data: CreateProjectData,
  token: string | null
) {
  try {
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = getAuthHeadersClient(token);

    const response = await fetch(`${API_URL}/api/projects/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `Failed to create project (${response.status})`;
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to create project:", error);
    throw error;
  }
}

/**
 * List user's projects (client-side)
 * Requires token from useAuth hook
 */
export async function listUserProjectsClient(token: string | null) {
  try {
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = getAuthHeadersClient(token);

    const response = await fetch(`${API_URL}/api/projects/user/list`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Failed to list projects (${response.status})`;
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to list projects:", error);
    throw error;
  }
}

/**
 * Delete a project (client-side)
 * Requires token from useAuth hook
 */
export async function deleteProject(projectId: string, token: string | null) {
  try {
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = getAuthHeadersClient(token);

    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Failed to delete project (${response.status})`;
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}

/**
 * Grant project access to an employee by email (manager only)
 */
export async function grantProjectAccess(
  projectId: string,
  email: string,
  token: string | null
) {
  if (!token) throw new Error("Authentication required");
  const response = await fetch(`${API_URL}/api/projects/${projectId}/access`, {
    method: "POST",
    headers: getAuthHeadersClient(token),
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.detail || `Failed to grant access (${response.status})`
    );
  }
  return response.json();
}

/**
 * List emails with access to a project (manager only)
 */
export async function listProjectAccess(
  projectId: string,
  token: string | null
): Promise<{
  success: boolean;
  access_list: { user_id: string; email: string }[];
}> {
  if (!token) throw new Error("Authentication required");
  const response = await fetch(`${API_URL}/api/projects/${projectId}/access`, {
    method: "GET",
    headers: getAuthHeadersClient(token),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to list access (${response.status})`);
  }
  return response.json();
}

/**
 * Revoke project access from an employee (manager only)
 */
export async function revokeProjectAccess(
  projectId: string,
  userId: string,
  token: string | null
) {
  if (!token) throw new Error("Authentication required");
  const response = await fetch(
    `${API_URL}/api/projects/${projectId}/access/${userId}`,
    { method: "DELETE", headers: getAuthHeadersClient(token) }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.detail || `Failed to revoke access (${response.status})`
    );
  }
  return response.json();
}
