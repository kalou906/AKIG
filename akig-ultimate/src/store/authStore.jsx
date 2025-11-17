import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const defaultUser = { id: 1, name: "Manager AKIG", role: "Manager" };

export function AuthProvider({ children, initialUser = defaultUser }) {
  const [user, setUser] = useState(initialUser);

  const value = useMemo(
    () => ({
      user,
      login: setUser,
      logout: () => setUser(null),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthStore must be used within an AuthProvider");
  }
  return context;
}
