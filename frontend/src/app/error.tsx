"use client";

import { useEffect } from "react";
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center"
    >
      <TriangleAlertIcon className="size-10 text-warning" aria-hidden />
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this page. Check that the training API is
          running, then try again.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={() => retry()}>
        <RotateCwIcon data-icon="inline-start" aria-hidden />
        Try again
      </Button>
    </div>
  );
}
