'use client'

import { type Concept, type ConceptDetails } from '../../lib/api-roadmap'
import ConceptCard from './ConceptCard'
import ConceptDetailPanel from './ConceptDetailPanel'

interface KanbanBoardProps {
  concepts: Concept[]
  currentConceptId: string | null
  conceptProgressMap: Record<string, { progress_status: string; content_read?: boolean }>
  projectId: string
  taskProgress: Record<string, { progress_status: string }>
  onConceptClick: (conceptId: string) => void
  onStartConcept: (conceptId: string) => Promise<void>
  onCompleteConcept: (conceptId: string) => Promise<void>
  conceptDetails: ConceptDetails | null
  loadingDetails: boolean
  onProgressChange: () => Promise<void>
}

export default function KanbanBoard({
  concepts,
  currentConceptId,
  conceptProgressMap,
  projectId,
  taskProgress,
  onConceptClick,
  onStartConcept,
  onCompleteConcept,
  conceptDetails,
  loadingDetails,
  onProgressChange,
}: KanbanBoardProps) {
  const getConceptStatus = (concept: Concept): string => {
    const progress = conceptProgressMap[concept.concept_id]
    return progress?.progress_status || 'todo'
  }

  const todoConcepts = concepts.filter(c => getConceptStatus(c) === 'todo')
  const doingConcepts = concepts.filter(c => getConceptStatus(c) === 'doing')
  const doneConcepts = concepts.filter(c => getConceptStatus(c) === 'done')

  return (
    <div className="grid grid-cols-3 gap-3 h-[calc(100vh-280px)]">
      {/* To Do Column */}
      <div className="flex flex-col h-full">
        <div className="bg-[#3f4449] rounded-t-lg px-2 py-1.5 border-b border-white/10 flex-shrink-0">
          <h3 className="text-xs font-semibold text-white">To Do</h3>
          <p className="text-[10px] text-zinc-400">{todoConcepts.length} concepts</p>
        </div>
        <div className="bg-[#3f4449] rounded-b-lg p-2 space-y-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
          {todoConcepts.map((concept) => (
            <ConceptCard
              key={concept.concept_id}
              concept={concept}
              onClick={() => onConceptClick(concept.concept_id)}
            />
          ))}
          {todoConcepts.length === 0 && (
            <div className="text-center text-zinc-500 text-[10px] py-4">
              <p>No concepts to do</p>
            </div>
          )}
        </div>
      </div>

      {/* Doing Column */}
      <div className="flex flex-col h-full">
        <div className="bg-[#3f4449] rounded-t-lg px-2 py-1.5 border-b border-white/10 flex-shrink-0">
          <h3 className="text-xs font-semibold text-white">Doing</h3>
          <p className="text-[10px] text-zinc-400">{doingConcepts.length} concept{doingConcepts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-[#3f4449] rounded-b-lg p-2 space-y-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
          {doingConcepts.map((concept) => (
            <div key={concept.concept_id}>
              {currentConceptId === concept.concept_id ? (
                <ConceptDetailPanel
                  conceptDetails={conceptDetails}
                  loading={loadingDetails}
                  projectId={projectId}
                  conceptProgress={conceptProgressMap}
                  taskProgress={taskProgress}
                  onStart={() => onStartConcept(concept.concept_id)}
                  onComplete={() => onCompleteConcept(concept.concept_id)}
                  onProgressChange={onProgressChange}
                  isLastConcept={concepts[concepts.length - 1]?.concept_id === concept.concept_id}
                />
              ) : (
                <ConceptCard
                  concept={concept}
                  onClick={() => onConceptClick(concept.concept_id)}
                />
              )}
            </div>
          ))}
          {doingConcepts.length === 0 && (
            <div className="text-center text-zinc-500 text-[10px] py-4">
              <p>Click a concept to start</p>
            </div>
          )}
        </div>
      </div>

      {/* Done Column */}
      <div className="flex flex-col h-full">
        <div className="bg-[#3f4449] rounded-t-lg px-2 py-1.5 border-b border-white/10 flex-shrink-0">
          <h3 className="text-xs font-semibold text-white">Done</h3>
          <p className="text-[10px] text-zinc-400">{doneConcepts.length} concepts</p>
        </div>
        <div className="bg-[#3f4449] rounded-b-lg p-2 space-y-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800">
          {doneConcepts.map((concept) => (
            <ConceptCard
              key={concept.concept_id}
              concept={concept}
              onClick={() => onConceptClick(concept.concept_id)}
              completed
            />
          ))}
          {doneConcepts.length === 0 && (
            <div className="text-center text-zinc-500 text-[10px] py-4">
              <p>Completed concepts appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
