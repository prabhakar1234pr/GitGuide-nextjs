"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type NavStartType = "pushState" | "replaceState" | "popstate";

type NavStartDetail = {
  ts: number;
  type: NavStartType;
  to?: string;
};

declare global {
  interface Window {
    __gitguidePerf?: {
      patched?: boolean;
      lastNavStart?: NavStartDetail;
      logs?: Array<
        | { kind: "initial-load"; url: string; ms: number }
        | { kind: "route-change"; to: string; from?: string; ms: number; startType?: NavStartType }
      >;
    };
  }
}

const NAV_START_EVENT = "gitguide:navigation-start";

function ensureHistoryPatched() {
  if (typeof window === "undefined") return;
  window.__gitguidePerf ??= { logs: [] };
  if (window.__gitguidePerf.patched) return;

  const emit = (detail: NavStartDetail) => {
    window.__gitguidePerf!.lastNavStart = detail;
    window.dispatchEvent(new CustomEvent<NavStartDetail>(NAV_START_EVENT, { detail }));
  };

  const { history } = window;
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function pushStatePatched(...args) {
    const to = typeof args[2] === "string" ? args[2] : undefined;
    emit({ ts: performance.now(), type: "pushState", to });
    return originalPushState.apply(this, args as unknown as Parameters<History["pushState"]>);
  };

  history.replaceState = function replaceStatePatched(...args) {
    const to = typeof args[2] === "string" ? args[2] : undefined;
    emit({ ts: performance.now(), type: "replaceState", to });
    return originalReplaceState.apply(this, args as unknown as Parameters<History["replaceState"]>);
  };

  window.addEventListener("popstate", () => {
    emit({ ts: performance.now(), type: "popstate", to: window.location.pathname });
  });

  window.__gitguidePerf.patched = true;
}

function logInitialLoad() {
  if (typeof performance.getEntriesByType !== "function") return;

  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return;

  const ms = Math.round(nav.duration);
  window.__gitguidePerf?.logs?.push({ kind: "initial-load", url: window.location.pathname, ms });
  console.info("[perf] initial-load", { url: window.location.pathname, ms });
}

export function RoutePerformanceLogger() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | undefined>(undefined);
  const lastStartRef = useRef<NavStartDetail | undefined>(undefined);

  useEffect(() => {
    ensureHistoryPatched();
    logInitialLoad();

    const handler = (evt: Event) => {
      const e = evt as CustomEvent<NavStartDetail>;
      lastStartRef.current = e.detail;
    };

    window.addEventListener(NAV_START_EVENT, handler);
    return () => window.removeEventListener(NAV_START_EVENT, handler);
  }, []);

  useEffect(() => {
    const from = lastPathRef.current;
    const start = lastStartRef.current ?? window.__gitguidePerf?.lastNavStart;
    lastPathRef.current = pathname;

    if (!start) return;
    const ms = Math.max(0, Math.round(performance.now() - start.ts));

    window.__gitguidePerf ??= { logs: [] };
    window.__gitguidePerf.logs ??= [];
    window.__gitguidePerf.logs.push({
      kind: "route-change",
      to: pathname,
      from,
      ms,
      startType: start.type,
    });

    console.info("[perf] route-change", { from, to: pathname, ms, startType: start.type });
  }, [pathname]);

  return null;
}


