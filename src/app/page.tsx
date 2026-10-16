"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LightLanding } from "@/components/landing/LightLanding";

function AuthCodeRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    const next = searchParams.get("next");
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("code", code);
    callback.searchParams.set("next", next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    window.location.replace(callback.toString());
  }, [searchParams]);

  return null;
}

export default function HomePage() {
  return <Suspense fallback={null}><AuthCodeRedirect /><LightLanding /></Suspense>;
}
