"use client";

// ProtectedRoute.tsx
// gate pages that need login

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../store/hooks";
import PawLoader from "./PawLoader";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, ready } = useAppSelector((s) => s.account);
  const router = useRouter();

  useEffect(() => {
    if (ready && !currentUser) router.replace("/Account/Signin");
  }, [ready, currentUser, router]);

  if (!ready) return <PawLoader label="checking your pass…" />;
  if (!currentUser) return null;
  return <>{children}</>;
}
