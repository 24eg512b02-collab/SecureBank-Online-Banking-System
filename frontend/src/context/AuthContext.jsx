import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function load() {
  try {
    const raw = sessionStorage.getItem('sb_user');
    return raw && sessionStorage.getItem('sb_token') ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(load);

  const signIn = useCallback((data) => {
    sessionStorage.setItem('sb_token', data.token);
    const u = { email: data.email, fullName: data.fullName, roles: data.roles };
    sessionStorage.setItem('sb_user', JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem('sb_token');
    sessionStorage.removeItem('sb_user');
    setUser(null);
  }, []);

  const updateName = useCallback((fullName) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, fullName };
      sessionStorage.setItem('sb_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, isAdmin: !!user?.roles?.includes('ROLE_ADMIN'), signIn, signOut, updateName }),
    [user, signIn, signOut, updateName]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
