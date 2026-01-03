'use client'

import { useState } from 'react'
import { type TaskDetails } from '../../lib/api-roadmap'
import CodeEditor from './CodeEditor'
import TaskInfoPanel from './TaskInfoPanel'
import ReadingViewer from './ReadingViewer'
import ResearchPanel from './ResearchPanel'
import QuizPanel from './QuizPanel'
import GitHubTaskPanel from './GitHubTaskPanel'

interface WorkplaceIDEProps {
  taskDetails: TaskDetails
  onProgressChange?: () => Promise<void>
}

export default function WorkplaceIDE({ taskDetails, initialCompleted, onProgressChange }: WorkplaceIDEProps & { initialCompleted?: boolean }) {
  const { task, concept, day, project } = taskDetails
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false)

  const handleComplete = async () => {
    setIsCompleted(true)
    if (onProgressChange) {
      await onProgressChange()
    }
  }

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
        return <GitHubTaskPanel task={task} project={project} onComplete={handleComplete} initialCompleted={isCompleted} />
      
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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Task Info */}
      <div className="w-80 border-r border-zinc-800 bg-[#252526] overflow-y-auto">
        <TaskInfoPanel 
          task={task} 
          concept={concept} 
          day={day} 
          project={project}
          isCompleted={isCompleted}
        />
      </div>

      {/* Main Workspace */}
      <div className="flex-1 bg-[#1e1e1e] overflow-hidden">
        {renderWorkspace()}
      </div>
    </div>
  )
}

