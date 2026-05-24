import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  hideCloseButton?: boolean;
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, hideCloseButton, className }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" />
      <div className={cn("relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg", className)}>
        {!hideCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {children}
      </div>
    </div>
  );
};

const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("mb-4 pr-8", className)} {...props} />;

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => <h2 className={cn("text-lg font-semibold", className)} {...props} />;

const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p className={cn("text-sm text-muted-foreground mt-1", className)} {...props} />
);

export { Dialog, DialogHeader, DialogTitle, DialogDescription };
