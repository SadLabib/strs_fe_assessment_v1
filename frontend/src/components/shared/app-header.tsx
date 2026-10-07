import Link from "next/link";

export function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-baseline gap-2 rounded-sm font-heading text-lg font-bold tracking-tight focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
        >
          STR Search
          <span className="text-sm font-semibold text-cta">Training</span>
        </Link>
      </div>
    </header>
  );
}
