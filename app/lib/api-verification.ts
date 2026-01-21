/**
 * API client for task verification endpoints.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RequirementCheck {
  met: boolean;
  feedback: string;
}

export interface TaskVerificationResponse {
  success: boolean;
  task_id: string;
  passed: boolean;
  overall_feedback: string;
  requirements_check: Record<string, RequirementCheck>;
  hints: string[];
  issues_found: string[];
  suggestions: string[];
  code_quality: string;
  test_status?: string | null;
  pattern_match_status?: string | null;
}

export interface VerifyTaskRequest {
  workspace_id: string;
}

/**
 * Verify a task using the deep verification system.
 */
export async function verifyTask(
  taskId: string,
  workspaceId: string,
  token: string | null
): Promise<TaskVerificationResponse> {
  if (!token) {
    throw new Error("Authentication token required");
  }

  const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to verify task" }));
    throw new Error(error.detail || "Failed to verify task");
  }

  return response.json();
}
