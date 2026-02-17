import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: "blue" | "green" | "orange" | "purple" | "red" | "gray";
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

const colorStyles = {
  blue: {
    icon: "bg-blue-500/20 text-blue-400",
    border: "border-blue-500/20",
  },
  green: {
    icon: "bg-green-500/20 text-green-400",
    border: "border-green-500/20",
  },
  orange: {
    icon: "bg-orange-500/20 text-orange-400",
    border: "border-orange-500/20",
  },
  purple: {
    icon: "bg-purple-500/20 text-purple-400",
    border: "border-purple-500/20",
  },
  red: {
    icon: "bg-red-500/20 text-red-400",
    border: "border-red-500/20",
  },
  gray: {
    icon: "bg-gray-500/20 text-gray-400",
    border: "border-gray-500/20",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
  onClick,
  className,
}: StatCardProps) {
  const styles = colorStyles[color];
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "flex-1 min-w-[140px] bg-slate-800 rounded-2xl p-4 border border-slate-700",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:bg-slate-800/80 hover:border-slate-600 active:scale-[0.98]",
        className
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
          styles.icon
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-slate-100 text-3xl font-extrabold">{value}</p>
      {subtitle ? (
        <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
      ) : null}
    </Component>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex-1 min-w-[140px] bg-slate-800 rounded-2xl p-4 border border-slate-700 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-slate-700 mb-3" />
      <div className="h-4 w-16 bg-slate-700 rounded mb-2" />
      <div className="h-8 w-12 bg-slate-700 rounded" />
    </div>
  );
}
