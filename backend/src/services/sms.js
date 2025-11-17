/**
 * Service SMS pour notifications locataires (Orange/MTN Guinea)
 * Stub: remplacer par vraie API SMS (ex: Africa's Talking, Twilio, etc.)
 */

async function sendSMS({ to, message, provider = 'ORANGE' }) {
  if (!to || !message) {
    throw new Error('Phone number and message are required');
  }

  // Stub: log and return success
  console.log(`[SMS] Sending via ${provider} to ${to}: ${message}`);
  
  // Simuler délai API
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    success: true,
    provider,
    to,
    messageId: `SMS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString()
  };
}

async function sendPaymentReminder({ phoneNumber, tenantName, amount, dueDate }) {
  const message = `Bonjour ${tenantName}, rappel: paiement de ${amount} GNF du au ${dueDate}. Merci - AKIG`;
  return sendSMS({ to: phoneNumber, message });
}

async function sendPaymentConfirmation({ phoneNumber, tenantName, amount, receiptNumber }) {
  const message = `${tenantName}, votre paiement de ${amount} GNF a ete recu. Recu: ${receiptNumber}. Merci - AKIG`;
  return sendSMS({ to: phoneNumber, message });
}

module.exports = {
  sendSMS,
  sendPaymentReminder,
  sendPaymentConfirmation
};
