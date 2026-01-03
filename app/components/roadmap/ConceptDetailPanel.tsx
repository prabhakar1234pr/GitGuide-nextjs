'use client'

import { useState } from 'react'
import { type ConceptDetails } from '../../lib/api-roadmap'
import SubConceptItem from './SubConceptItem'
import TasksSection from './TasksSection'

interface ConceptDetailPanelProps {
  conceptDetails: ConceptDetails | null
  loading: boolean
  projectId: string
  subconceptProgress: Record<string, { progress_status: string }>
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
  subconceptProgress,
  taskProgress,
  onStart, 
  onComplete,
  onProgressChange,
  isLastConcept
}: ConceptDetailPanelProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  if (loading || !conceptDetails) {
    return (
      <div className="w-full p-3 bg-[#2f3338] rounded border border-white/10">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
          <div className="space-y-1">
            <div className="h-3 bg-white/10 rounded"></div>
            <div className="h-3 bg-white/10 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const { concept, subconcepts, tasks } = conceptDetails

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

  return (
    <div className="w-full p-3 bg-[#2f3338] rounded border border-orange-500/30">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between mb-1.5">
          <div>
            <span className="text-[10px] font-medium text-zinc-400 mb-0.5 block">
              Concept {concept.order_index}
            </span>
            <h3 className="text-xs font-semibold text-white mb-1 leading-tight">{concept.title}</h3>
            {concept.description && (
              <p className="text-[10px] text-zinc-400 leading-tight">{concept.description}</p>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded text-[10px] font-medium transition-colors disabled:opacity-50"
          >
            {isStarting ? 'Starting...' : 'Start'}
          </button>
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-[10px] font-medium transition-colors disabled:opacity-50"
          >
            {isCompleting ? 'Completing...' : 'Complete'}
          </button>
        </div>
      </div>

      {/* Subconcepts */}
      {subconcepts.length > 0 && (
        <div className="mb-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
          <h4 className="text-xs font-semibold text-white mb-2">Learning Content</h4>
          <div className="space-y-1.5">
            {subconcepts.map((subconcept, index) => {
              // Check if this is the last subconcept of the last concept (and there are no tasks)
              const isLastSubconcept = isLastConcept && index === subconcepts.length - 1 && tasks.length === 0
              return (
                <SubConceptItem 
                  key={subconcept.subconcept_id} 
                  subconcept={subconcept}
                  projectId={projectId}
                  isCompleted={subconceptProgress[subconcept.subconcept_id]?.progress_status === 'done'}
                  onProgressChange={isLastSubconcept ? onProgressChange : async () => {}}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
          <TasksSection 
            tasks={tasks} 
            taskProgress={taskProgress}
          />
        </div>
      )}
    </div>
  )
}

