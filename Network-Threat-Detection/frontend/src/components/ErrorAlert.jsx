import { AlertTriangle } from "lucide-react";

const ErrorAlert = ({ message }) => {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export default ErrorAlert;

