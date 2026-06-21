"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useRouter } from "next/navigation";

export type UserRole = "admin" | "teacher";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teacherId?: string; // Stored if user is a teacher
  isSuperAdmin?: boolean; // Stored if user is a super admin
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isMock: boolean;
  login: (email: string, password: string, mode: UserRole) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);
  const router = useRouter();

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return !!url && !!key && url !== "your-supabase-project.supabase.co" && !url.includes("placeholder");
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // First check localStorage for a mock session
        const storedUser = localStorage.getItem("dropout_user_session");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          const isMockSession = parsed.id?.startsWith("mock-") || parsed.email?.endsWith("@dropout.com");
          setIsMock(isSupabaseConfigured() ? isMockSession : true);
          setLoading(false);
          return;
        }

        if (isSupabaseConfigured()) {
          setIsMock(false);
          // Check active Supabase session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const token = session.access_token;
            // Verify if they exist in administrators table first
            const verifyAdminRes = await fetch("/api/auth/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ mode: "admin" })
            });

            if (verifyAdminRes.ok) {
              const profile = await verifyAdminRes.json();
              const authUser: AuthUser = {
                id: session.user.id,
                email: session.user.email || "",
                name: profile.name,
                role: "admin",
                isSuperAdmin: profile.isSuperAdmin
              };
              setUser(authUser);
              localStorage.setItem("dropout_user_session", JSON.stringify(authUser));
            } else {
              // Try verifying as teacher
              const verifyTeacherRes = await fetch("/api/auth/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ mode: "teacher" })
              });

              if (verifyTeacherRes.ok) {
                const profile = await verifyTeacherRes.json();
                const authUser: AuthUser = {
                  id: session.user.id,
                  email: session.user.email || "",
                  name: profile.name,
                  role: "teacher",
                  teacherId: profile.teacherId
                };
                setUser(authUser);
                localStorage.setItem("dropout_user_session", JSON.stringify(authUser));
              } else {
                // If in neither table, sign out
                await supabase.auth.signOut();
                setUser(null);
                localStorage.removeItem("dropout_user_session");
              }
            }
          }
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, mode: UserRole) => {
    setLoading(true);
    try {
      // 1. Mock Mode Check (Only active when Supabase is NOT configured)
      if (!isSupabaseConfigured()) {
        setIsMock(true);
        let mockUser: AuthUser | null = null;

        if (mode === "admin" && email === "admin@dropout.com") {
          mockUser = {
            id: "mock-admin-id",
            email: "admin@dropout.com",
            name: "System Administrator",
            role: "admin",
            isSuperAdmin: true,
          };
        } else if (mode === "teacher" && email === "teacher@dropout.com") {
          mockUser = {
            id: "mock-teacher-id",
            email: "teacher@dropout.com",
            name: "Dr. Abdi Noor",
            role: "teacher",
            teacherId: "5", // Matches typical teacher ID in classes database
          };
        }

        if (mockUser) {
          setUser(mockUser);
          localStorage.setItem("dropout_user_session", JSON.stringify(mockUser));
          setLoading(false);
          return { success: true, role: mockUser.role };
        } else {
          setLoading(false);
          return { success: false, error: mode === "admin"
            ? "Fadlan isticmaal admin@dropout.com si aad u gasho (Demo Mode)!"
            : "Fadlan isticmaal teacher@dropout.com si aad u gasho (Demo Mode)!" };
        }
      }

      // 2. Real Supabase Auth Mode
      setIsMock(false);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data?.user && data?.session) {
        const token = data.session.access_token;
        
        // Verify user via secure bypass endpoint
        const verifyRes = await fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ mode })
        });

        if (!verifyRes.ok) {
          const errData = await verifyRes.json();
          await supabase.auth.signOut();
          setLoading(false);
          return { success: false, error: errData.error || "Unauthorized access." };
        }

        const profile = await verifyRes.json();

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || "",
          name: profile.name,
          role: mode,
          teacherId: profile.teacherId,
          isSuperAdmin: profile.isSuperAdmin,
        };

        setUser(authUser);
        localStorage.setItem("dropout_user_session", JSON.stringify(authUser));
        setLoading(false);
        return { success: true, role: mode };
      }

      setLoading(false);
      return { success: false, error: "Failed to login. User data not returned." };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || "An unexpected error occurred." };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (!isMock) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Error during Supabase signout:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("dropout_user_session");
      setLoading(false);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isMock, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
