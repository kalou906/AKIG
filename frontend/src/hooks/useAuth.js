/**
 * useAuth Hook - Authentication context hook
 * Provides user, token, and auth methods
 */

// Simple hook - just returns localStorage data
export const useAuth = () => {
  return {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    login: (token, user) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  };
};

export default useAuth;


