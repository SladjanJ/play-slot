"use client";

import { type ZodIssue } from "zod";
import { useActionState, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { publishVenueAction, type HostActionState } from "@/app/actions/host";
import { SetupProgress } from "@/components/host/setup-progress";
import { SetupStepBasics } from "@/components/host/setup-step-basics";
import { SetupStepLocation } from "@/components/host/setup-step-location";
import { SetupStepPricing } from "@/components/host/setup-step-pricing";
import { SetupStepReview } from "@/components/host/setup-step-review";
import { SetupStepWorkingHours } from "@/components/host/setup-step-working-hours";
import { Button } from "@/components/ui/button";
import type { HostSetupInitialData } from "@/lib/data/host-setup";
import type { CityOption, CountryOption } from "@/lib/data/locations";
import {
  DEFAULT_CONFIRMATION_MODE,
  DEFAULT_MAX_CONSECUTIVE_SLOTS,
  DEFAULT_SLOT_DURATION,
  SETUP_STEPS,
  type SetupStep,
} from "@/lib/host/constants";
import {
  hostSetupBasicsSchema,
  hostSetupLocationSchema,
  hostSetupPricingSchema,
  hostSetupWorkingHoursSchema,
  type PublishVenueInput,
} from "@/lib/host/validation";

type HostSetupWizardProps = {
  initialData: HostSetupInitialData;
  countries: CountryOption[];
  cities: CityOption[];
};

const initialActionState: HostActionState = {};

function stepFieldErrors(
  step: SetupStep,
  issues: ZodIssue[],
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!key) continue;

    if (step === "location" && (key === "lat" || key === "lng")) {
      fieldErrors.locationRequired = issue.message;
      continue;
    }

    fieldErrors[key] = issue.message;
  }

  return fieldErrors;
}

export function HostSetupWizard({
  initialData,
  countries,
  cities,
}: HostSetupWizardProps) {
  const t = useTranslations("host.setup");
  const tErrors = useTranslations("host.errors");
  const locale = useLocale();
  const [currentStep, setCurrentStep] = useState<SetupStep>("basics");
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<PublishVenueInput>({
    companyName: initialData.companyName,
    countryId: initialData.countryId,
    cityId: initialData.cityId,
    timezone: initialData.timezone,
    lat: 0,
    lng: 0,
    address: "",
    workingHours: initialData.workingHours,
    slotDurationMinutes: DEFAULT_SLOT_DURATION,
    maxConsecutiveSlots: DEFAULT_MAX_CONSECUTIVE_SLOTS,
    pricePerSlot: 0,
    confirmationMode: DEFAULT_CONFIRMATION_MODE,
  });

  const [actionState, formAction, isPublishing] = useActionState(
    publishVenueAction.bind(null, locale),
    initialActionState,
  );

  const currentStepIndex = SETUP_STEPS.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStep === "review";

  const mergedErrors = useMemo(
    () => ({ ...stepErrors, ...actionState.fieldErrors }),
    [actionState.fieldErrors, stepErrors],
  );

  function updateFormData(patch: Partial<PublishVenueInput>) {
    setFormData((current) => ({ ...current, ...patch }));
  }

  function validateCurrentStep(): boolean {
    let result;

    switch (currentStep) {
      case "basics":
        result = hostSetupBasicsSchema.safeParse({
          companyName: formData.companyName,
          countryId: formData.countryId,
          cityId: formData.cityId,
          timezone: formData.timezone,
        });
        break;
      case "location":
        if (!formData.lat || !formData.lng) {
          setStepErrors({ locationRequired: tErrors("locationRequired") });
          return false;
        }
        result = hostSetupLocationSchema.safeParse({
          lat: formData.lat,
          lng: formData.lng,
          address: formData.address,
        });
        break;
      case "workingHours":
        result = hostSetupWorkingHoursSchema.safeParse({
          workingHours: formData.workingHours,
        });
        break;
      case "pricing":
        result = hostSetupPricingSchema.safeParse({
          slotDurationMinutes: formData.slotDurationMinutes,
          maxConsecutiveSlots: formData.maxConsecutiveSlots,
          pricePerSlot: formData.pricePerSlot,
          confirmationMode: formData.confirmationMode,
        });
        break;
      default:
        return true;
    }

    if (!result.success) {
      const errors = stepFieldErrors(currentStep, result.error.issues);
      const translated: Record<string, string> = {};

      for (const [field, key] of Object.entries(errors)) {
        translated[field] = tErrors(key as Parameters<typeof tErrors>[0]);
      }

      setStepErrors(translated);
      return false;
    }

    setStepErrors({});
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    const nextStep = SETUP_STEPS[currentStepIndex + 1];
    if (nextStep) setCurrentStep(nextStep);
  }

  function goBack() {
    const previousStep = SETUP_STEPS[currentStepIndex - 1];
    if (previousStep) {
      setStepErrors({});
      setCurrentStep(previousStep);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("description")}
        </p>
        <SetupProgress currentStep={currentStep} />
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/75 p-6 shadow-lg backdrop-blur-md sm:p-8">
        {currentStep === "basics" ? (
          <SetupStepBasics
            value={formData}
            countries={countries}
            cities={cities}
            errors={mergedErrors}
            onChange={updateFormData}
          />
        ) : null}

        {currentStep === "location" ? (
          <SetupStepLocation
            value={formData}
            countries={countries}
            cities={cities}
            errors={mergedErrors}
            onChange={updateFormData}
          />
        ) : null}

        {currentStep === "workingHours" ? (
          <SetupStepWorkingHours
            value={formData.workingHours}
            errors={mergedErrors}
            onChange={(workingHours) => updateFormData({ workingHours })}
          />
        ) : null}

        {currentStep === "pricing" ? (
          <SetupStepPricing
            value={formData}
            countries={countries}
            errors={mergedErrors}
            onChange={updateFormData}
          />
        ) : null}

        {currentStep === "review" ? (
          <SetupStepReview
            value={formData}
            countries={countries}
            cities={cities}
          />
        ) : null}

        {actionState.error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {actionState.error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={isFirstStep || isPublishing}
            className="h-10"
          >
            {t("back")}
          </Button>

          {isLastStep ? (
            <form action={formAction}>
              <input
                type="hidden"
                name="payload"
                value={JSON.stringify(formData)}
                readOnly
              />
              <Button
                type="submit"
                className="h-10 min-w-[160px]"
                disabled={isPublishing}
              >
                {isPublishing ? t("publishing") : t("publish")}
              </Button>
            </form>
          ) : (
            <Button type="button" onClick={goNext} className="h-10 min-w-[160px]">
              {t("next")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
