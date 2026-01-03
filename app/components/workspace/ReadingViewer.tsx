'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { type Task, completeTask } from '../../lib/api-roadmap'

interface ReadingViewerProps {
  task: Task
  projectId: string
  onComplete: () => void
}

export default function ReadingViewer({ task, projectId, onComplete, initialCompleted }: ReadingViewerProps & { initialCompleted?: boolean }) {
  const { getToken } = useAuth()
  const contentRef = useRef<HTMLDivElement>(null)
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false)
  
  useEffect(() => {
    if (initialCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [initialCompleted, onComplete])

  const handleScroll = () => {
    if (!contentRef.current || isCompleted) return
    
    const element = contentRef.current
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight
    const clientHeight = element.clientHeight
    
    // Check if scrolled to bottom (within 50px threshold)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      markAsComplete()
    }
  }

  const markAsComplete = async () => {
    if (isCompleted) return
    
    try {
      const token = await getToken()
      if (!token) return
      
      await completeTask(projectId, task.task_id, token)
      setIsCompleted(true)
      onComplete()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div 
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-8"
      >
        <div className="max-w-3xl mx-auto prose prose-invert prose-zinc">
          <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {task.description}
          </div>
        </div>
      </div>

      {/* Status */}
      {isCompleted && (
        <div className="px-4 py-3 border-t border-zinc-800 bg-[#252526]">
          <div className="w-full px-4 py-2 bg-green-600/20 text-green-400 text-sm font-medium rounded border border-green-500/30 text-center">
            ✓ Task Completed
          </div>
        </div>
      )}
    </div>
  )
}

