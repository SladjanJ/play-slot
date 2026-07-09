import type { ReactNode } from "react";

type AuthFormCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthFormCard({
  title,
  description,
  children,
  footer,
}: AuthFormCardProps) {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card/75 p-8 shadow-lg backdrop-blur-md sm:p-10">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="mt-8">{children}</div>
        {footer ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    </section>
  );
}
