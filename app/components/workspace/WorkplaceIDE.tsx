'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type TaskDetails, type Task } from '../../lib/api-roadmap'
import CodeEditor from './CodeEditor'
import ReadingViewer from './ReadingViewer'
import ResearchPanel from './ResearchPanel'
import QuizPanel from './QuizPanel'
import GitHubTaskPanel from './GitHubTaskPanel'

interface NextNavigation {
  type: 'task' | 'concept' | 'day' | 'complete'
  taskId?: string
  conceptId?: string
  dayNumber?: number
  projectId: string
}

interface WorkplaceIDEProps {
  taskDetails: TaskDetails
  onProgressChange?: () => Promise<void>
  nextTaskId?: string | null
  nextNavigation?: NextNavigation | null
}

const getTaskTypeStyle = (taskType: Task['task_type']) => {
  switch (taskType) {
    case 'coding':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' }
    case 'reading':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' }
    case 'research':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' }
    case 'quiz':
      return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' }
    case 'github_profile':
    case 'create_repo':
    case 'verify_commit':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' }
    default:
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' }
  }
}

export default function WorkplaceIDE({ taskDetails, initialCompleted, onProgressChange, nextTaskId, nextNavigation }: WorkplaceIDEProps & { initialCompleted?: boolean }) {
  const { task, concept, day, project } = taskDetails
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false)

  const handleComplete = async () => {
    setIsCompleted(true)
    if (onProgressChange) {
      await onProgressChange()
    }
  }

  const taskStyle = getTaskTypeStyle(task.task_type)

  const renderWorkspace = () => {
    switch (task.task_type) {
      case 'coding':
        return <CodeEditor task={task} projectId={project.project_id} onComplete={handleComplete} initialCompleted={isCompleted} />
        
      case 'reading':
        return <ReadingViewer task={task} projectId={project.project_id} onComplete={handleComplete} initialCompleted={isCompleted} />
        
      case 'research':
        return <ResearchPanel task={task} projectId={project.project_id} onComplete={handleComplete} initialCompleted={isCompleted} />
        
      case 'quiz':
        return <QuizPanel task={task} projectId={project.project_id} onComplete={handleComplete} initialCompleted={isCompleted} />
        
      case 'github_profile':
      case 'create_repo':
      case 'verify_commit':
        return <GitHubTaskPanel task={task} project={project} onComplete={handleComplete} initialCompleted={isCompleted} nextTaskId={nextTaskId} nextNavigation={nextNavigation} />
      
      default:
        return (
          <div className="flex items-center justify-center h-full text-zinc-400">
            <div className="text-center">
              <p className="text-lg mb-2">Task type not supported yet</p>
              <p className="text-sm">{task.task_type}</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      {/* Clean Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-8 py-4">
          {/* Back Link */}
          <Link 
            href={`/project/${project.project_id}`}
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm mb-4 group transition-colors"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Roadmap
          </Link>
          
          {/* Task Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${taskStyle.bg} ${taskStyle.text} border ${taskStyle.border}`}>
                  {task.task_type.replace('_', ' ')}
                </span>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Complete
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {task.title}
              </h1>
              <p className="text-stone-500 text-sm mt-1">
                Day {day.day_number} · {concept.title}
              </p>
            </div>
            
            {task.estimated_minutes && (
              <div className="text-right text-sm text-stone-400">
                <span>~{task.estimated_minutes} min</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {renderWorkspace()}
      </main>
    </div>
  )
}

