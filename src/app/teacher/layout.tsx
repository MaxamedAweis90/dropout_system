"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isMock, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (!loading) {
        if (!user) {
          router.push("/login");
          return;
        }

        if (user.role !== "teacher") {
          router.push("/administrator");
          return;
        }

        // Database validation: Ensure session is present in teachers table
        if (!isMock) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              await logout();
              router.push("/login");
              return;
            }
            const token = session.access_token;
            const verifyRes = await fetch("/api/auth/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ mode: "teacher" })
            });

            if (!verifyRes.ok) {
              await logout();
              toast.error("Unauthorized: You are not registered as a Faculty Member");
              router.push("/login");
            }
          } catch (err) {
            console.error("Error verifying teacher layout access:", err);
            await logout();
            router.push("/login");
          }
        }
      }
    };

    checkAccess();
  }, [user, loading, isMock, router, logout]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
        {/* Sticky Blue Header Skeleton */}
        <header className="sticky top-0 z-40 bg-[#0a2569] h-16 flex items-center justify-between px-6 shadow-md shrink-0 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-6 bg-white/20 rounded w-32"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 bg-white/20 rounded-full w-28"></div>
            <div className="h-8 bg-white/20 rounded-xl w-20"></div>
          </div>
        </header>

        {/* Sidebar + Main Grid Skeleton */}
        <div className="flex flex-1 relative min-h-0">
          <aside className="w-72 bg-white border-r border-slate-200 p-5 flex flex-col gap-4 shrink-0 animate-pulse">
            <div className="h-3 bg-slate-200 rounded w-24 mb-2"></div>
            <div className="space-y-2 flex-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl w-full"></div>
              ))}
            </div>
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="h-3 bg-slate-100 rounded w-40"></div>
              <div className="h-3 bg-slate-100 rounded w-28"></div>
              <div className="h-3 bg-slate-100 rounded w-36"></div>
            </div>
          </aside>

          {/* Main Content Area Skeleton */}
          <main className="flex-1 p-8 overflow-hidden animate-pulse">
            <div className="max-w-[1400px] mx-auto space-y-6">
              <div className="space-y-2">
                <div className="h-5 bg-slate-200 rounded w-48"></div>
                <div className="h-3 bg-slate-200 rounded w-64"></div>
              </div>

              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-slate-200/60 rounded-3xl p-6 h-40 flex flex-col justify-between animate-pulse">
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-24"></div>
                      <div className="h-5 bg-slate-100 rounded w-36"></div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="h-3 bg-slate-100 rounded w-20"></div>
                      <div className="h-4 bg-slate-100 rounded w-28"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "teacher") {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
