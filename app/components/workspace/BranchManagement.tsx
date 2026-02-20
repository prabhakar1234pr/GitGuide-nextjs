"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GitBranch, Plus, Trash2, Check, Loader2 } from "lucide-react";
import type { BranchInfo } from "../../lib/api-git";

interface BranchManagementProps {
  branches: BranchInfo[];
  currentBranch?: string;
  onCreateBranch: (name: string, startPoint?: string) => Promise<void>;
  onCheckoutBranch: (name: string, create?: boolean) => Promise<void>;
  onDeleteBranch: (name: string, force?: boolean) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export default function BranchManagement({
  branches,
  currentBranch,
  onCreateBranch,
  onCheckoutBranch,
  onDeleteBranch,
  isLoading = false,
  readOnly = false,
}: BranchManagementProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [startPoint, setStartPoint] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    setIsCreating(true);
    try {
      await onCreateBranch(
        newBranchName.trim(),
        startPoint.trim() || undefined
      );
      setCreateDialogOpen(false);
      setNewBranchName("");
      setStartPoint("");
    } catch (err) {
      console.error("Failed to create branch:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBranch = async (force = false) => {
    if (!branchToDelete) return;

    // Prevent deleting current branch
    if (branchToDelete === currentBranch) {
      alert(
        `Cannot delete the current branch "${branchToDelete}". Please switch to another branch first.`
      );
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteBranch(branchToDelete, force);
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to delete branch: ${errorMsg}`);
      console.error("Failed to delete branch:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Branches
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="h-7 px-2 text-[10px] text-zinc-400 hover:text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="p-3 space-y-1">
              {branches.length === 0 ? (
                <div className="text-zinc-500 text-sm p-4 text-center">
                  No branches found
                </div>
              ) : (
                branches.map((branch) => (
                  <div
                    key={branch.name}
                    className={`
                      flex items-center justify-between p-2 rounded hover:bg-zinc-800/50
                      ${branch.current ? "bg-blue-500/10 border border-blue-500/30" : ""}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {branch.current && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 text-blue-400 border-blue-500/30"
                        >
                          Current
                        </Badge>
                      )}
                      <span className="text-[11px] font-mono text-zinc-300 truncate">
                        {branch.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {!branch.current && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onCheckoutBranch(branch.name)}
                            disabled={isLoading || readOnly}
                            className="h-6 w-6 text-zinc-500 hover:text-white"
                            title="Checkout"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setBranchToDelete(branch.name);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={isLoading || readOnly}
                            className="h-6 w-6 text-zinc-500 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Branch Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                Branch Name
              </label>
              <Input
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="feature/new-feature"
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newBranchName.trim()) {
                    handleCreateBranch();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                Start Point (optional)
              </label>
              <Input
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                placeholder="main, HEAD, or commit SHA"
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBranch}
              disabled={isCreating || !newBranchName.trim() || readOnly}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-zinc-300">
              Are you sure you want to delete branch{" "}
              <span className="font-mono text-blue-400">{branchToDelete}</span>?
            </p>
            {branchToDelete === currentBranch ? (
              <p className="text-xs text-red-400">
                ⚠️ Cannot delete the current branch. Switch to another branch
                first.
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                This action cannot be undone. Use force delete if the branch is
                not merged.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDeleteBranch(false)}
              disabled={
                isDeleting || branchToDelete === currentBranch || readOnly
              }
              className="border-zinc-700 text-zinc-300 hover:text-white"
            >
              Delete
            </Button>
            <Button
              onClick={() => handleDeleteBranch(true)}
              disabled={
                isDeleting || branchToDelete === currentBranch || readOnly
              }
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Force Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
