/**
 * API client for task chatbot endpoints.
 * Handles conversation history and context-aware chat for coding tasks.
 */

import { getAuthHeadersClient } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface TaskChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface UserCodeFile {
  path: string;
  content: string;
}

export interface TaskChatRequest {
  message: string;
  conversation_id?: string | null;
  user_code: UserCodeFile[];
  verification?: {
    passed: boolean;
    overall_feedback: string;
    issues_found: string[];
    suggestions: string[];
    code_quality: string;
  } | null;
  is_manager?: boolean;
}

export interface TaskChatResponse {
  response: string;
  conversation_id: string;
}

export interface ConversationResponse {
  conversation_id: string | null;
  messages: TaskChatMessage[];
}

export interface ConversationListItem {
  id: string;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Send a message to the task chatbot.
 */
export async function sendTaskChatMessage(
  taskId: string,
  request: TaskChatRequest,
  token: string | null
): Promise<TaskChatResponse> {
  if (!token) {
    throw new Error("Authentication required");
  }

  const headers = getAuthHeadersClient(token);

  const response = await fetch(`${API_URL}/api/chatbot/task/${taskId}/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `Failed to send message (${response.status})`;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Load conversation for a task.
 * Returns conversation_id (or null if no conversation exists) and messages.
 */
export async function loadTaskConversation(
  taskId: string,
  token: string | null,
  conversationId?: string | null
): Promise<ConversationResponse> {
  if (!token) {
    throw new Error("Authentication required");
  }

  const headers = getAuthHeadersClient(token);

  const params = new URLSearchParams();
  if (conversationId) params.set("conversation_id", conversationId);

  const response = await fetch(
    `${API_URL}/api/chatbot/task/${taskId}/conversation${
      params.toString() ? `?${params.toString()}` : ""
    }`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    // If 404, return empty conversation (no conversation exists yet)
    if (response.status === 404) {
      return { conversation_id: null, messages: [] };
    }

    let errorMessage = `Failed to load conversation (${response.status})`;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * List all conversations for a task (most recent first).
 */
export async function listTaskConversations(
  taskId: string,
  token: string | null
): Promise<ConversationListItem[]> {
  if (!token) {
    throw new Error("Authentication required");
  }

  const headers = getAuthHeadersClient(token);
  const response = await fetch(
    `${API_URL}/api/chatbot/task/${taskId}/conversations`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    let errorMessage = `Failed to load conversations (${response.status})`;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}
