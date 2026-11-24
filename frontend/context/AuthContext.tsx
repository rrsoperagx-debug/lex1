/**
 * ============================================================================
 * LexPortal - Kontekst Uwierzytelniania (Authentication Context)
 * ============================================================================
 *
 * Opis:
 * Ten plik implementuje React Context (`AuthContext`) w celu globalnego
 * zarządzania stanem uwierzytelniania użytkownika w całej aplikacji.
 * Dzięki temu komponenty mogą łatwo uzyskać dostęp do informacji o zalogowanym
 * użytkowniku i tokenie bez potrzeby przesyłania propsów (tzw. "prop drilling").
 *
 * Kluczowe Funkcjonalności:
 *
 * 1. `AuthProvider`:
 *    - Główny komponent-dostawca, który powinien obejmować całą aplikację.
 *    - Zarządza stanem użytkownika (`user`), tokenem JWT (`token`) oraz
 *      stanem ładowania (`loading`).
 *    - Synchronizuje stan z `localStorage`, aby zapewnić trwałość sesji
 *      po odświeżeniu strony.
 *    - Udostępnia metody do zarządzania cyklem życia sesji: `login`, `register`,
 *      `logout`.
 *
 * 2. `useAuth`:
 *    - Niestandardowy hook, który upraszcza dostęp do danych z `AuthContext`.
 *    - Zapewnia, że komponenty używające tego hooka są potomkami `AuthProvider`.
 *
 * Udostępniane Dane:
 * - `user`: Obiekt z danymi zalogowanego użytkownika lub `null`.
 * - `token`: Token JWT lub `null`.
 * - `isAuthenticated`: Wartość `boolean` wskazująca, czy użytkownik jest
 *   zalogowany.
 * - `loading`: Wartość `boolean` informująca, czy trwa inicjalizacja
 *   stanu autentykacji (np. pobieranie danych użytkownika).
 *
 * Rola w Architekturze:
 * - Centralne "źródło prawdy" o stanie uwierzytelniania.
 * - Umożliwia tworzenie chronionych tras (protected routes) i warunkowe
 *   renderowanie komponentów w zależności od statusu logowania.
 * ============================================================================
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, RegisterData } from "../services/api";

interface UserProfile {
  first_name?: string;
  last_name?: string;
  pesel?: string;
  address?: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  is_2fa_enabled: boolean;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (loginData: { email: string; password: string }) => Promise<{ user?: User; require_2fa?: boolean }>;
  verify2fa: (email: string, code: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem("isLoggedIn") === "true",
  );

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = "/#/";
  };

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated) {
        try {
          const userData = (await authApi.getMe()) as unknown as User;
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (loginData: {
    email: string;
    password: string;
  }): Promise<{ user?: User; require_2fa?: boolean }> => {
    const data = await authApi.login(loginData);

    if (data.require_2fa) {
      return { require_2fa: true };
    }

    // Following login, the HttpOnly cookie is automatically set by the browser
    setIsAuthenticated(true);
    localStorage.setItem("isLoggedIn", "true");

    const userData = (await authApi.getMe()) as unknown as User;
    setUser(userData);
    localStorage.setItem("userRole", userData.role || "client");

    return { user: userData };
  };

  const register = async (userData: RegisterData) => {
    await authApi.register(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null, // Token is now in HttpOnly cookie, inaccessible to JS
        isAuthenticated,
        loading,
        login,
        verify2fa: async (email: string, code: string) => {
          const data = await authApi.login2fa({ email, code });
          // Browser handles cookie
          setIsAuthenticated(true);
          localStorage.setItem("isLoggedIn", "true");
          const userData = (await authApi.getMe()) as unknown as User;
          setUser(userData);
          localStorage.setItem("userRole", userData.role || "client");
          return userData;
        },
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
