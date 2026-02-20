"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AuthSyncError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
      <div className="max-w-md text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-white">Account sync issue</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          We couldn&apos;t sync your account with our backend. This usually
          happens when the backend&apos;s Clerk key doesn&apos;t match your
          sign-in app. Try signing out and signing in again. If it persists,
          ensure
          <code className="text-zinc-500 mx-1 px-1.5 py-0.5 rounded bg-zinc-800 text-xs">
            CLERK_SECRET_KEY
          </code>
          in the backend matches your frontend Clerk app.
        </p>
        <SignOutButton>
          <Button
            variant="outline"
            className="mt-4 border-zinc-600 text-white hover:bg-zinc-800"
          >
            Sign out and try again
          </Button>
        </SignOutButton>
      </div>
    </div>
  );
}
