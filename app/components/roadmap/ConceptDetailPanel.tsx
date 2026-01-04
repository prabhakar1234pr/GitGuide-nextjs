'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ConceptDetails } from '../../lib/api-roadmap'

interface ConceptDetailPanelProps {
  conceptDetails: ConceptDetails | null
  loading: boolean
  projectId: string
  conceptProgress: Record<string, { progress_status: string; content_read?: boolean }>
  taskProgress: Record<string, { progress_status: string }>
  onStart: () => Promise<void>
  onComplete: () => Promise<void>
  onProgressChange: () => Promise<void>
  isLastConcept: boolean
}

export default function ConceptDetailPanel({ 
  conceptDetails, 
  loading, 
  projectId,
  conceptProgress,
  taskProgress,
  onStart, 
  onComplete,
  onProgressChange,
  isLastConcept
}: ConceptDetailPanelProps) {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showTasks, setShowTasks] = useState(false)

  if (loading || !conceptDetails) {
    return (
      <div className="w-full p-4 bg-[#2f3338] rounded-lg border border-white/10">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="space-y-2 mt-4">
            <div className="h-12 bg-white/10 rounded"></div>
            <div className="h-12 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const { concept, tasks } = conceptDetails
  const progress = conceptProgress[concept.concept_id]
  const isContentRead = progress?.content_read || false
  const allTasksDone = tasks.length === 0 || tasks.every(t => taskProgress[t.task_id]?.progress_status === 'done')

  const handleStart = async () => {
    setIsStarting(true)
    try {
      await onStart()
    } finally {
      setIsStarting(false)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await onComplete()
    } finally {
      setIsCompleting(false)
    }
  }

  const handleContentClick = () => {
    router.push(`/docs/${concept.concept_id}?project=${projectId}`)
  }

  const handleTaskClick = (taskId: string) => {
    router.push(`/workspace?task=${taskId}`)
  }

  const getTaskStatusIcon = (taskId: string) => {
    const status = taskProgress[taskId]?.progress_status
    if (status === 'done') {
      return (
        <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    }
    if (status === 'doing') {
      return (
        <div className="w-5 h-5 bg-orange-500/20 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        </div>
      )
    }
    return (
      <div className="w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
      </div>
    )
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      hard: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return colors[difficulty as keyof typeof colors] || colors.medium
  }

  return (
    <div className="w-full p-4 bg-[#2f3338] rounded-lg border border-orange-500/30">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <span className="text-xs font-medium text-zinc-400 mb-1 block">
              Concept {concept.order_index}
            </span>
            <h3 className="text-sm font-semibold text-white mb-1">{concept.title}</h3>
            {concept.description && (
              <p className="text-xs text-zinc-400">{concept.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {concept.estimated_minutes} min
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isStarting ? 'Starting...' : 'Start'}
          </button>
          <button
            onClick={handleComplete}
            disabled={isCompleting || (!isContentRead && concept.content)}
            className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
            title={!isContentRead && concept.content ? 'Read the content first' : ''}
          >
            {isCompleting ? 'Completing...' : 'Complete'}
          </button>
        </div>
      </div>

      {/* Content and Tasks Boxes */}
      <div className="space-y-3">
        {/* Content Box - Clickable to open docs page */}
        {concept.content && (
          <button
            onClick={handleContentClick}
            className="w-full px-4 py-3 flex items-center justify-between bg-[#3f4449] hover:bg-[#454a50] border border-white/10 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isContentRead ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                <svg className={`w-5 h-5 ${isContentRead ? 'text-green-400' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-medium text-white group-hover:text-orange-300 transition-colors">
                  Learning Content
                </h4>
                <p className="text-xs text-zinc-400">
                  {isContentRead ? 'Completed • Click to review' : 'Click to read documentation'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isContentRead && (
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                  ✓ Read
                </span>
              )}
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}

        {/* Tasks Box */}
        {tasks.length > 0 && (
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowTasks(!showTasks)}
              className="w-full px-4 py-3 flex items-center justify-between bg-[#3f4449] hover:bg-[#454a50] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${allTasksDone ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                  <svg className={`w-5 h-5 ${allTasksDone ? 'text-green-400' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-medium text-white">Tasks</h4>
                  <p className="text-xs text-zinc-400">
                    {tasks.filter(t => taskProgress[t.task_id]?.progress_status === 'done').length} of {tasks.length} completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {allTasksDone && (
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                    ✓ Done
                  </span>
                )}
                <svg
                  className={`w-5 h-5 text-zinc-400 transition-transform ${showTasks ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {showTasks && (
              <div className="bg-[#2a2d31] divide-y divide-white/5">
                {tasks.map((task) => (
                  <button
                    key={task.task_id}
                    onClick={() => handleTaskClick(task.task_id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    {getTaskStatusIcon(task.task_id)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-medium text-white truncate">{task.title}</h5>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${getDifficultyBadge(task.difficulty)}`}>
                          {task.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {task.estimated_minutes}m
                    </div>
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
