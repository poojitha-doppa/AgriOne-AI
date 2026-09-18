import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  phone: string;
  mobile: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  token: string | null;
  signup: (name: string, mobile: string, password: string) => Promise<void>;
  login: (mobile: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isAdmin: false,
  authLoading: true,
  token: null,
  signup: async () => {},
  login: async () => ({ id: "", name: "", phone: "", mobile: "", isAdmin: false }),
  logout: () => {},
});

const TOKEN_KEY = "agrimitra-token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  // authLoading is true until we've verified (or rejected) the stored token
  const [authLoading, setAuthLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_KEY));

  const normalizeUser = (raw: { id: string; name: string; phone: string; isAdmin?: boolean }): User => ({
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    mobile: raw.phone,
    isAdmin: Boolean(raw.isAdmin),
  });

  // Verify stored token against backend on mount
  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }

    api.auth
      .me(token)
      .then((res) => {
        setUser(normalizeUser(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  const signup = async (name: string, mobile: string, password: string) => {
    const response = await api.auth.signup({
      name,
      phone: mobile,
      password,
    });

    localStorage.setItem(TOKEN_KEY, response.data.token);
    setToken(response.data.token);
    setUser(normalizeUser(response.data.user));
  };

  const login = async (mobile: string, password: string) => {
    const response = await api.auth.login({
      phone: mobile,
      password,
    });

    const normalizedUser = normalizeUser(response.data.user);
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setToken(response.data.token);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        // Only consider logged in once token is verified (user object present)
        isLoggedIn: !!user,
        isAdmin: Boolean(user?.isAdmin),
        authLoading,
        token,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
