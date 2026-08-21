import {
  Bell,
  ChevronDown,
  PanelLeft,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { PRODUCT_NAME } from "@/config/product";
import { navItems } from "@/lib/app-data";
import type { AuthenticatedUser } from "@/lib/auth/session";

export function AppShell({
  children,
  user,
}: Readonly<{ children: React.ReactNode; user: AuthenticatedUser }>) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen lg:grid-cols-[264px_1fr]">
        <aside className="hidden border-r border-[var(--border)] bg-[#20231f] text-white lg:block">
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#99f6e4] text-[#134e4a]">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs text-white/60">Product memory</p>
              <p className="font-semibold">{PRODUCT_NAME}</p>
            </div>
          </div>

          <div className="border-b border-white/10 p-3">
            <div className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-sm">
              <span>
                <span className="block text-xs text-white/55">Current product</span>
                <span className="block font-medium">Nextzen Ops</span>
              </span>
              <ChevronDown className="h-4 w-4 text-white/60" aria-hidden />
            </div>
          </div>

          <nav className="space-y-1 p-3" aria-label="Primary navigation">
            {navItems.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/78 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="border-b border-[var(--border)] bg-[var(--panel)] px-4">
            <div className="flex min-h-16 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <details className="relative lg:hidden">
                  <summary
                    aria-label="Open navigation"
                    className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-[var(--border)] bg-white text-[var(--muted-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#99f6e4] [&::-webkit-details-marker]:hidden"
                  >
                    <PanelLeft className="h-4 w-4" aria-hidden />
                  </summary>
                  <div className="absolute left-0 top-11 z-40 w-[min(88vw,320px)] rounded-md border border-[var(--border)] bg-[#20231f] p-3 text-white shadow-xl">
                    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      <span className="block text-xs text-white/55">Current product</span>
                      <span className="block text-sm font-medium">Nextzen Ops</span>
                    </div>
                    <nav className="mt-3 space-y-1" aria-label="Mobile primary navigation">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/78 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                        >
                          <item.icon className="h-4 w-4" aria-hidden />
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                  </div>
                </details>
                <div className="hidden min-w-0 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel-subtle)] px-3 py-2 text-sm text-[var(--muted)] md:flex">
                  <Search className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">Search product memory, sources, and packs</span>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <div
                  aria-label="Notifications"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-white text-[var(--muted-strong)]"
                  role="img"
                >
                  <Bell className="h-4 w-4" aria-hidden />
                </div>
                <div className="flex min-w-0 items-center gap-2 rounded-md border border-[var(--border)] bg-white px-2 py-1.5">
                  <div className="h-6 w-6 shrink-0 rounded-md bg-[#dbeafe]" />
                  <span className="hidden truncate text-sm font-medium sm:inline">{user.name}</span>
                </div>
                <SignOutButton />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
