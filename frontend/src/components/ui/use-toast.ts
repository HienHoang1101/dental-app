// Simple toast hook for now
export function useToast() {
  return {
    toast: ({
      title,
      description,
      variant,
    }: {
      title: string;
      description?: string;
      variant?: string;
    }) => {
      // Simple alert for now - can be replaced with proper toast library
      if (variant === "destructive") {
        alert(`❌ ${title}${description ? "\n" + description : ""}`);
      } else {
        alert(`✅ ${title}${description ? "\n" + description : ""}`);
      }
    },
  };
}
