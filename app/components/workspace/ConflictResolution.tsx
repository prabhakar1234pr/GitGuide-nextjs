'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle, CheckCircle2, Loader2, FileText } from 'lucide-react'
import MonacoEditor from './MonacoEditor'

interface ConflictResolutionProps {
  conflicts: string[]
  onResolve: (filePath: string, side: 'ours' | 'theirs' | 'both', content?: string) => Promise<void>
  onGetContent: (filePath: string) => Promise<string>
  onWriteFile: (filePath: string, content: string) => Promise<void>
  isLoading?: boolean
}

export default function ConflictResolution({
  conflicts,
  onResolve,
  onGetContent,
  onWriteFile,
  isLoading = false
}: ConflictResolutionProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [resolvedContent, setResolvedContent] = useState<string>('')
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    if (selectedFile && showEditor) {
      loadFileContent()
    }
  }, [selectedFile, showEditor])

  const loadFileContent = async () => {
    if (!selectedFile) return
    setIsLoadingContent(true)
    try {
      const content = await onGetContent(selectedFile)
      setFileContent(content)
      setResolvedContent(content)
    } catch (err) {
      console.error('Failed to load conflict content:', err)
    } finally {
      setIsLoadingContent(false)
    }
  }

  const handleResolve = async (side: 'ours' | 'theirs' | 'both') => {
    if (!selectedFile) return
    
    setIsResolving(true)
    try {
      if (side === 'both') {
        // Write the resolved content first
        await onWriteFile(selectedFile, resolvedContent)
      }
      await onResolve(selectedFile, side, side === 'both' ? resolvedContent : undefined)
      setShowEditor(false)
      setSelectedFile(null)
    } catch (err) {
      console.error('Failed to resolve conflict:', err)
    } finally {
      setIsResolving(false)
    }
  }

  const parseConflictMarkers = (content: string) => {
    const lines = content.split('\n')
    type Section = { type: 'ours' | 'theirs' | 'both' | 'context'; content: string; startLine: number; endLine: number }
    const sections: Section[] = []
    let currentSection: Section | null = null
    
    lines.forEach((line, index) => {
      if (line.startsWith('<<<<<<<')) {
        if (currentSection) {
          currentSection.endLine = index - 1
          sections.push(currentSection)
        }
        currentSection = { type: 'ours', content: '', startLine: index, endLine: index }
      } else if (line.startsWith('=======')) {
        if (currentSection) {
          currentSection.endLine = index - 1
          sections.push(currentSection)
          currentSection = { type: 'theirs', content: '', startLine: index, endLine: index }
        }
      } else if (line.startsWith('>>>>>>>')) {
        if (currentSection) {
          currentSection.endLine = index - 1
          sections.push(currentSection)
        }
        currentSection = null
      } else if (currentSection) {
        currentSection.content += line + '\n'
      } else {
        if (sections.length === 0 || sections[sections.length - 1].type !== 'context') {
          sections.push({ type: 'context', content: line + '\n', startLine: index, endLine: index })
        } else {
          sections[sections.length - 1].content += line + '\n'
          sections[sections.length - 1].endLine = index
        }
      }
    })
    
    if (currentSection !== null) {
      (currentSection as Section).endLine = lines.length - 1
      sections.push(currentSection as Section)
    }
    
    return sections
  }

  if (conflicts.length === 0) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-zinc-300">No conflicts detected</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Merge Conflicts ({conflicts.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="p-3 space-y-2">
              {conflicts.map((file) => (
                <div
                  key={file}
                  className={`
                    flex items-center justify-between p-2 rounded border cursor-pointer transition-colors
                    ${selectedFile === file
                      ? 'bg-yellow-500/10 border-yellow-500/50'
                      : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
                    }
                  `}
                  onClick={() => {
                    setSelectedFile(file)
                    setShowEditor(true)
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                    <span className="text-[11px] font-mono text-zinc-300 truncate">
                      {file}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-yellow-500 border-yellow-500/30">
                    Conflict
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conflict Resolution Dialog */}
      {selectedFile && (
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogContent className="bg-[#0c0c0e] border border-zinc-800 max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Resolve Conflict: {selectedFile}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {isLoadingContent ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="mb-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve('ours')}
                      disabled={isResolving}
                      className="h-7 text-[10px] border-zinc-700 text-zinc-300"
                    >
                      Use Ours
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve('theirs')}
                      disabled={isResolving}
                      className="h-7 text-[10px] border-zinc-700 text-zinc-300"
                    >
                      Use Theirs
                    </Button>
                    <Badge variant="outline" className="text-[9px] px-2 py-0 text-zinc-500 border-zinc-700 ml-auto">
                      Manual resolution required
                    </Badge>
                  </div>
                  <div className="flex-1 border border-zinc-800 rounded">
                    <MonacoEditor
                      value={resolvedContent}
                      onChange={setResolvedContent}
                      path={selectedFile}
                      readOnly={false}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditor(false)
                  setSelectedFile(null)
                }}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleResolve('both')}
                disabled={isResolving || isLoadingContent}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {isResolving ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  'Resolve Manually'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
