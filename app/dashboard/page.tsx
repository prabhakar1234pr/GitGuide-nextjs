import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Header from "../components/Header";
import DashboardContent from "../components/dashboard/DashboardContent";
import AuthSyncError from "../components/dashboard/AuthSyncError";
import Loading from "./loading";
import Launching from "./launching";
import { getCurrentUser, listUserProjects, syncUser } from "../lib/api";
import { type Project } from "../lib/api";

function isUserNotFoundError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.toLowerCase().includes("user not found") ||
    msg.toLowerCase().includes("user not found in database")
  );
}

// Separate component for async data fetching
async function ProjectsLoader({ userRole }: { userRole?: string }) {
  let projects: Project[] = [];
  try {
    const response = await listUserProjects();
    if (response.success && response.projects) {
      projects = response.projects;
    }
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  }
  return <DashboardContent projects={projects} userRole={userRole} />;
}

async function waitForBackend() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const maxWaitMs = 15000;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${apiUrl}/api/health`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) return;
    } catch {
      // ignore and retry
    }
    // short backoff to avoid hammering backend during startup
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function BackendGate({ children }: { children: React.ReactNode }) {
  await waitForBackend();
  return <>{children}</>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const role =
    params.role === "manager" || params.role === "employee"
      ? params.role
      : undefined;

  // Sync user data to database when they access the dashboard (include role from sign-up redirect)
  let authSyncFailed = false;
  try {
    await syncUser(role);
  } catch (error) {
    console.error("Failed to sync user to database:", error);
    if (isUserNotFoundError(error)) authSyncFailed = true;
  }

  let userRole: string | undefined = role;
  if (!authSyncFailed) {
    try {
      const userRes = await getCurrentUser();
      if (userRes.success && userRes.user?.role) {
        userRole = userRes.user.role;
      }
    } catch (error) {
      if (isUserNotFoundError(error)) authSyncFailed = true;
      userRole = role;
    }
  }

  if (authSyncFailed) {
    return (
      <>
        <Header />
        <AuthSyncError />
      </>
    );
  }

  return (
    <>
      <Header />
      <Suspense fallback={<Launching />}>
        <BackendGate>
          <Suspense fallback={<Loading />}>
            <ProjectsLoader userRole={userRole} />
          </Suspense>
        </BackendGate>
      </Suspense>
    </>
  );
}
