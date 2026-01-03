'use client'

import { type Task, type Concept, type RoadmapDay } from '../../lib/api-roadmap'
import Link from 'next/link'

interface TaskInfoPanelProps {
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
  isCompleted: boolean
}

export default function TaskInfoPanel({ task, concept, day, project, isCompleted }: TaskInfoPanelProps) {
  const getTaskTypeColor = (taskType: Task['task_type']) => {
    switch (taskType) {
      case 'coding':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'reading':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'research':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'quiz':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'github_profile':
      case 'create_repo':
      case 'verify_commit':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Link 
            href={`/project/${project.project_id}`}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ← Back to Project
          </Link>
        </div>
        <h1 className="text-lg font-semibold text-white mb-1">{task.title}</h1>
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getTaskTypeColor(task.task_type)}`}>
            {task.task_type}
          </span>
          {isCompleted && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Task Description */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wide">Description</h2>
        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{task.description}</p>
      </div>

      {/* Context Info */}
      <div className="space-y-3 pt-3 border-t border-zinc-800">
        <div>
          <h3 className="text-xs font-semibold text-zinc-300 mb-1 uppercase tracking-wide">Concept</h3>
          <p className="text-sm text-zinc-400">{concept.title}</p>
          {concept.description && (
            <p className="text-xs text-zinc-500 mt-1">{concept.description}</p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-zinc-300 mb-1 uppercase tracking-wide">Day</h3>
          <p className="text-sm text-zinc-400">Day {day.day_number}: {day.theme}</p>
          {day.description && (
            <p className="text-xs text-zinc-500 mt-1">{day.description}</p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-zinc-300 mb-1 uppercase tracking-wide">Project</h3>
          <p className="text-sm text-zinc-400">{project.project_name}</p>
          <a 
            href={project.github_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
          >
            View Repository →
          </a>
        </div>
      </div>
    </div>
  )
}

