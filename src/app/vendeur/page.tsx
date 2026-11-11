"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { COULEURS, PAIEMENTS, STATUTS, dateFr, fcfa, lienWhatsApp } from "@/lib/commandes";

type Cmd = { id: string; nom: string; telephone: string; adresse: string; paiement: string; statut: string; created_at: string };
type Ligne = { id: string; nom: string; prix: number; quantite: number; orders: Cmd | Cmd[] | null };
type Groupe = { cmd: Cmd; lignes: Ligne[] };

const ACTIONS: Record<string, [string, string][]> = {
  nouvelle: [["confirmee", "Confirmer"], ["annulee", "Annuler"]],
  confirmee: [["expediee", "Marquer expÃ©diÃ©e"], ["annulee", "Annuler"]],
  expediee: [["livree", "Marquer livrÃ©e"]],
};

export default function EspaceVendeur() {
  const router = useRouter();
  const { user, profil, chargement } = useAuth();
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [msg, setMsg] = useState("");

  const charger = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("order_items")
      .select("id, nom, prix, quantite, orders(id, nom, telephone, adresse, paiement, statut, created_at)")
      .eq("vendeur_id", user.id);
    setLignes((data as unknown as Ligne[]) ?? []);
  }, [user]);

  useEffect(() => { if (!chargement && !user) router.replace("/connexion"); }, [chargement, user, router]);
  useEffect(() => { charger(); }, [charger]);

  const groupes = useMemo(() => {
    const m = new Map<string, Groupe>();
    (lignes ?? []).forEach((l) => {
      const c = Array.isArray(l.orders) ? l.orders[0] : l.orders;
      if (!c) return;
      if (!m.has(c.id)) m.set(c.id, { cmd: c, lignes: [] });
      m.get(c.id)!.lignes.push(l);
    });
    return [...m.values()].sort((a, b) => b.cmd.created_at.localeCompare(a.cmd.created_at));
  }, [lignes]);



// En haut avec tes useState
const [videoFile, setVideoFile] = useState<File | null>(null);

// Dans le formulaire, aprÃ¨s l'image :
<div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
  <label className="font-black text-sm">ðŸŽ¥ Ajoute une VIDÃ‰O de ton produit (vend 3x plus vite !)</label>
  <input
    type="file"
    accept="video/*"
    onChange={(e)=> setVideoFile(e.target.files?.[0] || null)}
    className="w-full mt-2 p-2 bg-white rounded-xl border"
  />
  <p className="text-[11px] text-gray-500 mt-1">Comme sur Alibaba : montre ton produit en vidÃ©o, les clients achÃ¨tent direct</p>
</div>


useEffect(()=> {
  supabase.auth.getUser().then(({data})=> {
    if (!data.user) window.location.href="/connexion";
  });
},[]);






  const actives = groupes.filter((g) => g.cmd.statut !== "annulee");
  const ventes = actives.reduce((s, g) => s + g.lignes.reduce((t, l) => t + l.prix * l.quantite, 0), 0);
  const nouvelles = groupes.filter((g) => g.cmd.statut === "nouvelle").length;

  async function changer(id: string, statut: string) {
    setMsg("");
    const { error } = await supabase.from("orders").update({ statut }).eq("id", id);
    if (error) return setMsg("Modification impossible.");
    await charger();
  }

  if (chargement || !user) return <p className="p-6">Chargementâ€¦</p>;
  if (profil && profil.role === "client") {
    return (
      <div className="p-6">
        <p className="font-bold">Cet espace est rÃ©servÃ© aux vendeurs.</p>
        <Link href="/compte" className="mt-2 inline-block underline">Devenir vendeur dans Mon compte</Link>
      </div>
    );

  }

  return (
    <div className="min-h-screen bg-[#fafaf7] p-4 text-black md:p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-3xl font-black">mmmali.</Link>
        <h1 className="mt-8 text-4xl font-black">Espace vendeur</h1>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[["Commandes", String(actives.length)], ["Ã€ traiter", String(nouvelles)], ["Ventes", fcfa(ventes)]].map(([t, v]) => (
            <div key={t} className="rounded-2xl bg-white p-3 shadow-sm"><div className="text-xs opacity-60">{t}</div><div className="text-lg font-black">{v}</div></div>
          ))}
        </div>
        {msg && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{msg}</p>}

        {lignes === null ? <p className="mt-6 opacity-60">Chargementâ€¦</p> : groupes.length === 0 ? (
          <p className="mt-6 opacity-60">Aucune commande pour le moment. Elles apparaÃ®tront ici dÃ¨s qu&apos;un client commande un de tes produits.</p>
        ) : groupes.map(({ cmd, lignes: L }) => (
          <div key={cmd.id} className="mt-4 rounded-[24px] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm opacity-60">{dateFr(cmd.created_at)} Â· nÂ° {cmd.id.slice(0, 8).toUpperCase()}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${COULEURS[cmd.statut]}`}>{STATUTS[cmd.statut]}</span>
            </div>
            {L.map((l) => (
              <div key={l.id} className="mt-2 flex justify-between text-sm"><span>{l.quantite} Ã— {l.nom}</span><span>{fcfa(l.prix * l.quantite)}</span></div>
            ))}
            <p className="mt-3 text-sm"><b>{cmd.nom}</b> Â· {cmd.telephone}<br />{cmd.adresse}<br /><span className="opacity-60">{PAIEMENTS[cmd.paiement]}</span></p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
              <a target="_blank" rel="noopener" href={lienWhatsApp(cmd.telephone, `Bonjour ${cmd.nom}, au sujet de votre commande MMMali nÂ° ${cmd.id.slice(0, 8).toUpperCase()}.`)}
                className="rounded-full bg-[#1b7a46] px-4 py-2 text-white">Contacter le client</a>
              {(ACTIONS[cmd.statut] ?? []).map(([s, lib]) => (
                <button key={s} onClick={() => changer(cmd.id, s)} className={`rounded-full px-4 py-2 ${s === "annulee" ? "bg-red-100 text-red-800" : "bg-black text-white"}`}>{lib}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
