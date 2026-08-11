import React from "react";
import { Coins } from "lucide-react";
import { useCurrency, type Currency } from "@/lib/currency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const OPTIONS: { value: Currency; label: string; symbol: string }[] = [
  { value: "NGN", label: "Naira", symbol: "₦" },
  { value: "USD", label: "US Dollar", symbol: "$" },
];

export function CurrencySwitcher({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency, rate } = useCurrency();
  const active = OPTIONS.find((o) => o.value === currency)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
          <Coins className="h-4 w-4 text-primary" />
          <span className="font-semibold">{active.symbol} {currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => setCurrency(o.value)}
            className={o.value === currency ? "font-semibold text-primary" : ""}
          >
            <span className="mr-2">{o.symbol}</span>
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
