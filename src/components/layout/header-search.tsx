"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { Input } from "@/components/ui/input";

type HeaderSearchProps = {
  className?: string;
};

export function HeaderSearch({ className }: HeaderSearchProps) {
  const tNav = useTranslations("player.nav");
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = query.trim();
      const params = new URLSearchParams();
      if (trimmed) {
        params.set("q", trimmed);
      }
      const suffix = params.toString();
      router.push(suffix ? `/search?${suffix}` : "/search");
    },
    [query, router],
  );

  return (
    <form onSubmit={submit} className={className}>
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={tNav("search")}
        aria-label={tNav("search")}
        className="h-9 w-full min-w-0 border-border/90 bg-background shadow-sm sm:min-w-[12rem] md:min-w-[16rem]"
      />
    </form>
  );
}
