import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowDown,
  ArrowUp,
  GitBranch,
  GitCommit,
  X,
  History,
  AlertTriangle,
  GitMerge,
} from "lucide-react";
import type {
  GitCommitEntry,
  GitStatusResponse,
  BranchInfo,
  CommitGraphEntry,
} from "../../lib/api-git";
import StagingArea from "./StagingArea";
import CommitHistoryGraph from "./CommitHistoryGraph";
import BranchManagement from "./BranchManagement";
import ConflictResolution from "./ConflictResolution";
import MergeBranches from "./MergeBranches";

interface GitPanelProps {
  status: GitStatusResponse | null;
  commits: GitCommitEntry[];
  isLoading?: boolean;
  readOnly?: boolean;
  onPull: () => void;
  onPush: () => void;
  onRefresh: () => void;
  onStage?: (files?: string[]) => Promise<void>;
  onUnstage?: (files?: string[]) => Promise<void>;
  onViewDiff?: (filePath: string, staged: boolean) => void;
  // Commit history
  commitGraph?: CommitGraphEntry[];
  commitBranches?: Record<string, string>;
  onCommitClick?: (sha: string) => void;
  onResetToCommit?: (sha: string) => Promise<void>;
  // Branch management
  branches?: BranchInfo[];
  onCreateBranch?: (name: string, startPoint?: string) => Promise<void>;
  onCheckoutBranch?: (name: string, create?: boolean) => Promise<void>;
  onDeleteBranch?: (name: string, force?: boolean) => Promise<void>;
  // Conflict resolution
  conflicts?: string[];
  onResolveConflict?: (
    filePath: string,
    side: "ours" | "theirs" | "both",
    content?: string
  ) => Promise<void>;
  onGetConflictContent?: (filePath: string) => Promise<string>;
  onWriteFile?: (filePath: string, content: string) => Promise<void>;
  onMerge?: (branch: string, noFF: boolean, message?: string) => Promise<void>;
  onAbortMerge?: () => Promise<void>;
  onClose?: () => void;
}

