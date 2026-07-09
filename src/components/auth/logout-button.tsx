"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";

import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  locale: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
};

export function LogoutButton({
  locale,
  className,
  variant = "ghost",
}: LogoutButtonProps) {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      className={cn(className)}
      disabled={isPending}
      onClick={() => startTransition(() => signOutAction(locale))}
    >
      {isPending ? t("submitting") : t("logout")}
    </Button>
  );
}
