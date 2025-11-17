import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const normalizeRole = (role = "") =>
  role
    .normalize("NFD")
    .replace(/[^\w]/g, "")
    .toLowerCase();

export default function RoleGuard({ allow = [], children }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allow.length) {
    const whitelist = allow.map(normalizeRole);
    const current = normalizeRole(user.role);
    if (!whitelist.includes(current)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
