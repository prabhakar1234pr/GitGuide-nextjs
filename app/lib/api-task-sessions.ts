/**
 * Task Sessions API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface TaskSession {
  session_id: string
  task_id: string
  user_id: string
  workspace_id: string
  base_commit: string
  current_commit?: string | null
  started_at: string
  completed_at?: string | null
}

export async function startTaskSession(
  taskId: string,
  workspaceId: string,
  token: string
): Promise<{ success: boolean; session?: TaskSession }> {
  try {
    const res = await fetch(`${API_BASE}/api/task-sessions/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task_id: taskId, workspace_id: workspaceId }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Failed to start task session' }))
      throw new Error(error.detail || 'Failed to start task session')
    }
    return res.json()
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to API at ${API_BASE}. Make sure the backend server is running.`)
    }
    throw err
  }
}

export async function completeTaskSession(
  sessionId: string,
  token: string,
  currentCommit?: string
): Promise<{ success: boolean; session?: TaskSession }> {
  try {
    const res = await fetch(`${API_BASE}/api/task-sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ current_commit: currentCommit || null }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Failed to complete task session' }))
      throw new Error(error.detail || 'Failed to complete task session')
    }
    return res.json()
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to API at ${API_BASE}. Make sure the backend server is running.`)
    }
    throw err
  }
}

export async function getTaskSessionDiff(
  sessionId: string,
  token: string
): Promise<{ success: boolean; diff?: string; base_commit?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/task-sessions/${sessionId}/diff`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Failed to fetch diff' }))
      throw new Error(error.detail || 'Failed to fetch diff')
    }
    return res.json()
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to API at ${API_BASE}. Make sure the backend server is running.`)
    }
    throw err
  }
}
