"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface JobTabsNavProps {
  jobId: string;
}

export function JobTabsNav({ jobId }: JobTabsNavProps) {
  const pathname = usePathname();
  const base = `/jobs/${jobId}`;

  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/leads`, label: "Leads" },
    { href: `${base}/activity`, label: "Activity" },
    { href: `${base}/export`, label: "Export" },
  ];

  return (
    <nav
      aria-label="Job tabs"
      className="flex gap-0"
    >
      {tabs.map(({ href, label }) => {
        const isActive =
          href === base ? pathname === base : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
