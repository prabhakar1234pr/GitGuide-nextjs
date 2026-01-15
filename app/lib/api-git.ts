/**
 * Git API Client
 * Functions for interacting with backend git endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface GitStatusResponse {
  success: boolean
  branch?: string | null
  ahead?: number
  behind?: number
  modified?: string[]
  staged?: string[]
  untracked?: string[]
  conflicts?: string[]
  raw?: string
}

export interface GitCommitEntry {
  sha: string
  author_name: string
  author_email: string
  date: string
  message: string
}

export interface GitCommitsResponse {
  success: boolean
  commits?: GitCommitEntry[]
}

export interface ExternalCommitsResponse {
  success: boolean
  has_external_commits?: boolean
  external_commits?: GitCommitEntry[]
  last_platform_commit?: string
  remote_commit?: string
}

export async function getGitStatus(workspaceId: string, token: string): Promise<GitStatusResponse | null> {
  try {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
      return null // Silently return null instead of throwing
  }
  return res.json()
  } catch (err) {
    // Silently handle all errors - backend might be unavailable
    return null
  }
}

export async function getGitDiff(
  workspaceId: string,
  token: string,
  baseCommit?: string,
  headCommit?: string
): Promise<{ success: boolean; diff?: string }> {
  const params = new URLSearchParams()
  if (baseCommit) params.set('base_commit', baseCommit)
  if (headCommit) params.set('head_commit', headCommit)
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/diff?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to get diff' }))
    throw new Error(error.detail || 'Failed to get diff')
  }
  return res.json()
}

export async function commitChanges(
  workspaceId: string,
  token: string,
  message: string
): Promise<{ success: boolean; commit_sha?: string }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/commit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to commit' }))
    throw new Error(error.detail || 'Failed to commit')
  }
  return res.json()
}

export async function pushToRemote(
  workspaceId: string,
  token: string,
  branch = 'main',
  setUpstream = false
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/push`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ branch, set_upstream: setUpstream }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to push' }))
    throw new Error(error.detail || 'Failed to push')
  }
  return res.json()
}

export async function pullFromRemote(
  workspaceId: string,
  token: string,
  branch = 'main',
  handleUncommitted?: 'commit' | 'stash' | 'discard'
): Promise<{ success: boolean; conflict?: 'uncommitted'; files?: string[]; message?: string }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/pull`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ branch, handle_uncommitted: handleUncommitted }),
  })
  if (res.status === 409) {
    const error = await res.json().catch(() => ({ detail: { message: 'Uncommitted changes' } }))
    const detail = error.detail || {}
    return {
      success: false,
      conflict: 'uncommitted',
      files: detail.files || [],
      message: detail.message || 'Uncommitted changes detected',
    }
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to pull' }))
    throw new Error(error.detail || 'Failed to pull')
  }
  return res.json()
}

export async function checkExternalCommits(
  workspaceId: string,
  token: string
): Promise<ExternalCommitsResponse> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/external-commits`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to check external commits' }))
    throw new Error(error.detail || 'Failed to check external commits')
  }
  return res.json()
}

export async function resetExternalCommits(
  workspaceId: string,
  token: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/reset-external`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmed: true }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to reset external commits' }))
    throw new Error(error.detail || 'Failed to reset external commits')
  }
  return res.json()
}

export async function getCommits(
  workspaceId: string,
  token: string,
  rangeSpec?: string
): Promise<GitCommitsResponse | null> {
  try {
  const params = new URLSearchParams()
  if (rangeSpec) params.set('range_spec', rangeSpec)
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/commits?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
      return null // Silently return null instead of throwing
    }
    return res.json()
  } catch (err) {
    // Silently handle all errors - backend might be unavailable
    return null
  }
}

export async function stageFiles(
  workspaceId: string,
  token: string,
  files?: string[]
): Promise<{ success: boolean; output?: string }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/stage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: files || null }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to stage files' }))
    throw new Error(error.detail || 'Failed to stage files')
  }
  return res.json()
}

export async function unstageFiles(
  workspaceId: string,
  token: string,
  files?: string[]
): Promise<{ success: boolean; output?: string }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/unstage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: files || null }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to unstage files' }))
    throw new Error(error.detail || 'Failed to unstage files')
  }
  return res.json()
}

export async function getFileDiff(
  workspaceId: string,
  token: string,
  filePath: string,
  staged = false
): Promise<{ success: boolean; diff?: string; error?: string }> {
  const params = new URLSearchParams()
  if (staged) params.set('staged', 'true')
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/diff/${encodeURIComponent(filePath)}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to get file diff' }))
    throw new Error(error.detail || 'Failed to get file diff')
  }
  return res.json()
}

export interface CommitGraphEntry {
  sha: string
  parents: string[]
  author_name: string
  author_email: string
  date: string
  message: string
  branches: string[]
}

export interface CommitGraphResponse {
  success: boolean
  commits?: CommitGraphEntry[]
  branches?: Record<string, string>
}

export async function getCommitGraph(
  workspaceId: string,
  token: string,
  maxCount = 50
): Promise<CommitGraphResponse | null> {
  try {
    const params = new URLSearchParams()
    params.set('max_count', maxCount.toString())
    const res = await fetch(`${API_BASE}/api/git/${workspaceId}/commits/graph?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return null // Silently return null instead of throwing
    }
    return res.json()
  } catch (err) {
    // Silently handle all errors - backend might be unavailable
    return null
  }
}

export interface BranchInfo {
  name: string
  current: boolean
}

export async function listBranches(
  workspaceId: string,
  token: string,
  includeRemote = false
): Promise<{ success: boolean; branches?: BranchInfo[]; current?: string } | null> {
  try {
    const params = new URLSearchParams()
    if (includeRemote) params.set('include_remote', 'true')
    const res = await fetch(`${API_BASE}/api/git/${workspaceId}/branches?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return null // Silently return null instead of throwing
    }
    return res.json()
  } catch (err) {
    // Silently handle all errors - backend might be unavailable
    return null
  }
}

export async function createBranch(
  workspaceId: string,
  token: string,
  branchName: string,
  startPoint?: string
): Promise<{ success: boolean; output?: string }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/branches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ branch_name: branchName, start_point: startPoint || null }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to create branch' }))
    throw new Error(error.detail || 'Failed to create branch')
  }
  return res.json()
}

export async function checkoutBranch(
  workspaceId: string,
  token: string,
  branchName: string,
  create = false
): Promise<{ success: boolean; output?: string; is_new_branch?: boolean }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/branches/checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ branch_name: branchName, create }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to checkout branch' }))
    throw new Error(error.detail || 'Failed to checkout branch')
  }
  return res.json()
}

export async function deleteBranch(
  workspaceId: string,
  token: string,
  branchName: string,
  force = false
): Promise<{ success: boolean; output?: string }> {
  try {
    const params = new URLSearchParams()
    if (force) params.set('force', 'true')
    const url = `${API_BASE}/api/git/${workspaceId}/branches/${encodeURIComponent(branchName)}${params.toString() ? '?' + params.toString() : ''}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Failed to delete branch' }))
      throw new Error(error.detail || 'Failed to delete branch')
    }
    return res.json()
  } catch (err) {
    // Re-throw with better error message
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to delete branch: Unknown error')
  }
}

export async function checkConflicts(
  workspaceId: string,
  token: string
): Promise<{ success: boolean; has_conflicts?: boolean; conflicts?: string[] } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/git/${workspaceId}/conflicts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return null // Silently return null instead of throwing
    }
    return res.json()
  } catch (err) {
    // Silently handle all errors - backend might be unavailable
    return null
  }
}

export async function getConflictContent(
  workspaceId: string,
  token: string,
  filePath: string
): Promise<{ success: boolean; content?: string }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/conflicts/${encodeURIComponent(filePath)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to get conflict content' }))
    throw new Error(error.detail || 'Failed to get conflict content')
  }
  return res.json()
}

export async function resolveConflict(
  workspaceId: string,
  token: string,
  filePath: string,
  side: 'ours' | 'theirs' | 'both',
  content?: string
): Promise<{ success: boolean; output?: string }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/conflicts/resolve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_path: filePath, side, content: content || null }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to resolve conflict' }))
    throw new Error(error.detail || 'Failed to resolve conflict')
  }
  return res.json()
}

export async function mergeBranch(
  workspaceId: string,
  token: string,
  branch: string,
  noFF = false,
  message?: string
): Promise<{ success: boolean; output?: string; has_conflicts?: boolean }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/merge`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ branch, no_ff: noFF, message: message || null }),
  })
  if (res.status === 409) {
    const error = await res.json().catch(() => ({ detail: 'Merge conflicts detected' }))
    return {
      success: false,
      has_conflicts: true,
      output: error.detail || 'Merge conflicts detected',
    }
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to merge' }))
    throw new Error(error.detail || 'Failed to merge')
  }
  return res.json()
}

export async function abortMerge(
  workspaceId: string,
  token: string
): Promise<{ success: boolean; output?: string }> {
  const res = await fetch(`${API_BASE}/api/git/${workspaceId}/merge/abort`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Failed to abort merge' }))
    throw new Error(error.detail || 'Failed to abort merge')
  }
  return res.json()
}