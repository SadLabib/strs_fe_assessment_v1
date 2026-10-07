import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";

import { AppHeader } from "@/components/shared/app-header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "Underwriting Training | STR Search",
    template: "%s | STR Search Training",
  },
  description:
    "Practice underwriting short-term rentals and see how your revenue forecast compares with an analyst's.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn(inter.variable, montserrat.variable)}>
      {/* Browser extensions (ColorZilla, Grammarly…) add attributes to <body>
          before React hydrates. This only silences attribute diffs on <body>. */}
      <body
        suppressHydrationWarning
        className="flex min-h-dvh flex-col bg-muted antialiased"
      >
        <AppHeader />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
