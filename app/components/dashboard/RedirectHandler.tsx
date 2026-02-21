"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectHandler({ redirect }: { redirect: string }) {
  const router = useRouter();

  useEffect(() => {
    if (redirect && redirect.startsWith("/")) {
      router.replace(redirect);
    }
  }, [redirect, router]);

  return null;
}
