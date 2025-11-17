const STORAGE_KEY = "akig-offline-queue";

const readQueue = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Impossible de lire la file offline", error);
    return [];
  }
};

const writeQueue = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Impossible d'écrire la file offline", error);
  }
};

export function saveLocal(type, payload) {
  if (typeof window === "undefined") {
    return;
  }
  const queue = readQueue();
  queue.push({ id: Date.now(), type, payload });
  writeQueue(queue);
}

export async function sendToAPI(endpoint, payload) {
  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function queueOrSend(endpoint, payload) {
  if (typeof navigator === "undefined" || !navigator.onLine) {
    saveLocal(endpoint, payload);
    return { queued: true };
  }

  await sendToAPI(endpoint, payload);
  return { queued: false };
}

export async function flushQueue() {
  if (typeof window === "undefined" || !navigator.onLine) {
    return;
  }

  const queue = readQueue();
  const remaining = [];

  for (const item of queue) {
    try {
      await sendToAPI(item.type, item.payload);
    } catch (error) {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
}
