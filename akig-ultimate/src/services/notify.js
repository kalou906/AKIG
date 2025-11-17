export async function sendSMS(tel, message) {
  if (!tel || !message) {
    return;
  }
  await fetch("/api/notifications/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tel, message }),
  });
}

export async function sendEmail(to, subject, html) {
  if (!to) {
    return;
  }
  await fetch("/api/notifications/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html }),
  });
}

export async function sendWhatsApp(to, message) {
  if (!to) {
    return;
  }
  await fetch("/api/notifications/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, message }),
  });
}

export async function pushNotify(userId, payload) {
  if (!userId) {
    return;
  }
  await fetch("/api/notifications/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, payload }),
  });
}

export async function multiRemind(locataire, impaye) {
  if (!locataire) {
    return;
  }
  const amount = Number(impaye ?? 0).toLocaleString();
  await sendSMS(locataire.tel, `Rappel loyer: ${amount} GNF`);
  await sendEmail(
    locataire.email,
    "Rappel loyer",
    `<p>Il reste ${amount} GNF à régler.</p>`
  );
}
