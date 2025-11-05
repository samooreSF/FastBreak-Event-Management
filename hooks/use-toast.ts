"use client";

import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastProps["variant"];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type ToastState = {
  toasts: Toast[];
};

// Global state (works without provider)
let state: ToastState = { toasts: [] };
const listeners = new Set<React.Dispatch<React.SetStateAction<ToastState>>>();

function notifyListeners() {
  listeners.forEach((listener) => listener(state));
}

let toastCount = 0;
function generateId() {
  return (++toastCount).toString();
}

const timeouts = new Map<string, NodeJS.Timeout>();

function removeToast(toastId: string) {
  const timeout = timeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
    timeouts.delete(toastId);
  }
  state = {
    toasts: state.toasts.filter((t) => t.id !== toastId),
  };
  notifyListeners();
}

function dismissToast(toastId?: string) {
  if (toastId) {
    // Dismiss specific toast
    const timeout = timeouts.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.delete(toastId);
    }
    state = {
      toasts: state.toasts.map((t) =>
        t.id === toastId ? { ...t, open: false } : t
      ),
    };
    // Remove after animation
    setTimeout(() => removeToast(toastId), 300);
  } else {
    // Dismiss all toasts
    timeouts.forEach((timeout) => clearTimeout(timeout));
    timeouts.clear();
    state = {
      toasts: state.toasts.map((t) => ({ ...t, open: false })),
    };
    // Remove all after animation
    setTimeout(() => {
      state = { toasts: [] };
      notifyListeners();
    }, 300);
  }
  notifyListeners();
}

function toast(props: Omit<Toast, "id">) {
  const id = generateId();

  const newToast: Toast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismissToast(id);
    },
  };

  state = {
    toasts: [newToast, ...state.toasts].slice(0, TOAST_LIMIT),
  };

  // Set up auto-dismiss
  const timeout = setTimeout(() => {
    dismissToast(id);
  }, TOAST_REMOVE_DELAY);

  timeouts.set(id, timeout);
  notifyListeners();
}

export function useToast() {
  const [localState, setLocalState] = React.useState<ToastState>(state);

  React.useEffect(() => {
    listeners.add(setLocalState);
    return () => {
      listeners.delete(setLocalState);
    };
  }, []);

  return {
    ...localState,
    toast,
    dismiss: dismissToast,
  };
}

export { toast };
