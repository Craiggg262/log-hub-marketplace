import React, { useSyncExternalStore } from "react";

export type Currency = "NGN" | "USD";

/** Fixed platform conversion rate: 1 USD = 1390 NGN */
export const USD_RATE = 1390;

const STORAGE_KEY = "lhm_currency";

let current: Currency = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "USD" ? "USD" : "NGN";
  } catch {
    return "NGN";
  }
})();

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Currency {
  return current;
}

export function getCurrency(): Currency {
  return current;
}

export function setCurrency(next: Currency) {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/**
 * Format an amount stored in Naira using the currency the user picked.
 * All prices in the database and APIs are stored in NGN.
 */
export function formatPrice(nairaAmount: number | string | null | undefined, opts?: { decimals?: number }): string {
  const value = Number(nairaAmount ?? 0) || 0;
  if (current === "USD") {
    const usd = value / USD_RATE;
    return `$${usd.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  const decimals = opts?.decimals ?? 0;
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: Math.max(decimals, 2),
  })}`;
}

/** Reactive access to the current currency. */
export function useCurrency() {
  const currency = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { currency, setCurrency, rate: USD_RATE, formatPrice };
}

/**
 * Remounts its children whenever the currency changes so every price on the
 * site (logs, boosting, eSIMs, wallet, SMS) re-renders in the new currency.
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { currency } = useCurrency();
  return <React.Fragment key={currency}>{children}</React.Fragment>;
}
