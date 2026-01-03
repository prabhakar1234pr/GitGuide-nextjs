'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { getTaskDetails, getProgress, getDayDetails, getConceptDetails, type TaskDetails, type DayDetails, type ConceptDetails } from '../lib/api-roadmap'
import Header from '../components/Header'
import WorkplaceIDE from '../components/workspace/WorkplaceIDE'

export default function WorkspacePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getToken } = useAuth()
  const taskId = searchParams.get('task')
  
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null)
  const [dayDetails, setDayDetails] = useState<DayDetails | null>(null)
  const [conceptDetails, setConceptDetails] = useState<ConceptDetails | null>(null)
  const [isTaskCompleted, setIsTaskCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTaskDetails() {
      if (!taskId) {
        setError('Task ID is required')
        setLoading(false)
        return
      }

      try {
        const token = await getToken()
        if (!token) {
          setError('Authentication required')
          setLoading(false)
          return
        }

        const data = await getTaskDetails(taskId, token)
        setTaskDetails(data)
        
        // Fetch day and concept details to check if this is the last task
        if (data.project.project_id && data.day.day_id && data.concept.concept_id) {
          const [progress, dayData, conceptData] = await Promise.all([
            getProgress(data.project.project_id, token),
            getDayDetails(data.project.project_id, data.day.day_id, token),
            getConceptDetails(data.project.project_id, data.concept.concept_id, token)
          ])
          
          setDayDetails(dayData)
          setConceptDetails(conceptData)
          
          const taskProgress = progress.task_progress[taskId]
          if (taskProgress && taskProgress.progress_status === 'done') {
            setIsTaskCompleted(true)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load task details')
      } finally {
        setLoading(false)
      }
    }

    fetchTaskDetails()
  }, [taskId, getToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e1e]">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-white">Loading task...</div>
        </div>
      </div>
    )
  }

  if (error || !taskDetails) {
    return (
      <div className="min-h-screen bg-[#1e1e1e]">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-red-400">{error || 'Task not found'}</div>
        </div>
      </div>
    )
  }

  // Check if this is the last task of the last concept
  const isLastTask = dayDetails && conceptDetails && taskDetails
    ? (() => {
        const lastConcept = dayDetails.concepts[dayDetails.concepts.length - 1]
        const isLastConcept = lastConcept?.concept_id === taskDetails.concept.concept_id
        const lastTask = conceptDetails.tasks[conceptDetails.tasks.length - 1]
        const isLastTaskInConcept = lastTask?.task_id === taskId
        return isLastConcept && isLastTaskInConcept
      })()
    : false

  const handleProgressChange = async () => {
    // Only refresh if this is the last task
    if (isLastTask && taskDetails) {
      try {
        const token = await getToken()
        if (!token) return
        
        // Refresh progress to unlock next day
        await getProgress(taskDetails.project.project_id, token)
        // Navigate back to roadmap
        router.push(`/roadmap/${taskDetails.project.project_id}`)
      } catch (error) {
        console.error('Failed to refresh progress:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      <Header />
      <WorkplaceIDE 
        taskDetails={taskDetails} 
        initialCompleted={isTaskCompleted}
        onProgressChange={handleProgressChange}
      />
    </div>
  )
}

