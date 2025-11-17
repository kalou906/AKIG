import { useUIStore } from "../store/uiStore";

export default function Toast() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between gap-3 rounded px-4 py-3 text-sm text-white shadow toast-notification ${
            toast.type === "error" ? "bg-akig-red" : "bg-akig-blue"
          }`}
        >
          <div className="flex items-center gap-2">
            <img 
              src="/assets/logos/logo.png" 
              alt="Logo AKIG" 
              className="w-5 h-5 object-contain"
            />
            <span>{toast.message}</span>
          </div>
          <button type="button" onClick={() => removeToast(toast.id)} className="hover:opacity-75">
            ✖
          </button>
        </div>
      ))}
    </div>
  );
}
