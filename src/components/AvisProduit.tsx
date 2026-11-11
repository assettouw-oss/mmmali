"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import { dateFr } from "@/lib/commandes";

type Avis = { id: string; auteur_id: string; auteur_nom: string; note: number; commentaire: string; created_at: string };

const Etoiles = ({ n }: { n: number }) => <span aria-label={`${n} sur 5`} className="text-amber-500">{"★".repeat(n)}<span className="text-black/20">{"★".repeat(5 - n)}</span></span>;

export default function AvisProduit({ produitId, onChange }: { produitId: string; onChange: () => void }) {
  const { user } = useAuth();
  const [liste, setListe] = useState<Avis[]>([]);
  const [peut, setPeut] = useState(false);
  const [note, setNote] = useState(5);
  const [texte, setTexte] = useState("");
  const [msg, setMsg] = useState("");

  const charger = useCallback(async () => {
    const { data } = await supabase.from("reviews")
      .select("id, auteur_id, auteur_nom, note, commentaire, created_at")
      .eq("product_id", produitId).order("created_at", { ascending: false }).limit(50);
    const l = (data as unknown as Avis[]) ?? [];
    setListe(l);
    const mien = l.find((a) => a.auteur_id === user?.id);
    if (mien) { setNote(mien.note); setTexte(mien.commentaire); }
  }, [produitId, user]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => {
    if (!user) { setPeut(false); return; }
    supabase.rpc("a_achete", { pid: produitId }).then(({ data }) => setPeut(data === true));
  }, [user, produitId]);

  async function publier() {
    if (!user) return;
    const { error } = await supabase.from("reviews").upsert(
      { product_id: produitId, auteur_id: user.id, note, commentaire: texte.trim() },
      { onConflict: "product_id,auteur_id" });
    if (error) return setMsg("Avis impossible pour le moment.");
    setMsg("Merci pour ton avis !");
    await charger(); onChange();
  }
  async function supprimer(id: string) {
    await supabase.from("reviews").delete().eq("id", id);
    setTexte(""); setNote(5); setMsg(""); await charger(); onChange();
  }

  const moyenne = liste.length ? liste.reduce((s, a) => s + a.note, 0) / liste.length : 0;
  const mien = liste.find((a) => a.auteur_id === user?.id);

  return (
    <div className="mt-6 border-t border-black/10 pt-4">
      <h4 className="text-lg font-black">
        Avis des clients {liste.length > 0 && <span className="font-normal text-sm opacity-60">· ★ {moyenne.toFixed(1)} ({liste.length})</span>}
      </h4>

      {peut ? (
        <div className="mt-3 rounded-2xl bg-[#f6f3ef] p-3">
          <p className="text-sm font-bold">{mien ? "Modifier mon avis" : "Donne ton avis"}</p>
          <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Note">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setNote(n)} role="radio" aria-checked={note === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                className={`text-3xl ${n <= note ? "text-amber-500" : "text-black/20"}`}>★</button>
            ))}
          </div>
          <textarea value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={500} rows={3} placeholder="Ton commentaire (facultatif)"
            className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-base" />
          <button onClick={publier} className="mt-2 w-full rounded-full bg-black py-2.5 font-black text-white">{mien ? "Mettre à jour" : "Publier mon avis"}</button>
          {msg && <p role="status" className="mt-2 text-sm font-bold">{msg}</p>}
        </div>
      ) : user ? (
        <p className="mt-2 text-sm opacity-60">Tu pourras donner ton avis une fois ta commande de ce produit livrée.</p>
      ) : null}

      {liste.length === 0 ? <p className="mt-3 text-sm opacity-60">Pas encore d&apos;avis.</p> : liste.map((a) => (
        <div key={a.id} className="mt-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span><b>{a.auteur_nom || "Client"}</b> <Etoiles n={a.note} /> <span className="text-[11px] font-bold text-[#1b7a46]">Achat vérifié</span></span>
            <span className="text-xs opacity-50">{dateFr(a.created_at)}</span>
          </div>
          {a.commentaire && <p className="mt-1 opacity-80">{a.commentaire}</p>}
          {a.auteur_id === user?.id && <button onClick={() => supprimer(a.id)} className="mt-1 text-xs font-bold text-red-700 underline">Supprimer mon avis</button>}
        </div>
      ))}
    </div>
  );
}
