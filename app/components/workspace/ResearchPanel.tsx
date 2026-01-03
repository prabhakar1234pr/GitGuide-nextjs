'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { type Task, completeTask } from '../../lib/api-roadmap'

interface ResearchPanelProps {
  task: Task
  projectId: string
  onComplete: () => void
}

export default function ResearchPanel({ task, projectId, onComplete, initialCompleted }: ResearchPanelProps & { initialCompleted?: boolean }) {
  const { getToken } = useAuth()
  const [notes, setNotes] = useState('')
  const [resources, setResources] = useState<string[]>([])
  const [newResource, setNewResource] = useState('')
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false)
  
  useEffect(() => {
    if (initialCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [initialCompleted, onComplete])

  // Validate and auto-complete when requirements are met
  useEffect(() => {
    const validateAndComplete = async () => {
      if ((notes.trim().length >= 20 || resources.length > 0) && !isCompleted) {
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
    }

    const timer = setTimeout(validateAndComplete, 2000)
    return () => clearTimeout(timer)
  }, [notes, resources, isCompleted, projectId, task.task_id, getToken, onComplete])

  const handleAddResource = () => {
    if (newResource.trim()) {
      setResources([...resources, newResource.trim()])
      setNewResource('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Task Description */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Research Task</h2>
            <p className="text-zinc-400 leading-relaxed">{task.description}</p>
          </div>

          {/* Notes Section */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Your Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take notes about your research findings..."
              className="w-full h-64 bg-[#252526] text-zinc-200 p-4 rounded border border-zinc-800 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Resources</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddResource()}
                placeholder="Add a resource URL..."
                className="flex-1 px-3 py-2 bg-[#252526] text-zinc-200 rounded border border-zinc-800 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddResource}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {resources.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-[#252526] rounded border border-zinc-800">
                  <a
                    href={resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 flex-1 truncate"
                  >
                    {resource}
                  </a>
                  <button
                    onClick={() => setResources(resources.filter((_, i) => i !== index))}
                    className="ml-2 text-zinc-400 hover:text-zinc-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
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

