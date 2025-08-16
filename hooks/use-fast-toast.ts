import { toast } from "sonner"

// Optimized toast functions for faster loading
export const useFastToast = () => {
  const success = (message: string, options?: any) => {
    return toast.success(message, {
      duration: 2500, // Faster duration
      ...options,
    })
  }

  const error = (message: string, options?: any) => {
    return toast.error(message, {
      duration: 3000, // Slightly longer for errors
      ...options,
    })
  }

  const warning = (message: string, options?: any) => {
    return toast.warning(message, {
      duration: 2500,
      ...options,
    })
  }

  const info = (message: string, options?: any) => {
    return toast.info(message, {
      duration: 2000, // Shortest for info
      ...options,
    })
  }

  const loading = (message: string, options?: any) => {
    return toast.loading(message, {
      duration: 2000,
      ...options,
    })
  }

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId)
  }

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
  }
}
