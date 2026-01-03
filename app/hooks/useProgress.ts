'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  getProgress,
  getCurrentProgress,
  startConcept,
  completeConcept,
  startDay,
  completeDay,
  type UserProgress,
  type CurrentProgress,
} from '../lib/api-roadmap'

export function useProgress(projectId: string) {
  const { getToken } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [current, setCurrent] = useState<CurrentProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    if (!projectId) return

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/92926a72-8323-4be7-928d-d365e86b8ef8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useProgress.ts:23',message:'fetchProgress called',data:{projectId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const token = await getToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      setLoading(true)
      setError(null)
      const [progressData, currentData] = await Promise.all([
        getProgress(projectId, token),
        getCurrentProgress(projectId, token),
      ])
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/92926a72-8323-4be7-928d-d365e86b8ef8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useProgress.ts:39',message:'Progress fetched',data:{dayProgressCount:Object.keys(progressData.day_progress||{}).length,conceptProgressCount:Object.keys(progressData.concept_progress||{}).length,dayProgressKeys:Object.keys(progressData.day_progress||{}),dayProgressSample:Object.values(progressData.day_progress||{}).slice(0,2)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setProgress(progressData)
      setCurrent(currentData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setLoading(false)
    }
  }, [projectId, getToken])

  // Initial fetch - only run when projectId changes, not when fetchProgress changes
  useEffect(() => {
    fetchProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]) // Only depend on projectId to avoid re-fetching when fetchProgress changes

  const handleStartConcept = useCallback(async (conceptId: string) => {
    try {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      await startConcept(projectId, conceptId, token)
      await fetchProgress()
    } catch (err) {
      throw err
    }
  }, [projectId, fetchProgress, getToken])

  const handleCompleteConcept = useCallback(async (conceptId: string) => {
    try {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      await completeConcept(projectId, conceptId, token)
      await fetchProgress()
    } catch (err) {
      throw err
    }
  }, [projectId, fetchProgress, getToken])

  const handleStartDay = useCallback(async (dayId: string) => {
    try {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      await startDay(projectId, dayId, token)
      await fetchProgress()
    } catch (err) {
      throw err
    }
  }, [projectId, fetchProgress, getToken])

  const handleCompleteDay = useCallback(async (dayId: string) => {
    try {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      await completeDay(projectId, dayId, token)
      await fetchProgress()
    } catch (err) {
      throw err
    }
  }, [projectId, fetchProgress, getToken])

  // Use useRef to create a stable refetch function that doesn't change
  const refetchRef = useRef(fetchProgress)
  refetchRef.current = fetchProgress
  
  const stableRefetch = useCallback(async () => {
    await refetchRef.current()
  }, []) // Empty deps - function reference never changes

  return {
    progress,
    current,
    loading,
    error,
    refetch: stableRefetch,
    startConcept: handleStartConcept,
    completeConcept: handleCompleteConcept,
    startDay: handleStartDay,
    completeDay: handleCompleteDay,
  }
}

