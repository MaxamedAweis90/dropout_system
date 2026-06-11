"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const body = JSON.parse(text);
          throw new Error(body.detail || "Login failed");
        } catch {
          throw new Error(text || "Login failed");
        }
      }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);
      // redirect based on role
      if (data.role === "administrator") router.push("/administrator");
      else router.push("/teacher");
    } catch (err: any) {
      setError(String(err.message || err));
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Sign In</h1>
        <p className="mt-2 text-sm text-slate-600">Use demo accounts: admin/adminpass or teacher/teacherpass</p>
        <label className="mt-4 block text-sm">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        <label className="mt-4 block text-sm">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
        <button type="submit" className="mt-6 w-full rounded bg-indigo-600 px-4 py-2 text-white">Sign in</button>
      </form>
    </main>
  );
}
