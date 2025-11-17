import ChatPanel from "../components/ChatPanel";

export default function EspaceClient() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Espace Client</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4">
          <h4 className="mb-2 font-semibold">Mes documents</h4>
          <ul className="text-sm">
            <li>
              Quittance Septembre —
              <button type="button" className="text-akig-blue underline">
                Télécharger
              </button>
            </li>
          </ul>
        </div>
        <div className="rounded border p-4">
          <h4 className="mb-2 font-semibold">Posez une question</h4>
          <textarea className="h-32 w-full rounded border p-2" placeholder="Votre question..." />
          <button type="button" className="mt-2 rounded bg-akig-blue px-3 py-2 text-white">
            Envoyer
          </button>
        </div>
      </div>
      <ChatPanel />
    </div>
  );
}
