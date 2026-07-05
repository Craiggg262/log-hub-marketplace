import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: "1" | "2";
  onChange: (v: "1" | "2") => void;
}

export const PortalSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/50 border border-border">
      {(["1", "2"] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            "py-2.5 rounded-lg text-sm font-medium transition-all",
            value === p
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Portal {p}
          <span className="block text-[10px] opacity-70">
            {p === "1" ? "VTU Gate" : "CheapDataHub"}
          </span>
        </button>
      ))}
    </div>
  );
};
