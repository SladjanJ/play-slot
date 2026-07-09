"use client";

import { useActionState, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { signUpAction, type AuthActionState } from "@/app/actions/auth";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { FieldError } from "@/components/auth/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TIMEZONE_OPTIONS } from "@/lib/auth/validation";
import type { CityOption, CountryOption } from "@/lib/data/locations";
import { Link } from "@/i18n/navigation";

type RegisterFormProps = {
  locale: string;
  countries: CountryOption[];
  cities: CityOption[];
};

type UserRole = "player" | "host";

const initialState: AuthActionState = {};

export function RegisterForm({ locale, countries, cities }: RegisterFormProps) {
  const t = useTranslations("auth");
  const appLocale = useLocale();
  const [role, setRole] = useState<UserRole>("player");
  const [countryId, setCountryId] = useState(countries[0]?.id ?? "");
  const [cityId, setCityId] = useState("");
  const [state, formAction, pending] = useActionState(
    signUpAction.bind(null, locale),
    initialState,
  );

  const filteredCities = useMemo(
    () => cities.filter((city) => city.country_id === countryId),
    [cities, countryId],
  );

  const localizedName = (sr: string, en: string) =>
    appLocale === "sr" ? sr : en;

  return (
    <AuthFormCard
      title={t("registerTitle")}
      description={t("registerDescription")}
      footer={
        <>
          {t("hasAccount")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("loginLink")}
          </Link>
        </>
      }
    >
      <form action={formAction} noValidate className="space-y-4">
        <input type="hidden" name="role" value={role} />

        <div className="space-y-2">
          <Label htmlFor="role">{t("role")}</Label>
          <Select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="player">{t("rolePlayer")}</option>
            <option value="host">{t("roleHost")}</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          <FieldError message={state.fieldErrors?.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          <FieldError message={state.fieldErrors?.password} />
          {!state.fieldErrors?.password ? (
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            aria-invalid={Boolean(state.fieldErrors?.firstName)}
          />
          <FieldError message={state.fieldErrors?.firstName} />
        </div>

        {role === "player" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                aria-invalid={Boolean(state.fieldErrors?.lastName)}
              />
              <FieldError message={state.fieldErrors?.lastName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phoneOptional")}</Label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">{t("companyName")}</Label>
              <Input
                id="companyName"
                name="companyName"
                aria-invalid={Boolean(state.fieldErrors?.companyName)}
              />
              <FieldError message={state.fieldErrors?.companyName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t("country")}</Label>
              <Select
                id="country"
                value={countryId}
                onChange={(e) => {
                  setCountryId(e.target.value);
                  setCityId("");
                }}
              >
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {localizedName(country.name_sr, country.name_en)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityId">{t("city")}</Label>
              <Select
                id="cityId"
                name="cityId"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                aria-invalid={Boolean(state.fieldErrors?.cityId)}
              >
                <option value="">{t("selectCity")}</option>
                {filteredCities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {localizedName(city.name_sr, city.name_en)}
                  </option>
                ))}
              </Select>
              <FieldError message={state.fieldErrors?.cityId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t("timezone")}</Label>
              <Select
                id="timezone"
                name="timezone"
                defaultValue=""
                aria-invalid={Boolean(state.fieldErrors?.timezone)}
              >
                <option value="">{t("selectTimezone")}</option>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
              <FieldError message={state.fieldErrors?.timezone} />
            </div>
          </>
        )}

        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? t("submitting") : t("registerSubmit")}
        </Button>
      </form>
    </AuthFormCard>
  );
}
