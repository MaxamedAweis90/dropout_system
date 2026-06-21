"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function AdministratorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isMock, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (!loading) {
        if (!user) {
          router.push("/login");
          return;
        }

        if (user.role !== "admin") {
          router.push("/teacher");
          return;
        }

        // Database validation: Ensure session is present in administrators table
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
              body: JSON.stringify({ mode: "admin" })
            });

            if (!verifyRes.ok) {
              await logout();
              toast.error("Unauthorized: Administrator access required");
              router.push("/login");
            }
          } catch (err) {
            console.error("Error verifying administrator layout access:", err);
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
      <div className="min-h-screen flex bg-[#f3f6fd] font-sans antialiased text-slate-800 w-full overflow-hidden">
        {/* Skeleton Sidebar */}
        <aside className="w-72 bg-[#0c1329] flex flex-col justify-between p-6 shrink-0 h-screen">
          <div className="space-y-8 animate-pulse">
            {/* Logo Header Skeleton */}
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-slate-850 bg-slate-800"></div>
              <div className="flex flex-col gap-2">
                <div className="h-4 bg-slate-800 rounded w-24"></div>
                <div className="h-2.5 bg-slate-800 rounded w-16"></div>
              </div>
            </div>
            {/* Nav Skeleton */}
            <div className="space-y-4 pt-4">
              <div className="h-3 bg-slate-800 rounded w-28 px-3"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-slate-800 rounded-xl w-full"></div>
                ))}
              </div>
            </div>
          </div>
          {/* Profile Card Skeleton */}
          <div className="space-y-4 animate-pulse">
            <div className="bg-[#121a36] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800"></div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-3 bg-slate-800 rounded w-20"></div>
                <div className="h-2 bg-slate-800 rounded w-12"></div>
              </div>
            </div>
            <div className="h-10 bg-slate-800/50 rounded-xl w-full"></div>
          </div>
        </aside>

        {/* Skeleton Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Bar Skeleton */}
          <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-[#f3f6fd]">
            <div className="space-y-2 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-48"></div>
              <div className="h-3 bg-slate-200 rounded w-32"></div>
            </div>
            <div className="flex items-center gap-4 animate-pulse">
              <div className="h-10 bg-slate-200 rounded-xl w-60"></div>
              <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex flex-col gap-1">
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                  <div className="h-2 bg-slate-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area Skeleton */}
          <main className="flex-1 p-8 pt-0 overflow-hidden">
            <div className="max-w-[1500px] mx-auto space-y-6 animate-pulse">
              {/* Cards Grid */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white border border-slate-200/60 rounded-3xl p-6 h-40 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-2xl"></div>
                        <div className="flex flex-col gap-2">
                          <div className="h-2 bg-slate-100 rounded w-16"></div>
                          <div className="h-6 bg-slate-100 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="w-10 h-4 bg-slate-100 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-2 bg-slate-100 rounded w-16"></div>
                      <div className="w-20 h-6 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Panel Skeleton */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-8 bg-white border border-slate-200/60 rounded-3xl p-6 h-64">
                  <div className="h-4 bg-slate-100 rounded w-32 mb-4"></div>
                  <div className="h-48 bg-slate-50 rounded-2xl"></div>
                </div>
                <div className="lg:col-span-4 bg-white border border-slate-200/60 rounded-3xl p-6 h-64">
                  <div className="h-4 bg-slate-100 rounded w-32 mb-4"></div>
                  <div className="h-48 bg-slate-50 rounded-2xl"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
