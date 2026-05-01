import { Button } from "@/components/ui/button";
import type { FallbackProps } from "react-error-boundary";

export default function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <main className="container py-12">
      <div className="mx-auto max-w-lg rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold">Something went wrong.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Unknown error."}
        </p>
        <Button className="mt-4" onClick={resetErrorBoundary}>
          Try again
        </Button>
      </div>
    </main>
  );
}