export default function GitPanel({
  status,
  commits,
  isLoading,
  readOnly = false,
  onPull,
  onPush,
  onRefresh,
  onStage,
  onUnstage,
  onViewDiff,
  commitGraph = [],
  commitBranches = {},
  onCommitClick,
  onResetToCommit,
  branches = [],
  onCreateBranch,
  onCheckoutBranch,
  onDeleteBranch,
  conflicts = [],
  onResolveConflict,
  onGetConflictContent,
  onWriteFile,
  onMerge,
  onAbortMerge,
  onClose,
}: GitPanelProps) {
  const [activeTab, setActiveTab] = useState("status");
  const fileCount = useMemo(() => {
    if (!status) return 0;
    // Count unique files (deleted files are also in modified, so we need to deduplicate)
    const allFiles = new Set([
      ...(status.modified || []),
      ...(status.staged || []),
      ...(status.untracked || []),
      ...(status.deleted || []),
    ]);
    return allFiles.size;
  }, [status]);

  const isClean =
    fileCount === 0 &&
    (status?.ahead || 0) === 0 &&
    (status?.behind || 0) === 0;

  const hasConflicts = conflicts.length > 0;

  return (
    <Card className="bg-zinc-900/40 border-zinc-800 h-full flex flex-col">
      <CardContent className="p-4 flex flex-col flex-1 min-h-0">
        {readOnly && (
          <div className="mb-4 py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500/90 text-[11px] font-medium">
            Managers can&apos;t perform tasks — view only
          </div>
        )}
        <div className="flex items-center justify-between shrink-0 mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-zinc-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Git
            </span>
            {hasConflicts && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 text-yellow-500 border-yellow-500/30"
              >
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                Conflicts
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 text-zinc-500 hover:text-white"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-7 px-2 text-[10px] text-zinc-400 hover:text-white"
            >
              Refresh
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col flex-1 min-h-0"
        >
          <TabsList
            className={`flex w-full h-8 bg-zinc-800 shrink-0 gap-0.5 p-0.5 min-w-0`}
          >
            <TabsTrigger
              value="status"
              className="text-[10px] px-2 min-w-0 flex-1 flex items-center justify-center gap-1 overflow-hidden"
            >
              <span className="truncate whitespace-nowrap">Status</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-[10px] px-1.5 min-w-0 flex-1 flex items-center justify-center gap-1 overflow-hidden"
            >
              <History className="w-3 h-3 shrink-0" />
              <span className="truncate whitespace-nowrap min-w-0">
                History
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="branches"
              className="text-[10px] px-1.5 min-w-0 flex-1 flex items-center justify-center gap-1 overflow-hidden"
            >
              <GitBranch className="w-3 h-3 shrink-0" />
              <span className="truncate whitespace-nowrap min-w-0">
                Branches
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="merge"
              className="text-[10px] px-1.5 min-w-0 flex-1 flex items-center justify-center gap-1 overflow-hidden"
            >
              <GitMerge className="w-3 h-3 shrink-0" />
              <span className="truncate whitespace-nowrap min-w-0">Merge</span>
            </TabsTrigger>
            {hasConflicts && (
              <TabsTrigger
                value="conflicts"
                className="text-[10px] px-1.5 min-w-0 flex-1 flex items-center justify-center gap-1 text-yellow-500 overflow-hidden"
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="truncate whitespace-nowrap min-w-0">
                  Conflicts
                </span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent
            value="status"
            className="mt-4 flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="space-y-4 pr-4 pb-2">
                <div className="space-y-2 text-[11px] text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Branch</span>
                    <span className="font-mono">
                      {status?.branch || "unknown"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Changes</span>
                    <span className="font-mono">{fileCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Remote</span>
                    <span className="font-mono">
                      ↑ {status?.ahead || 0} / ↓ {status?.behind || 0}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPull}
                    disabled={isLoading || readOnly}
                    className="h-8 w-full border-zinc-800 text-zinc-300 hover:text-white"
                  >
                    <ArrowDown className="w-3.5 h-3.5 mr-1.5" />
                    Pull
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPush}
                    disabled={isLoading || readOnly}
                    className="h-8 w-full border-zinc-800 text-zinc-300 hover:text-white"
                  >
                    <ArrowUp className="w-3.5 h-3.5 mr-1.5" />
                    Push
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase tracking-widest ${isClean ? "text-emerald-400 border-emerald-500/20" : "text-yellow-500 border-yellow-500/20"}`}
                  >
                    {isClean ? "Clean" : "Changes"}
                  </Badge>
                  {isLoading && (
                    <span className="text-[10px] text-zinc-500">Updating…</span>
                  )}
                </div>

                {onStage && onUnstage && (
                  <div className="border-t border-zinc-800 pt-3">
                    <StagingArea
                      status={status}
                      onStage={onStage}
                      onUnstage={onUnstage}
                      onViewDiff={onViewDiff}
                      isLoading={isLoading}
                      readOnly={readOnly}
                    />
                  </div>
                )}

                <div className="border-t border-zinc-800 pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Recent Commits
                    </span>
                  </div>
                  <div className="space-y-2">
                    {commits.length === 0 && (
                      <div className="text-[11px] text-zinc-600">
                        No commits yet
                      </div>
                    )}
                    {commits.map((commit) => (
                      <div
                        key={commit.sha}
                        className="flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] text-zinc-300 truncate">
                            {commit.message}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {commit.sha.slice(0, 7)}
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-600 whitespace-nowrap">
                          {commit.author_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="history"
            className="mt-4 flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="pr-4 pb-2">
                <CommitHistoryGraph
                  commits={commitGraph}
                  branches={commitBranches}
                  currentBranch={status?.branch || undefined}
                  onCommitClick={onCommitClick}
                  onResetToCommit={onResetToCommit}
                  isLoading={isLoading}
                  readOnly={readOnly}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="branches"
            className="mt-4 flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="pr-4 pb-2">
                {onCreateBranch && onCheckoutBranch && onDeleteBranch ? (
                  <BranchManagement
                    branches={branches}
                    currentBranch={status?.branch || undefined}
                    onCreateBranch={onCreateBranch}
                    onCheckoutBranch={onCheckoutBranch}
                    onDeleteBranch={onDeleteBranch}
                    isLoading={isLoading}
                    readOnly={readOnly}
                  />
                ) : (
                  <div className="text-zinc-500 text-sm p-4 text-center">
                    Branch management not available
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="merge"
            className="mt-4 flex-1 min-h-0 overflow-hidden"
          >
            <ScrollArea className="h-full w-full">
              <div className="pr-4 pb-2">
                {onMerge ? (
                  <MergeBranches
                    branches={branches}
                    currentBranch={status?.branch || undefined}
                    onMerge={onMerge}
                    onAbortMerge={onAbortMerge || (async () => {})}
                    hasConflicts={hasConflicts}
                    isLoading={isLoading}
                    readOnly={readOnly}
                  />
                ) : (
                  <div className="text-zinc-500 text-sm p-4 text-center">
                    Merge functionality not available
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {hasConflicts && (
            <TabsContent
              value="conflicts"
              className="mt-4 flex-1 min-h-0 overflow-hidden"
            >
              <ScrollArea className="h-full w-full">
                <div className="pr-4 pb-2">
                  {onResolveConflict && onGetConflictContent && onWriteFile ? (
                    <ConflictResolution
                      conflicts={conflicts}
                      onResolve={onResolveConflict}
                      onGetContent={onGetConflictContent}
                      onWriteFile={onWriteFile}
                      isLoading={isLoading}
                      readOnly={readOnly}
                    />
                  ) : (
                    <div className="text-zinc-500 text-sm p-4 text-center">
                      Conflict resolution not available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
