"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdministratorDashboard } from "./_components/administrator-dashboard";

export default function AdministratorPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    if (!token) {
      router.push("/login");
      return;
    }
    if (role !== "administrator") {
      router.push("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (authorized === null) return <div className="p-6">Checking authentication...</div>;
  return <AdministratorDashboard />;
}
