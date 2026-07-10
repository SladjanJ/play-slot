"use client";

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  showLabel: string;
  hideLabel: string;
};

function PasswordInput({
  className,
  showLabel,
  hideLabel,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
      >
        <HugeiconsIcon
          icon={visible ? ViewOffIcon : ViewIcon}
          strokeWidth={2}
          className="size-4"
        />
      </Button>
    </div>
  );
}

export { PasswordInput };
