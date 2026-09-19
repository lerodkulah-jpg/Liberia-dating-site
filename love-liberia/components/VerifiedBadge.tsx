import { BadgeCheck } from "lucide-react";

type VerifiedBadgeProps = {
  compact?: boolean;
  className?: string;
};

export default function VerifiedBadge({ compact = false, className = "" }: VerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-sky-100 font-semibold text-sky-700 ${
        compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${className}`}
      title="Verified profile"
    >
      <BadgeCheck className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ✓ Verified
    </span>
  );
}
