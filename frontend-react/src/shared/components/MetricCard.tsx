import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";

type MetricColor =
  | "primary"
  | "blue"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "red"
  | "orange"
  | "yellow"
  | "muted";

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  color?: MetricColor;
  size?: "sm" | "md";
  labelPosition?: "top" | "bottom";
}

const iconCircleBg: Record<MetricColor, string> = {
  primary: "bg-primary/10",
  blue: "bg-blue-500/10",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  violet: "bg-violet-500/10",
  rose: "bg-rose-500/10",
  red: "bg-red-500/10",
  orange: "bg-orange-500/10",
  yellow: "bg-yellow-500/10",
  muted: "bg-muted",
};

const iconColor: Record<MetricColor, string> = {
  primary: "text-primary",
  blue: "text-blue-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  violet: "text-violet-500",
  rose: "text-rose-500",
  red: "text-red-500",
  orange: "text-orange-500",
  yellow: "text-yellow-500",
  muted: "text-muted-foreground",
};

const sizes = {
  sm: {
    circle: "h-9 w-9",
    icon: "h-4 w-4",
    value: "text-xl font-bold",
    label: "text-xs text-muted-foreground",
    gap: "gap-3",
    padding: "p-4",
  },
  md: {
    circle: "h-11 w-11",
    icon: "h-5 w-5",
    value: "text-2xl font-bold",
    label: "text-sm text-muted-foreground",
    gap: "gap-4",
    padding: "p-5",
  },
} as const;

export function MetricCard({
  icon: Icon,
  label,
  value,
  color = "primary",
  size = "md",
  labelPosition = "bottom",
}: MetricCardProps) {
  const s = sizes[size];
  const Label = <p className={s.label}>{label}</p>;

  return (
    <Card>
      <CardContent className={`flex items-center ${s.gap} ${s.padding}`}>
        <div className={`flex ${s.circle} items-center justify-center rounded-full ${iconCircleBg[color]}`}>
          <Icon className={`${s.icon} ${iconColor[color]}`} />
        </div>
        <div className="min-w-0">
          {labelPosition === "top" && Label}
          <p className={s.value}>{value}</p>
          {labelPosition === "bottom" && Label}
        </div>
      </CardContent>
    </Card>
  );
}
