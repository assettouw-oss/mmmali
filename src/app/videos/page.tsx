"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fcfa } from "@/lib/commandes";

type V = { id: string; nom: string; prix: number; vendeur_nom: string; ville: string; video_chemin: string };

// Même panier que la boutique : il est enregistré dans le navigateur.
function ajouterAuPanier(id: string) {
  try {
    const c = JSON.parse(localStorage.getItem("mmmali-panier") || "{}") as Record<string, number>;
    c[id] = (c[id] || 0) + 1;
    localStorage.setItem("mmmali-panier", JSON.stringify(c));
  } catch {}
}

function Clip({ v, muet, info }: { v: V; muet: boolean; info: (m: string) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const url = supabase.storage.from("videos").getPublicUrl(v.video_chemin).data.publicUrl;

  return (
    <section className="relative h-[100dvh] snap-start bg-black">
      <video ref={ref} src={url} loop playsInline muted={muet} preload="metadata" className="h-full w-full object-contain" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pb-8 text-white">
        <p className="text-sm opacity-70">{v.vendeur_nom} · {v.ville}</p>
        <h2 className="text-xl font-black leading-tight">{v.nom}</h2>
        <p className="mt-1 text-2xl font-black text-[#f4b82e]">{fcfa(v.prix)}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => { ajouterAuPanier(v.id); info("Ajouté au panier"); }} className="flex-1 rounded-full bg-white py-3 font-black text-black">Ajouter au panier</button>
          <button onClick={() => { ajouterAuPanier(v.id); router.push("/?panier=1"); }} className="flex-1 rounded-full bg-[#f4b82e] py-3 font-black text-black">Commander</button>
        </div>
      </div>
    </section>
  );
}

export default function Videos() {
  const [liste, setListe] = useState<V[] | null>(null);
  const [muet, setMuet] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.from("products").select("id, nom, prix, vendeur_nom, ville, video_chemin")
      .not("video_chemin", "is", null).eq("statut", "publie")
      .order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => setListe((data as unknown as V[]) ?? []));
  }, []);

  const info = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  return (
    <div className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll bg-black text-white">
      <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between p-3">
        <Link href="/" className="rounded-full bg-black/60 px-4 py-2 text-sm font-bold">← Boutique</Link>
        <button onClick={() => setMuet(!muet)} aria-label={muet ? "Activer le son" : "Couper le son"} className="rounded-full bg-black/60 px-4 py-2 text-sm font-bold">{muet ? "🔇 Son coupé" : "🔊 Son activé"}</button>
      </div>

      {liste === null && <p className="grid h-[100dvh] place-items-center opacity-60">Chargement…</p>}
      {liste && liste.length === 0 && (
        <div className="grid h-[100dvh] place-items-center p-6 text-center">
          <div>
            <p className="text-2xl font-black">Aucune vidéo pour le moment</p>
            <p className="mt-2 opacity-70">Les vendeurs peuvent ajouter une vidéo en publiant un produit.</p>
            <Link href="/" className="mt-4 inline-block rounded-full bg-[#f4b82e] px-6 py-3 font-black text-black">Retour à la boutique</Link>
          </div>
        </div>
      )}
      {liste?.map((v) => <Clip key={v.id} v={v} muet={muet} info={info} />)}
      {msg && <div role="status" className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white px-5 py-2 text-sm font-bold text-black">{msg}</div>}
    </div>
  );
}
