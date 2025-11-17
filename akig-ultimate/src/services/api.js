// Adapte ces fonctions à ton backend.
// Ici, on simule avec des données locales.

export async function listTenants() {
  const module = await import("../data/tenants.js");
  return module.tenants;
}

export async function listContracts() {
  const module = await import("../data/contracts.js");
  return module.contracts;
}

export async function listBuildings() {
  const module = await import("../data/buildings.js");
  return module.buildings;
}

export async function listCharges() {
  const module = await import("../data/charges.js");
  return module.charges;
}

export async function listPayments() {
  const module = await import("../data/payments.js");
  return module.payments;
}

export async function createItem(collection, item) {
  return { ...item, id: Date.now() };
}

export async function updateItem(collection, id, patch) {
  return { id, ...patch };
}

export async function deleteItem(collection, id) {
  return true;
}
