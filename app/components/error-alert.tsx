import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  className?: string;
  id?: string;
  role?: string;
}

export function ErrorAlert({ message, className = "", id, role }: ErrorAlertProps) {
  return (
    <div
      className={`rounded-md bg-[hsl(var(--destructive))]/10 px-4 py-3 text-sm text-[hsl(var(--destructive))] ${className}`}
      id={id}
      role={role}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
