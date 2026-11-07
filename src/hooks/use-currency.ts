import { useState, useEffect } from "react";
import { getCurrencyRates, CurrencyRates } from "@/lib/api";

export type Currency = "ZAR" | "USD";

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("ZAR");
  const [rates, setRates] = useState<CurrencyRates>({ ZAR_TO_USD: 0.055, USD_TO_ZAR: 18.18 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved currency preference
    const saved = localStorage.getItem("preferredCurrency") as Currency;
    if (saved) {
      setCurrency(saved);
    }

    // Fetch current exchange rates
    getCurrencyRates()
      .then(setRates)
      .finally(() => setLoading(false));
  }, []);

  const changeCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("preferredCurrency", newCurrency);
  };

  const formatPrice = (priceInZar: number, displayCurrency?: Currency): string => {
    const curr = displayCurrency || currency;
    
    if (curr === "USD") {
      const usdPrice = priceInZar * rates.ZAR_TO_USD;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(usdPrice);
    }
    
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(priceInZar);
  };

  const convertToZar = (amount: number, fromCurrency: Currency): number => {
    if (fromCurrency === "ZAR") return amount;
    return amount * rates.USD_TO_ZAR;
  };

  const convertFromZar = (amount: number, toCurrency: Currency): number => {
    if (toCurrency === "ZAR") return amount;
    return amount * rates.ZAR_TO_USD;
  };

  return {
    currency,
    rates,
    loading,
    changeCurrency,
    formatPrice,
    convertToZar,
    convertFromZar,
  };
}
