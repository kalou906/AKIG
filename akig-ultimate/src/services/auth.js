export async function login(username, password) {
  if (username && password) {
    return { id: 1, name: "Manager AKIG", role: "Manager" };
  }

  throw new Error("Identifiants invalides");
}
