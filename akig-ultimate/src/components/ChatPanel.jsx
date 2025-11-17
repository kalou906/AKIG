import { useState } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) {
      return;
    }
    setMessages((current) =>
      current.concat({ id: Date.now(), text, ts: new Date().toISOString() })
    );
    setText("");
  };

  return (
    <div className="rounded border p-3">
      <div className="h-40 space-y-2 overflow-auto text-sm">
        {messages.map((message) => (
          <div key={message.id}>
            <span className="opacity-60">{new Date(message.ts).toLocaleString()}:</span> {message.text}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded border px-2 py-1"
          placeholder="Message (ex: Voir contrat AKIG-2025-001)"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="button" className="rounded bg-akig-blue px-3 py-1 text-white" onClick={send}>
          Envoyer
        </button>
      </div>
    </div>
  );
}
