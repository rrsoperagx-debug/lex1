import React from "react";
import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}

export function useToast() {
  return {
    toast: (props: ToastProps) => {
      const options: any = { description: props.description };
      if (props.action) options.action = props.action;

      if (props.variant === "destructive") {
        sonnerToast.error(props.title, options);
      } else {
        sonnerToast.success(props.title, options);
      }
    }
  };
}
