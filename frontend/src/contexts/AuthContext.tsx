"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  User,
  login as authLogin,
  logout as authLogout,
  getAccessToken,
  getCurrentUser,
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ["/login"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      const token = getAccessToken();
      if (token) {
        const current = await getCurrentUser();
        setUser(current);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const isAuthenticated = !!getAccessToken();

    if (!isAuthenticated && !isPublic) {
      router.replace("/login");
    }

    if (isAuthenticated && pathname === "/login") {
      router.replace("/");
    }
  }, [loading, pathname, router]);

  async function login(username: string, password: string) {
    await authLogin(username, password);
    const current = await getCurrentUser();
    setUser(current);
    router.replace("/");
  }

  async function logout() {
    await authLogout();
    setUser(null);
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
