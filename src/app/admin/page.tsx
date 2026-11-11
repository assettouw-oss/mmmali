"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { COULEURS, STATUTS, dateFr, fcfa } from "@/lib/commandes";

type Util = { id: string; nom: string; telephone: string | null; ville: string | null; role: string; created_at: string };
type Ann = { id: string; nom: string; prix: number; vendeur_nom: string; ville: string; categorie: string; statut: string; created_at: string; product_images: { chemin: string }[] };
type Cmd = { id: string; nom: string; telephone: string; total: number; statut: string; paiement: string; created_at: string };
type Onglet = "utilisateurs" | "annonces" | "commandes";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const SEL = "rounded-xl border border-black/15 bg-white px-2 py-1.5 text-sm font-bold";

export default function Administration() {
  const router = useRouter();
  const { user, profil, chargement } = useAuth();
  const [onglet, setOnglet] = useState<Onglet>("utilisateurs");
  const [utils, setUtils] = useState<Util[] | null>(null);
  const [anns, setAnns] = useState<Ann[]>([]);
  const [cmds, setCmds] = useState<Cmd[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const charger = useCallback(async () => {
    const [u, a, c] = await Promise.all([
      supabase.from("profiles").select("id, nom, telephone, ville, role, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("products").select("id, nom, prix, vendeur_nom, ville, categorie, statut, created_at, product_images(chemin)").order("created_at", { ascending: false }).limit(200),
      supabase.from("orders").select("id, nom, telephone, total, statut, paiement, created_at").order("created_at", { ascending: false }).limit(200),
    ]);
    setUtils((u.data as unknown as Util[]) ?? []);
    setAnns((a.data as unknown as Ann[]) ?? []);
    setCmds((c.data as unknown as Cmd[]) ?? []);
  }, []);

  useEffect(() => { if (!chargement && !user) router.replace("/connexion"); }, [chargement, user, router]);
  useEffect(() => { if (profil?.role === "admin") charger(); }, [profil, charger]);

  const n = norm(q);
  const lu = useMemo(() => (utils ?? []).filter((x) => !n || norm(`${x.nom} ${x.telephone ?? ""} ${x.ville ?? ""}`).includes(n)), [utils, n]);
  const la = useMemo(() => anns.filter((x) => !n || norm(`${x.nom} ${x.vendeur_nom} ${x.ville}`).includes(n)), [anns, n]);
  const lc = useMemo(() => cmds.filter((x) => !n || norm(`${x.nom} ${x.telephone} ${x.id}`).includes(n)), [cmds, n]);

  async function agir(p: PromiseLike<{ error: unknown }>, ok = "") {
    const { error } = await p;
    setMsg(error ? "Action impossible. Vérifie que admin.sql a bien été exécuté." : ok);
    if (!error) await charger();
  }
  async function supprimerAnnonce(a: Ann) {
    if (!confirm(`Supprimer « ${a.nom} » définitivement ?`)) return;
    const chemins = a.product_images.map((i) => i.chemin);
    if (chemins.length) await supabase.storage.from("produits").remove(chemins);
    await agir(supabase.from("products").delete().eq("id", a.id), "Annonce supprimée.");
  }

  if (chargement || !user || !profil) return <p className="p-6">Chargement…</p>;
  if (profil.role !== "admin") {
    return <div className="p-6"><p className="font-bold">Cet espace est réservé aux administrateurs.</p><Link href="/" className="mt-2 inline-block underline">Retour à la boutique</Link></div>;
  }

  const ventes = cmds.filter((c) => c.statut !== "annulee").reduce((s, c) => s + c.total, 0);
  const stats: [string, string][] = [
    ["Utilisateurs", String(utils?.length ?? 0)],
    ["Vendeurs", String((utils ?? []).filter((x) => x.role !== "client").length)],
    ["Annonces en ligne", String(anns.filter((x) => x.statut === "publie").length)],
    ["Commandes", String(cmds.length)],
    ["Ventes", fcfa(ventes)],
  ];

  return (
    <div className="min-h-screen bg-[#fafaf7] p-4 text-black md:p-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-3xl font-black">mmmali.</Link>
        <h1 className="mt-8 text-4xl font-black">Administration</h1>

        <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
          {stats.map(([t, v]) => <div key={t} className="rounded-2xl bg-white p-3 shadow-sm"><div className="text-xs opacity-60">{t}</div><div className="text-lg font-black">{v}</div></div>)}
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto text-sm font-bold">
          {(["utilisateurs", "annonces", "commandes"] as Onglet[]).map((o) => (
            <button key={o} onClick={() => { setOnglet(o); setQ(""); setMsg(""); }} className={`shrink-0 rounded-full px-4 py-2 capitalize ${onglet === o ? "bg-black text-white" : "bg-white shadow"}`}>{o}</button>
          ))}
        </div>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" aria-label="Rechercher"
          className="mt-3 w-full rounded-full bg-white px-5 py-3 shadow-sm outline-none focus:ring-2 focus:ring-black" />
        {msg && <p role="status" className="mt-3 text-sm font-bold text-[#1b7a46]">{msg}</p>}

        {onglet === "utilisateurs" && lu.map((x) => (
          <div key={x.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow-sm">
            <div><b>{x.nom || "Sans nom"}</b><div className="text-sm opacity-60">{[x.telephone, x.ville].filter(Boolean).join(" · ") || "—"} · inscrit le {dateFr(x.created_at)}</div></div>
            <select className={SEL} value={x.role} disabled={x.id === user.id} aria-label={`Rôle de ${x.nom}`}
              onChange={(e) => agir(supabase.from("profiles").update({ role: e.target.value }).eq("id", x.id), "Rôle modifié.")}>
              <option value="client">Acheteur</option><option value="vendeur">Vendeur</option><option value="admin">Administrateur</option>
            </select>
          </div>
        ))}

        {onglet === "annonces" && la.map((a) => (
          <div key={a.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow-sm">
            <div><b>{a.nom}</b> <span className={`rounded-full px-2 py-0.5 text-xs font-black ${a.statut === "publie" ? "bg-green-100" : "bg-red-100"}`}>{a.statut === "publie" ? "En ligne" : "Masquée"}</span>
              <div className="text-sm opacity-60">{fcfa(a.prix)} · {a.vendeur_nom}, {a.ville} · {a.categorie}</div></div>
            <div className="flex gap-2 text-sm font-bold">
              <button onClick={() => agir(supabase.from("products").update({ statut: a.statut === "publie" ? "masque" : "publie" }).eq("id", a.id), "Annonce mise à jour.")} className="rounded-full bg-black px-4 py-2 text-white">{a.statut === "publie" ? "Masquer" : "Publier"}</button>
              <button onClick={() => supprimerAnnonce(a)} className="rounded-full bg-red-100 px-4 py-2 text-red-800">Supprimer</button>
            </div>
          </div>
        ))}

        {onglet === "commandes" && lc.map((c) => (
          <div key={c.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow-sm">
            <div><b>{c.nom}</b> · {c.telephone}<div className="text-sm opacity-60">{dateFr(c.created_at)} · n° {c.id.slice(0, 8).toUpperCase()} · {fcfa(c.total)}</div></div>
            <select className={`${SEL} ${COULEURS[c.statut]}`} value={c.statut} aria-label="Statut de la commande"
              onChange={(e) => agir(supabase.from("orders").update({ statut: e.target.value }).eq("id", c.id), "Statut modifié.")}>
              {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        ))}
        {((onglet === "utilisateurs" && lu.length === 0) || (onglet === "annonces" && la.length === 0) || (onglet === "commandes" && lc.length === 0)) && (
          <p className="mt-6 opacity-60">Rien à afficher.</p>
        )}
      </div>
    </div>
  );
}
