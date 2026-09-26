import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, PlusCircle } from 'lucide-react';

// Define the icon type. Using React.ElementType for flexibility.
type IconType = React.ElementType | React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

// --- 📦 API (Props) Definition ---
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
}

/**
 * A professional, accessible, and responsive component for indicating the absence of data.
 * It guides the user with a clear message and an optional call-to-action.
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
}) => {
  const showAction = actionLabel && onActionClick;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 md:p-16 border-2 border-dashed border-border rounded-xl bg-card transition-colors duration-200",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Main Icon */}
      <div className="mb-4 p-3 rounded-full bg-muted text-muted-foreground border border-border">
        <MainIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-1.5">{title}</h3>

      {/* Message */}
      <p className="max-w-md text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>

      {/* Action Button (Optional) */}
      {showAction && (
        <Button
          onClick={onActionClick}
          className="transition-shadow duration-200 hover:shadow-md cursor-pointer"
          aria-label={actionLabel}
        >
          <ActionIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          {actionLabel}
        </Button>
      )}

      {children}
    </div>
  );
};

export default EmptyState;
