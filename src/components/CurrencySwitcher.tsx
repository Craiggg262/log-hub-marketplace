import React from "react";
import { Coins, ChevronsUpDown } from "lucide-react";
import { useCurrency, type Currency } from "@/lib/currency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const OPTIONS: { value: Currency; label: string; symbol: string; flag: string }[] = [
  { value: "NGN", label: "Naira", symbol: "₦", flag: "🇳🇬" },
  { value: "USD", label: "US Dollar", symbol: "$", flag: "🇺🇸" },
];

/**
 * Currency picker.
 * `inline` renders the small pill used next to the wallet balance.
 */
export function CurrencySwitcher({
  compact = false,
  inline = false,
}: {
  compact?: boolean;
  inline?: boolean;
}) {
  const { currency, setCurrency, rate } = useCurrency();
  const active = OPTIONS.find((o) => o.value === currency)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {inline ? (
          <button
            type="button"
            aria-label="Change currency"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/40 border border-border/50 px-2.5 py-1 text-xs font-semibold hover:bg-muted/70 transition-colors"
          >
            <Coins className="h-3.5 w-3.5 text-primary" />
            <span>{active.flag}</span>
            <span>{currency}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-semibold">
              {active.symbol} {currency}
            </span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 bg-popover z-50">
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => setCurrency(o.value)}
            className={o.value === currency ? "font-semibold text-primary" : ""}
          >
            <span className="mr-2">{o.flag}</span>
            {o.label} ({o.value})
          </DropdownMenuItem>
        ))}
        {!compact && (
          <div className="px-2 py-1.5 text-[11px] text-muted-foreground border-t border-border/50 mt-1">
            Rate: $1 = ₦{rate.toLocaleString()}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CurrencySwitcher;
