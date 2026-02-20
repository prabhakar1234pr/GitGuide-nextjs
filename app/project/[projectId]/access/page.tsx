"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  grantProjectAccess,
  listProjectAccess,
  revokeProjectAccess,
} from "@/app/lib/api-client";
import { ArrowLeft, Loader2, UserPlus, Trash2 } from "lucide-react";

export default function GrantAccessPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const projectId = params.projectId as string;

  const [email, setEmail] = useState("");
  const [accessList, setAccessList] = useState<
    { user_id: string; email: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccess = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await listProjectAccess(projectId, token);
      if (res.success && res.access_list) {
        setAccessList(res.access_list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load access");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccess();
  }, [projectId]);

  const handleGrant = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setAdding(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      await grantProjectAccess(projectId, trimmed, token);
      setEmail("");
      await loadAccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to grant access");
    } finally {
      setAdding(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await revokeProjectAccess(projectId, userId, token);
      await loadAccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke access");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <Link
          href={`/project/${projectId}`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to project
        </Link>

        <h1 className="text-2xl font-semibold mb-2">Grant access</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Add employees by email so they can access this project and complete
          tasks.
        </p>

        <div className="flex gap-2 mb-8">
          <Input
            type="email"
            placeholder="employee@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGrant()}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          />
          <Button
            onClick={handleGrant}
            disabled={adding || !email.trim()}
            className="shrink-0"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
          People with access
        </h2>
        {accessList.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No one has been granted access yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {accessList.map(({ user_id, email: em }) => (
              <li
                key={user_id}
                className="flex items-center justify-between py-2 px-3 bg-zinc-900 rounded-lg border border-zinc-800"
              >
                <span className="text-zinc-200">{em}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => handleRevoke(user_id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
