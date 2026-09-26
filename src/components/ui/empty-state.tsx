import React from 'react';
import { cn } from "@/lib/utils";
import { FileText, PlusCircle } from 'lucide-react';

type IconType = React.ElementType | React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

export interface EmptyStateProps {
  /** The primary title of the empty state (e.g., "No Documents Found"). */
  title: string;
  /** The detailed descriptive message. */
  message: string;
  /** Optional label for the primary action button. */
  actionLabel?: string;
  /** Optional icon for the primary action button. Defaults to PlusCircle. */
  actionIcon?: IconType;
  /** Callback function when the primary action button is clicked. */
  onActionClick?: () => void;
  /** The main icon to display prominently in the empty state. Defaults to FileText. */
  mainIcon?: IconType;
  /** Optional class name for the container div. */
  className?: string;
  /** Optional children for custom actions (e.g. Next.js Link) */
  children?: React.ReactNode;
  /** Variant for icon badge styling */
  iconVariant?: 'emerald' | 'orange' | 'neutral';
}

/**
 * A professional, accessible, and responsive component for indicating the absence of data.
 * It provides high contrast, beautiful typography, and a prominent call-to-action in both light and dark modes.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  actionIcon: ActionIcon = PlusCircle,
  onActionClick,
  mainIcon: MainIcon = FileText,
  className,
  children,
  iconVariant = 'neutral',
}) => {
  const showAction = actionLabel && onActionClick;

  const iconStyles = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
    orange: "bg-orange-50 text-[#ee6018] border-orange-200/80 dark:bg-[#ee6018]/10 dark:text-[#ff7836] dark:border-[#ee6018]/30",
    neutral: "bg-gray-100 text-gray-700 border-gray-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.12]",
  }[iconVariant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 md:p-14",
        "rounded-2xl border border-gray-200/80 bg-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)]",
        "dark:border-white/[0.08] dark:bg-[#14161C]/60 dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
        "backdrop-blur-sm transition-all max-w-xl mx-auto my-6",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Main Icon */}
      <div className={cn("mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xs transition-transform duration-200", iconStyles)}>
        <MainIcon className="h-7 w-7 stroke-[1.8]" aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight mb-2 font-sans">
        {title}
      </h3>

      {/* Message */}
      <p className="max-w-md text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
        {message}
      </p>

      {/* Action Button */}
      {showAction && (
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] active:scale-[0.98] transition-all cursor-pointer"
          aria-label={actionLabel}
        >
          <ActionIcon className="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
          <span>{actionLabel}</span>
        </button>
      )}

      {children}
    </div>
  );
};

export default EmptyState;
