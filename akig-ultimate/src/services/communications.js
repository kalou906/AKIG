export async function sendSMS(to, message) {
  if (!to || !message) {
    return;
  }

  // Placeholder: remplacer par un appel backend (Twilio, Orange, etc.).
  if (process.env.NODE_ENV !== "production") {
    console.info("[SMS]", to, message);
  }

  try {
    await fetch("/api/notifications/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    });
  } catch (error) {
    console.warn("Échec envoi SMS (mode dégradé):", error);
  }
}
