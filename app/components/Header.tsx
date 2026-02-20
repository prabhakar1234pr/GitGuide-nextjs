"use client";

import { UserButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout, User } from "lucide-react";

export default function Header() {
  const { isLoaded, userId } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05060a]/70 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={isLoaded && userId ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Layout className="w-5 h-5 text-white/95" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">
            GitGuide
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {!isLoaded ? (
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-4 bg-white/10" />
              <Skeleton className="w-24 h-10 bg-white/10 rounded-full" />
            </div>
          ) : (
            <>
              <SignedOut>
                <Button
                  variant="ghost"
                  asChild
                  className="text-white/70 hover:text-white hover:bg-white/10 px-3 h-10 text-[13px]"
                >
                  <Link href="/access">Sign in</Link>
                </Button>
                <Button
                  asChild
                  className="bg-white text-black hover:bg-white/90 rounded-full px-6 h-10 text-[13px] font-semibold"
                >
                  <Link href="/access">Sign up</Link>
                </Button>
              </SignedOut>

              <SignedIn>
                <Button
                  variant="ghost"
                  asChild
                  className="text-white/70 hover:text-white hover:bg-white/10 px-3 h-10 text-[13px]"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <div className="pl-3 border-l border-white/10 ml-3 flex items-center relative">
                  <UserButton
                    appearance={{
                      elements: {
                        rootBox: "flex items-center justify-center",
                        userButtonTrigger:
                          "focus:outline-none focus:ring-2 focus:ring-sky-500/30 rounded-full transition-all hover:scale-105 active:scale-95",
                        avatarBox:
                          "w-8 h-8 rounded-full flex items-center justify-center border border-white/10 bg-white/10 shadow-lg",
                        userButtonAvatarBox: "hidden",
                        userButtonAvatarImage: "hidden",
                        userButtonPopoverCard:
                          "bg-[#0b0c10] border border-white/10 shadow-2xl rounded-xl overflow-hidden min-w-[240px]",
                        userButtonPopoverActionButton:
                          "hover:bg-white/10 text-white/70 hover:text-white transition-colors py-3 px-4",
                        userButtonPopoverActionButtonText:
                          "text-[10px] font-bold uppercase tracking-[0.1em]",
                        userButtonPopoverFooter: "gg-clerk-userbutton-footer",
                        userPreview:
                          "text-white px-5 py-4 border-b border-white/10 bg-white/5",
                        userPreviewMainIdentifier:
                          "text-sm font-bold tracking-tight",
                        userPreviewSecondaryIdentifier:
                          "text-[11px] text-white/40 font-medium",
                      },
                    }}
                  />
                  <div className="absolute inset-0 left-3 flex items-center justify-center pointer-events-none">
                    <User className="w-4 h-4 text-white/80" />
                  </div>
                </div>
              </SignedIn>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
