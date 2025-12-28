'use client'

import { getAuthHeadersClient } from './api-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  conversation_history: ChatMessage[]
}

export interface ChatResponse {
  response: string
  chunks_used: Array<{
    chunk_id: string
    file_path: string
    chunk_index: number
    language: string
    score: number
  }>
}

/**
 * Send a chat message to the chatbot API
 * 
 * @param projectId - UUID of the project to chat about
 * @param message - User's message
 * @param conversationHistory - Previous conversation messages
 * @param token - Clerk authentication token
 * @returns ChatResponse with AI response and chunks used
 */
export async function sendChatMessage(
  projectId: string,
  message: string,
  conversationHistory: ChatMessage[],
  token: string | null
): Promise<ChatResponse> {
  try {
    if (!token) {
      throw new Error('Authentication required')
    }

    const headers = getAuthHeadersClient(token)
    
    const requestBody: ChatRequest = {
      message,
      conversation_history: conversationHistory,
    }
    
    const response = await fetch(`${API_URL}/api/chatbot/${projectId}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })
    
    if (!response.ok) {
      let errorMessage = `Failed to send message (${response.status})`
      try {
        const error = await response.json()
        errorMessage = error.detail || error.message || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to send chat message:', error)
    throw error
  }
}

