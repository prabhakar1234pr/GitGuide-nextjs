"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center px-6">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mx-auto mb-4" />
            <p className="text-zinc-600">Loading…</p>
          </div>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const [error, setError] = useState<string | null>(
    token ? null : "Invalid invite link"
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/invite/validate?token=${encodeURIComponent(token)}`
        );
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok) {
          setError(data.detail || "Invalid or expired invite link");
          return;
        }

        const { redirect_to, project_id } = data;
        const projectUrl = `/project/${project_id}`;
        const redirectParam = `redirect_url=${encodeURIComponent(projectUrl)}`;

        if (redirect_to === "sign-in") {
          router.replace(`/sign-in?${redirectParam}`);
        } else {
          const dashboardWithRedirect = `/dashboard?redirect=${encodeURIComponent(projectUrl)}`;
          router.replace(
            `/sign-up?role=employee&redirect_url=${encodeURIComponent(dashboardWithRedirect)}`
          );
        }
      } catch {
        if (!cancelled) setError("Failed to validate invite");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">
            Invalid invite
          </h1>
          <p className="text-zinc-600">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-sky-600 hover:text-sky-700"
          >
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mx-auto mb-4" />
        <p className="text-zinc-600">Redirecting…</p>
      </div>
    </div>
  );
}
