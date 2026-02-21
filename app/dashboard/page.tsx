import { auth } from "@clerk/nextjs/server";
import { redirect as nextRedirect } from "next/navigation";
import { Suspense } from "react";
import Header from "../components/Header";
import DashboardContent from "../components/dashboard/DashboardContent";
import AuthSyncError from "../components/dashboard/AuthSyncError";
import RedirectHandler from "../components/dashboard/RedirectHandler";
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

function isRoleConflictError(error: unknown): {
  isRoleConflict: boolean;
  message?: string;
} {
  const msg = error instanceof Error ? error.message : String(error);
  const isRoleConflict =
    msg.includes("registered as a manager") ||
    msg.includes("registered as a employee") ||
    msg.includes("already registered as") ||
    msg.includes("cannot create a new account with a different role");
  return { isRoleConflict, message: msg };
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
  searchParams: Promise<{ role?: string; redirect?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    nextRedirect("/sign-in");
  }

  const params = await searchParams;
  const role =
    params.role === "manager" || params.role === "employee"
      ? params.role
      : undefined;
  const redirect = params.redirect;

  // Wait for backend before sync/user calls (same as BackendGate)
  await waitForBackend();

  // Sync user data to database when they access the dashboard (include role from sign-up redirect)
  let authSyncFailed = false;
  let roleConflictMessage: string | undefined;
  try {
    await syncUser(role);
  } catch (error) {
    console.error("Failed to sync user to database:", error);
    const roleCheck = isRoleConflictError(error);
    if (roleCheck.isRoleConflict) {
      authSyncFailed = true;
      roleConflictMessage = roleCheck.message;
    } else if (isUserNotFoundError(error)) {
      authSyncFailed = true;
    }
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
        {roleConflictMessage ? (
          <AuthSyncError isRoleConflict message={roleConflictMessage} />
        ) : (
          <AuthSyncError />
        )}
      </>
    );
  }

  return (
    <>
      {redirect && <RedirectHandler redirect={redirect} />}
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
