import { z, type ZodIssue } from "zod";

const passwordSchema = z
  .string()
  .min(8, "passwordMinLength")
  .regex(/\d/, "passwordNeedsNumber");

export const playerRegisterSchema = z.object({
  role: z.literal("player"),
  email: z.string().email("emailInvalid"),
  password: passwordSchema,
  firstName: z.string().trim().min(1, "firstNameRequired"),
  lastName: z.string().trim().min(1, "lastNameRequired"),
  phone: z.string().trim().optional(),
});

export const hostRegisterSchema = z.object({
  role: z.literal("host"),
  email: z.string().email("emailInvalid"),
  password: passwordSchema,
  firstName: z.string().trim().min(1, "firstNameRequired"),
  companyName: z.string().trim().min(1, "companyNameRequired"),
  cityId: z.string().uuid("cityRequired"),
  timezone: z.string().trim().min(1, "timezoneRequired"),
});

export const registerSchema = z.discriminatedUnion("role", [
  playerRegisterSchema,
  hostRegisterSchema,
]);

export const loginSchema = z.object({
  email: z.string().email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("emailInvalid"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "passwordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const TIMEZONE_OPTIONS = [
  "Europe/Belgrade",
  "Europe/Sarajevo",
  "Europe/Zagreb",
  "Europe/Ljubljana",
  "Europe/Skopje",
  "Europe/Tirane",
  "Europe/Podgorica",
] as const;

export type AuthErrorKey =
  | "generic"
  | "emailInvalid"
  | "emailTaken"
  | "passwordRequired"
  | "passwordMinLength"
  | "passwordNeedsNumber"
  | "firstNameRequired"
  | "lastNameRequired"
  | "companyNameRequired"
  | "cityRequired"
  | "timezoneRequired"
  | "invalidCredentials"
  | "rateLimit"
  | "redirectNotAllowed"
  | "notAuthenticated"
  | "resendFailed"
  | "passwordMismatch";

export function zodIssuesToFieldErrors(
  issues: ZodIssue[],
): Partial<Record<string, AuthErrorKey>> {
  const fieldErrors: Partial<Record<string, AuthErrorKey>> = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fieldErrors[field]) continue;
    fieldErrors[field] = (issue.message ?? "generic") as AuthErrorKey;
  }

  return fieldErrors;
}

export function mapSupabaseAuthError(message: string): AuthErrorKey {
  const lower = message.toLowerCase();

  if (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists") ||
    lower.includes("email address has already")
  ) {
    return "emailTaken";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "rateLimit";
  }

  if (lower.includes("redirect") || lower.includes("invalid url")) {
    return "redirectNotAllowed";
  }

  if (lower.includes("invalid email") || lower.includes("email format")) {
    return "emailInvalid";
  }

  if (lower.includes("password") && lower.includes("least")) {
    return "passwordMinLength";
  }

  return "generic";
}
