/** RSD for Serbia, EUR for all other Balkan MVP countries (PRD §5). */
export function currencyForCountryCode(countryCode: string): "RSD" | "EUR" {
  return countryCode === "RS" ? "RSD" : "EUR";
}
