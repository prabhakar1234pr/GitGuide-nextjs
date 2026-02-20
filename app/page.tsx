import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import Header from "./components/Header";
import HeroCanvas from "./components/landing/HeroCanvas";
import ExplainerVideo from "./components/landing/ExplainerVideo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Code2 } from "lucide-react";

export default function Home() {
  return (
    <>
      <Header />
      <HeroCanvas />
      <main className="relative min-h-screen text-white" style={{ zIndex: 1 }}>
        {/* Hero */}
        <section className="relative min-h-screen flex items-center">
          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                Stop watching Tutorials,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500">
                  start building projects.
                </span>
              </h1>

              <div className="flex flex-col sm:flex-row gap-4">
                <SignedOut>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-14 text-base font-semibold shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]"
                  >
                    <Link href="/access">
                      Sign in <ArrowRight className="ml-2 size-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white h-14 px-8 text-base backdrop-blur-sm"
                  >
                    <Link href="/access">Sign up</Link>
                  </Button>
                </SignedOut>

                <SignedIn>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-14 text-base font-semibold shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                  >
                    <Link href="/dashboard">
                      Go to dashboard <ArrowRight className="ml-2 size-5" />
                    </Link>
                  </Button>
                </SignedIn>
              </div>
            </div>
          </div>
        </section>

        {/* Value props - Second milestone */}
        <section className="relative py-32">
          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Three steps to mastery.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-sky-500/30 transition-all backdrop-blur-sm">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-sky-500/25">
                  <Zap className="size-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Roadmap in minutes
                </h3>
                <p className="text-white/60 leading-relaxed">
                  Turn any repository into a clear, day-by-day plan with
                  concepts and tasks—built from the codebase, not guesswork.
                </p>
              </div>

              <div className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 transition-all backdrop-blur-sm">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/25">
                  <Brain className="size-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Answers from your repo
                </h3>
                <p className="text-white/60 leading-relaxed">
                  Ask about any file or flow and get repo-grounded answers that
                  stay tied to what’s actually in the code.
                </p>
              </div>

              <div className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all backdrop-blur-sm">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25">
                  <Code2 className="size-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Build while you learn
                </h3>
                <p className="text-white/60 leading-relaxed">
                  Use a real workspace—editor, terminal, git, preview—to
                  complete tasks and ship changes with confidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo video - Third milestone */}
        <section id="demo" className="relative py-32">
          <div className="relative max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center">
              From repo URL to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-500">
                productive learning.
              </span>
            </h2>

            <div className="mt-10 max-w-6xl mx-auto">
              <ExplainerVideo />
            </div>
          </div>
        </section>

        {/* Final CTA - End of journey */}
        <section className="relative py-32">
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Ready to master any codebase?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 rounded-full px-10 h-14 text-base font-semibold shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                >
                  <Link href="/access">Sign in</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white h-14 px-10 text-base font-semibold"
                >
                  <Link href="/access">Sign up</Link>
                </Button>
              </SignedOut>

              <SignedIn>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 rounded-full px-10 h-14 text-base font-semibold"
                >
                  <Link href="/dashboard">
                    Go to dashboard <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              </SignedIn>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-white/10 py-8">
          <div className="relative max-w-7xl mx-auto px-6 text-center text-sm text-white/40">
            GitGuide — Learn codebases, not documentation.
          </div>
        </footer>
      </main>
    </>
  );
}
