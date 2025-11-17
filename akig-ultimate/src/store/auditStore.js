import { useState } from "react";

export function useAuditStore() {
  const [logs, setLogs] = useState([]);

  const addLog = (action, entity, payload) => {
    setLogs((current) =>
      current.concat({ id: Date.now(), ts: new Date().toISOString(), action, entity, payload })
    );
  };

  return { logs, addLog };
}
