// src/hooks/use-toast.ts
"use client";

// Inspired by react-hot-toast
import * as React from "react";

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 10000;

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */
export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

/* ------------------------------------------------------------------ */
/* Estado global em memória                                            */
/* ------------------------------------------------------------------ */
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

/* ------------------------------------------------------------------ */
/* REDUCER                                                             */
/* ------------------------------------------------------------------ */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          action.toastId === undefined || t.id === action.toastId
            ? { ...t, open: false }
            : t
        ),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts:
          action.toastId === undefined
            ? []
            : state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
let count = 0;
const genId = () => (++count).toString();

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

/* ------------------------------------------------------------------ */
/* API público                                                         */
/* ------------------------------------------------------------------ */
type ToastInput = Omit<ToasterToast, "id">;

export function toast(props: ToastInput) {
  const id = genId();

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  const update = (p: Partial<ToasterToast>) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...p, id } });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => !open && dismiss(),
    },
  });

  // Remove automaticamente após delay
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId: id }), TOAST_REMOVE_DELAY);

  return { id, dismiss, update };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

