"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type HostUserMenuProps = {
  firstName: string;
  className?: string;
};

export function HostUserMenu({ firstName, className }: HostUserMenuProps) {
  const t = useTranslations("host.nav");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      >
        <span>{firstName}</span>
        <span className="text-xs opacity-70" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[10rem] rounded-xl border border-border/80 bg-popover p-1 shadow-lg"
        >
          <Link
            href="/host/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t("settings")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
