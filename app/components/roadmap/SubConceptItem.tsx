'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { type SubConcept } from '../../lib/api-roadmap'
import { completeSubconcept } from '../../lib/api-roadmap'
import ReactMarkdown from 'react-markdown'

interface SubConceptItemProps {
  subconcept: SubConcept
  projectId: string
  isCompleted: boolean
  onProgressChange: () => Promise<void>
}

export default function SubConceptItem({ subconcept, projectId, isCompleted, onProgressChange }: SubConceptItemProps) {
  const { getToken } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [completed, setCompleted] = useState(isCompleted)
  const contentRef = useRef<HTMLDivElement>(null)
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)

  useEffect(() => {
    setCompleted(isCompleted)
  }, [isCompleted])

  const handleScroll = () => {
    if (!contentRef.current || !isExpanded) return
    
    const element = contentRef.current
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight
    const clientHeight = element.clientHeight
    
    // Check if scrolled to bottom (within 50px threshold)
    if (scrollHeight - scrollTop - clientHeight < 50 && !hasScrolledToEnd && !completed) {
      setHasScrolledToEnd(true)
      markAsComplete()
    }
  }

  const markAsComplete = async () => {
    if (completed) return
    
    try {
      const token = await getToken()
      if (!token) return
      
      await completeSubconcept(projectId, subconcept.subconcept_id, token)
      setCompleted(true)
      // Refresh progress to update concept/day status and unlock next day
      await onProgressChange()
    } catch (error) {
      console.error('Failed to mark subconcept as complete:', error)
    }
  }

  return (
    <div className={`bg-[#3f4449] rounded border overflow-hidden ${completed ? 'border-green-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-2 py-1.5 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-zinc-400">
            {subconcept.order_index}
          </span>
          <h5 className="text-xs font-semibold text-white text-left leading-tight">{subconcept.title}</h5>
          {completed && (
            <span className="text-[10px] px-1 py-0.5 bg-green-500/20 text-green-400 rounded border border-green-500/30">
              ✓
            </span>
          )}
        </div>
        <svg
          className={`w-3 h-3 text-zinc-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="px-2 py-2 border-t border-white/10 max-h-64 overflow-y-auto"
        >
          <div className="prose prose-invert prose-xs max-w-none">
            <ReactMarkdown className="text-zinc-300 text-xs leading-relaxed">
              {subconcept.content}
            </ReactMarkdown>
          </div>
          {hasScrolledToEnd && !completed && (
            <div className="mt-2 text-xs text-green-400">✓ Scrolled to end - marking as complete...</div>
          )}
        </div>
      )}
    </div>
  )
}
