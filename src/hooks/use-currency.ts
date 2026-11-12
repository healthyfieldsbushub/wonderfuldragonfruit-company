import { useState } from "react";

/**
 * Currency for the whole storefront.
 *
 * Every price on this site is quoted, invoiced and charged in South African Rand.
 * There is deliberately no conversion: showing a customer a converted figure while
 * charging them in ZAR would misrepresent the amount they actually pay, and the
 * payment gateways are all settled in ZAR.
 *
 * This hook used to offer a USD display mode backed by a live exchange rate. That
 * path is removed, so no caller can render a "$" figure.
 */
export type Currency = "ZAR";

const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

export function useCurrency() {
  // Kept as state so callers that destructure `currency` keep working unchanged.
  const [currency] = useState<Currency>("ZAR");

  const formatPrice = (priceInZar: number, _displayCurrency?: Currency): string =>
    zarFormatter.format(Number(priceInZar) || 0);

  // Amounts are already in rand, so these are identity conversions. They remain so
  // existing callers do not break, but they can no longer produce a USD figure.
  const convertToZar = (amount: number): number => Number(amount) || 0;
  const convertFromZar = (amount: number): number => Number(amount) || 0;

  return {
    currency,
    loading: false,
    changeCurrency: (_next: Currency) => {},
    formatPrice,
    convertToZar,
    convertFromZar,
  };
}
