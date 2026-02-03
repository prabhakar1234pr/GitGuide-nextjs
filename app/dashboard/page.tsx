import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Header from "../components/Header";
import DashboardContent from "../components/dashboard/DashboardContent";
import Loading from "./loading";
import Launching from "./launching";
import { listUserProjects, syncUser } from "../lib/api";
import { type Project } from "../lib/api";

// Separate component for async data fetching
async function ProjectsLoader() {
  let projects: Project[] = [];
  try {
    const response = await listUserProjects();
    if (response.success && response.projects) {
      projects = response.projects;
    }
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  }
  return <DashboardContent projects={projects} />;
}

async function waitForBackend() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Wait briefly for backend to come up (hot reload / docker startup).
  // If it doesn't, we still render the page (dashboard will degrade gracefully).
  await waitForBackend();

  // Sync user data to database when they access the dashboard
  try {
    await syncUser();
  } catch (error) {
    // Log error but don't block the page - user can still use the app
    console.error("Failed to sync user to database:", error);
  }

  return (
    <>
      <Header />
      <Suspense fallback={<Launching />}>
        <Suspense fallback={<Loading />}>
          <ProjectsLoader />
        </Suspense>
      </Suspense>
    </>
  );
}
