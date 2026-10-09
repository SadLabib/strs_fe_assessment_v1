import Link from "next/link";
import { SearchXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <SearchXIcon className="size-10 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This property, attempt or page doesn&apos;t exist. The training data
          may have been reset.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
