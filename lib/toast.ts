import { toast as sonnerToast } from "sonner";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

export function showSuccess(message: string, description?: string) {
  return sonnerToast.success(message, { description });
}

export function showError(error: unknown, fallbackMessage?: string) {
  const message = fallbackMessage || getErrorMessage(error);
  return sonnerToast.error(message);
}

export function showInfo(message: string, description?: string) {
  return sonnerToast.info(message, { description });
}

export function showWarning(message: string, description?: string) {
  return sonnerToast.warning(message, { description });
}

export function showLoading(message: string) {
  const id = sonnerToast.loading(message);
  return () => sonnerToast.dismiss(id);
}

export function showPromise<T>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
  }: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  },
) {
  return sonnerToast.promise(promise, {
    loading,
    success,
    error: (err) => {
      if (typeof error === "function") {
        return error(err);
      }
      return error;
    },
  });
}

export { toast } from "sonner";
