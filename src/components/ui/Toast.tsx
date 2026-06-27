import { Toaster, toast } from "react-hot-toast";
export { toast };
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1e293b",
          color: "#e2e8f0",
          border: "1px solid rgba(42,175,160,0.25)",
          borderRadius: "8px",
          fontSize: "13.5px",
        },
        success: {
          iconTheme: { primary: "#22c55e", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "#fff" },
          duration: 5000,
        },
      }}
    />
  );
}
