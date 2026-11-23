"use client";

import { ErrorState } from "@/components/ui/Misc";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <ErrorState
        title="Something went wrong"
        description={error.message || "An unexpected error occurred while rendering this page."}
        onRetry={reset}
        className="w-full max-w-md"
      />
    </main>
  );
}
