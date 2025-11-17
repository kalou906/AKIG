export async function initiateOrangeMoneyPayment({ token, amount, currency = "GNF" }) {
  const response = await fetch("https://api.orange.com/orange-money-webpay/v1/pay", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Paiement Orange Money échoué");
  }

  return response.json();
}
