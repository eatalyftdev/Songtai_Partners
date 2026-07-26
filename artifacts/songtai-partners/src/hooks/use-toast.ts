// Simplified useToast hook implementation
import { useState, useEffect } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const toastListeners: Set<(toasts: Toast[]) => void> = new Set()
let toasts: Toast[] = []

export function toast(props: Omit<Toast, "id">) {
  const id = genId()
  const newToast = { ...props, id }
  toasts = [...toasts, newToast]
  toastListeners.forEach((listener) => listener(toasts))
  
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    toastListeners.forEach((listener) => listener(toasts))
  }, 5000)
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts)

  useEffect(() => {
    toastListeners.add(setState)
    return () => {
      toastListeners.delete(setState)
    }
  }, [])

  return { toasts: state, toast }
}
