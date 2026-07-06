import { Toaster, toast } from "react-hot-toast";
export { toast };
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#2c3a4d",
          color: "#e3e9f0",
          border: "1px solid rgba(69,179,180,0.25)",
          borderRadius: "8px",
          fontSize: "13.5px",
        },
        success: {
          iconTheme: { primary: "#1e9e5a", secondary: "#fff" },
        },
        error: {
          iconTheme: { primary: "#de4a47", secondary: "#fff" },
          duration: 5000,
        },
      }}
    />
  );
}
