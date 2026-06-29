"use client";

/**
 * ClerkAuthSync — Bridges Clerk's authentication with the Zustand auth store.
 *
 * Place this component inside <ClerkProvider> in your root layout.
 * It listens for Clerk auth state changes and syncs them to the
 * existing Zustand store so all existing code continues to work.
 */

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/store/auth-store";

export function ClerkAuthSync() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const syncClerkUser = useAuthStore((s) => s.syncClerkUser);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);
  const lastSyncedId = useRef<string | null>(null);

  useEffect(() => {
    if (!clerkLoaded) {
      setLoading(true);
      return;
    }

    if (isSignedIn && clerkUser) {
      // Only sync if the user ID changed (prevents infinite loops)
      if (lastSyncedId.current === clerkUser.id) return;
      lastSyncedId.current = clerkUser.id;

      syncClerkUser({
        id: clerkUser.id,
        emailAddress: clerkUser.primaryEmailAddress?.emailAddress || "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      });
    } else if (clerkLoaded && !isSignedIn) {
      // User signed out of Clerk — clear our store too
      lastSyncedId.current = null;
      logout();
      setLoading(false);
    }
  }, [clerkLoaded, isSignedIn, clerkUser, syncClerkUser, logout, setLoading]);

  // This component renders nothing — it's purely a sync bridge
  return null;
}
