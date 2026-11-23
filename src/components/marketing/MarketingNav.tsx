"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, User, X, LayoutGrid } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Misc";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuthDialog } from "@/components/providers/AuthDialogProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { marketingNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const pathname = usePathname();
  const { openSignIn, openGetStarted } = useAuthDialog();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const links = (onNavigate?: () => void) =>
    marketingNav.map((item) => {
      const active = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active ? "page" : undefined}
          onClick={onNavigate}
          className={cn(
            "inline-flex h-9 items-center border-b-2 px-1 text-sm font-medium transition-colors lg:px-0",
            active ? "border-primary text-primary" : "border-transparent text-ink hover:text-primary",
          )}
        >
          {item.label}
        </Link>
      );
    });

  const actions = (onNavigate?: () => void) =>
    user ? (
      <>
        <Avatar name={user.name} size="md" />
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex h-9 items-center gap-2 border border-primary bg-primary px-3.5 text-sm font-medium text-white shadow-card rounded-sm hover:bg-primary-hover"
        >
          <LayoutGrid className="h-4 w-4" />
          Open Workspace
          <ArrowRight className="h-4 w-4" />
        </Link>
      </>
    ) : (
      <>
        <Button
          variant="outline"
          leftIcon={<User className="h-4 w-4" />}
          onClick={() => {
            onNavigate?.();
            openSignIn();
          }}
        >
          Sign In
        </Button>
        <Button
          rightIcon={<ArrowRight className="h-4 w-4" />}
          onClick={() => {
            onNavigate?.();
            openGetStarted();
          }}
        >
          Get Started
        </Button>
      </>
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 lg:px-6">
        <Logo />
        <span className="hidden h-6 w-px bg-line lg:block" aria-hidden />
        <nav aria-label="Marketing" className="hidden items-center gap-8 lg:flex">
          {links()}
        </nav>
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {actions()}
        </div>
        <ThemeToggle className="ml-auto lg:hidden" />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="marketing-mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-9 w-9 items-center justify-center border border-line text-ink rounded-sm hover:bg-highlight lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div id="marketing-mobile-menu" className="border-t border-line bg-surface lg:hidden">
          <nav aria-label="Marketing mobile" className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-3">
            {links(() => setOpen(false))}
          </nav>
          <div className="mx-auto flex max-w-[1200px] flex-col gap-2 border-t border-line px-4 py-3 sm:flex-row">
            {actions(() => setOpen(false))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
