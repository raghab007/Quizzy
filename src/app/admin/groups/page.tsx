"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Group = { id: string; name: string };

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadGroups() {
    const response = await fetch("/api/admin/groups");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    setGroups(body.groups);
  }

  useEffect(() => {
    loadGroups().catch((loadError: Error) => setError(loadError.message));
  }, []);

  async function createGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setGroups((current) => [...current, body.group].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
  }

  async function deleteGroup(id: string) {
    if (!window.confirm("Delete this group?")) return;
    const response = await fetch(`/api/admin/groups?id=${id}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setGroups((current) => current.filter((group) => group.id !== id));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/dashboard" className="text-sm font-medium text-cyan-700">Back to dashboard</Link>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">Student groups</h1>
        <p className="mt-2 text-slate-600">Manage the groups students can select during registration.</p>
        {error && <p className="mt-6 rounded-lg bg-rose-50 p-4 text-rose-700">{error}</p>}
        <form onSubmit={createGroup} className="mt-8 flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="New group name" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3" />
          <button className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white">Add group</button>
        </form>
        <div className="mt-5 space-y-3">
          {groups.map((group) => <div key={group.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><span className="font-semibold text-slate-900">{group.name}</span><button onClick={() => deleteGroup(group.id)} className="text-sm font-medium text-rose-600">Delete</button></div>)}
        </div>
      </div>
    </main>
  );
}
