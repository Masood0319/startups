"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await apiRequest("auth/me", {
          method: "GET",
          cache: "no-store",
        });
        const me = data?.data?.user;
        if (me) {
          setUser({
            _id: me.id || me.userId,
            email: me.email,
            full_name: me.full_name || me.fullName,
            role: me.role,
          });
        }
      } catch (err) {
        if (err?.status === 401) {
          setUser(null);
        } else {
          console.error("Failed to fetch user:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
