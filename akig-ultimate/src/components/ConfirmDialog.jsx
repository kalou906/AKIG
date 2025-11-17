export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded bg-white p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-akig-blue">{title}</h3>
        <p className="mt-2 text-sm text-akig-blue/80">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-2" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className="rounded bg-akig-red px-3 py-2 text-white" onClick={onConfirm}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
