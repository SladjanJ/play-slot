import Link from "next/link";
import { type VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>;

/** Link for app routes (`/search`, `/venues/...`) without locale prefix. */
export function AppLink({
  className,
  variant,
  size,
  ...props
}: AppLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
