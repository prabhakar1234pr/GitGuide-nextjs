'use client'

import { type RoadmapDay } from '../../lib/api-roadmap'

interface DayCardsStripProps {
  days: RoadmapDay[]
  currentDayId: string | null
  onDayClick: (dayId: string) => void
  progressMap: Record<string, { progress_status: string }>
}

export default function DayCardsStrip({ days, currentDayId, onDayClick, progressMap }: DayCardsStripProps) {
  const getDayStatus = (day: RoadmapDay) => {
    // First, check if there's a progress entry for this day
    // This will return the actual status: 'todo', 'doing', or 'done'
    const progress = progressMap[day.day_id]
    if (progress) {
      return progress.progress_status
    }
    
    // If no progress entry exists:
    // - Day 0 is always available (defaults to 'todo')
    // - Other days default to 'locked' unless previous day is completed
    if (day.day_number === 0) {
      return 'todo'
    }
    
    // Check if previous day is completed to determine if this day is unlocked
    // We need to check ALL previous days, not just the immediate previous one
    // If any previous day is done, we can unlock this day
    // But typically we check the immediate previous day
    const previousDay = days.find(d => d.day_number === day.day_number - 1)
    if (previousDay) {
      const previousProgress = progressMap[previousDay.day_id]
      // If previous day has progress_status 'done', unlock this day
      if (previousProgress?.progress_status === 'done') {
        return 'todo'
      }
      // Also check if previous day is Day 0 and has no progress entry (it's always available)
      // But if Day 0 is completed, it should have progress_status 'done'
      // So if Day 0 has no entry, it means it hasn't been started/completed yet
    }
    
    // Special case: If Day 0 has no progress entry but Day 1 is being checked,
    // we should still allow Day 1 to be unlocked if Day 0 exists and is available
    // Actually, this shouldn't happen - Day 0 should always have a progress entry after initialization
    
    // Default: locked
    return 'locked'
  }

  const getDayColor = (day: RoadmapDay) => {
    const status = getDayStatus(day)
    const isGenerating = day.generated_status === 'generating'
    
    if (isGenerating) {
      return 'bg-blue-500/20 border-blue-500/50'
    }
    
    switch (status) {
      case 'done':
        return 'bg-green-500/20 border-green-500/50'
      case 'doing':
        return 'bg-orange-500/20 border-orange-500/50'
      case 'todo':
        return 'bg-zinc-700/50 border-zinc-600/50'
      case 'locked':
      default:
        return 'bg-zinc-800/50 border-zinc-700/50 opacity-60'
    }
  }

  const getDayIcon = (day: RoadmapDay) => {
    const status = getDayStatus(day)
    const isGenerating = day.generated_status === 'generating'
    
    if (isGenerating) {
      return (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      )
    }
    
    switch (status) {
      case 'done':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'doing':
        return (
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
        )
      case 'locked':
        return (
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-white mb-2">Learning Roadmap</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
        {days.map((day) => {
          const isSelected = currentDayId === day.day_id
          const dayStatus = getDayStatus(day)
          // Allow clicking if day is unlocked (not locked), even if it's pending/generating
          // This allows users to click on days that are being generated or are ready to be generated
          const isClickable = dayStatus !== 'locked' && (day.generated_status === 'generated' || day.generated_status === 'pending' || day.generated_status === 'generating')
          
          return (
            <button
              key={day.day_id}
              onClick={() => isClickable && onDayClick(day.day_id)}
              disabled={!isClickable}
              className={`
                flex-shrink-0 w-24 p-2 rounded border transition-all duration-200
                ${getDayColor(day)}
                ${isSelected ? 'ring-1 ring-white/30' : ''}
                ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-zinc-400">Day {day.day_number}</span>
                <div className="scale-75">{getDayIcon(day)}</div>
              </div>
              <h3 className="text-xs font-semibold text-white line-clamp-2 leading-tight">{day.theme}</h3>
              {day.generated_status === 'generating' && (
                <p className="text-[10px] text-blue-400 mt-0.5">Generating...</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

