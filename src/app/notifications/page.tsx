"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { dateFr } from "@/lib/commandes";

type N = { id: string; titre: string; corps: string; lu: boolean; created_at: string };

export default function Notifications() {
  const router = useRouter();
  const { user, chargement } = useAuth();
  const [liste, setListe] = useState<N[] | null>(null);

  useEffect(() => { if (!chargement && !user) router.replace("/connexion"); }, [chargement, user, router]);
  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("id, titre, corps, lu, created_at")
      .order("created_at", { ascending: false }).limit(50)
      .then(async ({ data }) => {
        setListe((data as unknown as N[]) ?? []);
        await supabase.from("notifications").update({ lu: true }).eq("user_id", user.id).eq("lu", false);
      });
  }, [user]);

  const lien = (t: string) => (t.toLowerCase().includes("message") ? "/messages" : "/vendeur");

  return (
    <div className="min-h-screen bg-[#fafaf7] p-4 text-black md:p-6">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="text-3xl font-black">mmmali.</Link>
        <h1 className="mt-8 text-4xl font-black">Notifications</h1>
        <Link href="/messages" className="mt-3 inline-block rounded-full bg-black px-5 py-2 text-sm font-bold text-white">Ouvrir mes messages</Link>

        {liste === null ? <p className="mt-6 opacity-60">Chargement…</p> : liste.length === 0 ? (
          <p className="mt-6 opacity-60">Aucune notification pour le moment.</p>
        ) : liste.map((n) => (
          <Link key={n.id} href={lien(n.titre)} className={`mt-3 block rounded-2xl p-4 shadow-sm ${n.lu ? "bg-white" : "bg-amber-50 ring-2 ring-amber-300"}`}>
            <div className="flex justify-between gap-2"><b>{n.titre}</b><span className="text-xs opacity-60">{dateFr(n.created_at)}</span></div>
            {n.corps && <p className="mt-1 text-sm opacity-70">{n.corps}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
