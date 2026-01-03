/**
 * API client for roadmap and progress endpoints
 * Client-side only - requires token from useAuth hook
 */

import { getAuthHeadersClient } from './api-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export interface RoadmapDay {
  day_id: string
  project_id: string
  day_number: number
  theme: string
  description: string | null
  generated_status: 'pending' | 'generating' | 'generated' | 'failed'
  created_at: string
}

export interface Concept {
  concept_id: string
  day_id: string
  order_index: number
  title: string
  description: string | null
  generated_status: 'pending' | 'generating' | 'generated' | 'failed'
  created_at: string
}

export interface SubConcept {
  subconcept_id: string
  concept_id: string
  order_index: number
  title: string
  content: string
  generated_status: 'pending' | 'generating' | 'generated' | 'failed'
  created_at: string
}

export interface Task {
  task_id: string
  concept_id: string
  order_index: number
  title: string
  description: string
  task_type: 'coding' | 'reading' | 'research' | 'quiz' | 'github_profile' | 'create_repo' | 'verify_commit'
  generated_status: 'pending' | 'generating' | 'generated' | 'failed'
  created_at: string
}

export interface DayDetails {
  day: RoadmapDay
  concepts: Concept[]
}

export interface ConceptDetails {
  concept: Concept
  subconcepts: SubConcept[]
  tasks: Task[]
}

export interface GenerationStatus {
  total_days: number
  target_days: number
  generated_days: number
  status_counts: {
    pending: number
    generating: number
    generated: number
    failed: number
  }
  is_complete: boolean
  is_generating: boolean
}

export interface UserProgress {
  day_progress: Record<string, { id: string; user_id: string; day_id: string; progress_status: string; updated_at: string }>
  concept_progress: Record<string, { id: string; user_id: string; concept_id: string; progress_status: string; updated_at: string }>
  subconcept_progress: Record<string, { id: string; user_id: string; subconcept_id: string; progress_status: string; updated_at: string }>
  task_progress: Record<string, { id: string; user_id: string; task_id: string; progress_status: string; updated_at: string }>
}

export interface CurrentProgress {
  current_day: RoadmapDay | null
  current_concept: Concept | null
}

// Roadmap API

export async function getRoadmap(projectId: string, token: string | null): Promise<{ success: boolean; days: RoadmapDay[] }> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/roadmap/${projectId}`, {
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch roadmap: ${response.statusText}`)
  }
  
  return response.json()
}

export async function getDayDetails(projectId: string, dayId: string, token: string | null): Promise<{ success: boolean } & DayDetails> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/roadmap/${projectId}/day/${dayId}`, {
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch day details: ${response.statusText}`)
  }
  
  return response.json()
}

export async function getConceptDetails(projectId: string, conceptId: string, token: string | null): Promise<{ success: boolean } & ConceptDetails> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/roadmap/${projectId}/concept/${conceptId}`, {
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch concept details: ${response.statusText}`)
  }
  
  return response.json()
}

export async function getGenerationStatus(projectId: string, token: string | null): Promise<{ success: boolean } & GenerationStatus> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/roadmap/${projectId}/generation-status`, {
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch generation status: ${response.statusText}`)
  }
  
  return response.json()
}

// Progress API

export async function getProgress(projectId: string, token: string | null): Promise<{ success: boolean } & UserProgress> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/progress/${projectId}`, {
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch progress: ${response.statusText}`)
  }
  
  return response.json()
}

export async function getCurrentProgress(projectId: string, token: string | null): Promise<{ success: boolean } & CurrentProgress> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/progress/${projectId}/current`, {
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch current progress: ${response.statusText}`)
  }
  
  return response.json()
}

export async function startConcept(projectId: string, conceptId: string, token: string | null): Promise<{ success: boolean }> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/progress/${projectId}/concept/${conceptId}/start`, {
    method: 'POST',
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to start concept: ${response.statusText}`)
  }
  
  return response.json()
}

export async function completeConcept(projectId: string, conceptId: string, token: string | null): Promise<{ success: boolean }> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/progress/${projectId}/concept/${conceptId}/complete`, {
    method: 'POST',
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to complete concept: ${response.statusText}`)
  }
  
  return response.json()
}

export async function startDay(projectId: string, dayId: string, token: string | null): Promise<{ success: boolean }> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/progress/${projectId}/day/${dayId}/start`, {
    method: 'POST',
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to start day: ${response.statusText}`)
  }
  
  return response.json()
}

export async function completeDay(projectId: string, dayId: string, token: string | null): Promise<{ success: boolean }> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/progress/${projectId}/day/${dayId}/complete`, {
    method: 'POST',
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to complete day: ${response.statusText}`)
  }
  
  return response.json()
}

export interface TaskDetails {
  task: Task
  concept: Concept
  day: RoadmapDay
  project: {
    project_id: string
    project_name: string
    github_url: string
    skill_level: string
    target_days: number
    status: string
    created_at: string
  }
}

export async function getTaskDetails(taskId: string, token: string | null): Promise<{ success: boolean } & TaskDetails> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/roadmap/task/${taskId}`, {
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch task details: ${response.statusText}`)
  }
  
  return response.json()
}

export async function completeSubconcept(projectId: string, subconceptId: string, token: string | null): Promise<{ success: boolean }> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/progress/${projectId}/subconcept/${subconceptId}/complete`, {
    method: 'POST',
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to complete subconcept: ${response.statusText}`)
  }
  
  return response.json()
}

export async function completeTask(projectId: string, taskId: string, token: string | null): Promise<{ success: boolean }> {
  if (!token) {
    throw new Error('Authentication required')
  }
  
  const headers = getAuthHeadersClient(token)
  const response = await fetch(`${API_BASE_URL}/api/progress/${projectId}/task/${taskId}/complete`, {
    method: 'POST',
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`Failed to complete task: ${response.statusText}`)
  }
  
  return response.json()
}

