"use client";

import * as React from "react";

/**
 * Minimal Tooltip implementation (no external dependency).
 *
 * This exists to satisfy imports like `@/components/ui/tooltip` during builds.
 * It provides a basic native `title` tooltip behavior via `TooltipTrigger`.
 */

type TooltipContextValue = {
  title: string | undefined;
  setTitle: (title: string | undefined) => void;
};

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = React.useState<string | undefined>(undefined);
  return (
    <TooltipContext.Provider value={{ title, setTitle }}>
      {children}
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TooltipContext);
  const title = ctx?.title;

  if (asChild && React.isValidElement(children)) {
    const el = children as React.ReactElement<{ title?: string }>;
    const existingTitle = el.props.title;
    return React.cloneElement(el, {
      title: existingTitle ?? title,
      "data-slot": "tooltip-trigger",
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <span data-slot="tooltip-trigger" title={title}>
      {children}
    </span>
  );
}

function TooltipContent({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(TooltipContext);

  React.useEffect(() => {
    if (!ctx) return;

    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children)
          ? children
              .filter((c) => typeof c === "string")
              .join(" ")
              .trim()
          : undefined;

    ctx.setTitle(text || undefined);
  }, [children, ctx]);

  return null;
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
