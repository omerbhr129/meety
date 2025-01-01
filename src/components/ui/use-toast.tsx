import * as React from "react";
import { toast as sonnerToast, Toaster as Sonner } from "sonner";

const toastStyles = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow)",
  color: "hsl(var(--foreground))",
  fontSize: "14px",
};

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  return {
    toast: ({ title, description, variant = "default" }: ToastProps) => {
      return sonnerToast[variant === "destructive" ? "error" : "success"](title, {
        description,
        style: toastStyles,
      });
    }
  };
}

export function Toaster() {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  );
}

export { toast } from "sonner";
