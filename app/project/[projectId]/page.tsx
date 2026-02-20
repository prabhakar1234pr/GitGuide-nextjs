import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import RoadmapPage from "../../components/roadmap/RoadmapPage";
import { getProject, syncUser, type Project } from "../../lib/api";

// Force dynamic rendering to prevent caching issues
export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

// Error state component
function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-[#3a3f44]/80 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 text-center">
          {/* Error icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-white mb-3">
            Project Not Found
          </h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            {error ||
              "We couldn't load this project. It may have been deleted or you may not have access to it."}
          </p>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-900 bg-white hover:bg-zinc-100 rounded-xl transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Sync user data to database when they access any protected page
  try {
    await syncUser();
  } catch (error) {
    // Log error but don't block the page - user can still use the app
    console.error("Failed to sync user to database:", error);
  }

  // Await params in Next.js 16
  const { projectId } = await params;

  if (!projectId) {
    redirect("/dashboard");
  }

  let project: Project | null = null;
  let error: string | null = null;

  try {
    const response = await getProject(projectId);
    if (response.success) {
      project = response.project;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load project";
  }

  if (error || !project) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#2a2e32]">
          {/* Subtle background pattern */}
          <div
            className="fixed inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
          <ErrorState error={error || "Project could not be loaded"} />
        </main>
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#2a2e32] overflow-hidden">
      <Header />
      <main className="flex-1 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div
          className="fixed inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="h-full max-w-[1600px] mx-auto flex flex-col">
          {/* Main Content */}
          <div className="flex-1 px-4 md:px-6 py-3 overflow-hidden">
            <RoadmapPage
              projectId={projectId}
              isOwner={project.is_owner === true}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
