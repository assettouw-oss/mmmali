"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function nettoyerWhatsapp(num: any) {
  if (!num) return "";
  let n = String(num).replace(/[^0-9]/g, "");
  if (n.startsWith("00223")) n = n.slice(5);
  else if (n.startsWith("223")) n = n.slice(3);
  else if (n.startsWith("0")) n = n.slice(1);
  if (n.length !== 8) return "";
  return "223" + n;
}
function ouvrirWhatsapp(num: any, message: string) {
  const propre = nettoyerWhatsapp(num);
  if (!propre) { alert("Ce vendeur n'a pas mis son numéro WhatsApp."); return; }
  window.open(`https://wa.me/${propre}?text=${encodeURIComponent(message)}`, "_blank");
}
function lireCache(cle: string) {
  try {
    const c = localStorage.getItem(cle);
    if (!c) return [];
    return JSON.parse(c).data || [];
  } catch { return []; }
}
function sauverCache(cle: string, data: any) {
  try { localStorage.setItem(cle, JSON.stringify({ data, time: Date.now() })); } catch {}
}

const CATEGORIES = ["Tous", "Restaurant", "Électronique", "Mode", "Sport", "Maison", "Beauté", "Autre"];

export default function Accueil() {
  const router = useRouter();
  // 🚀 RAPIDE : On montre le cache tout de suite
  const [produits, setProduits] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    return lireCache("mm_cache_accueil");
  });
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("Tous");
  const [rafraichissement, setRafraichissement] = useState(false);

  async function load() {
    setRafraichissement(true);
    let tous: any[] = [];
    const { data: p1 } = await supabase.from("products")
      .select("id,nom,prix,categorie,vendeur_nom,ville,contact_whatsapp,statut,created_at,video_chemin, product_images(chemin,position)")
      .eq("statut", "publie").order("created_at", { ascending: false }).limit(20);
    if (p1) {
      tous.push(...p1.map((p: any) => {
        const img = (p.product_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0];
        const image_url = img?.chemin ? supabase.storage.from("produits").getPublicUrl(img.chemin).data.publicUrl : null;
        const video_url = p.video_chemin ? supabase.storage.from("produits").getPublicUrl(p.video_chemin).data.publicUrl : null;
        return { id: p.id, titre: p.nom, prix: p.prix, categorie: p.categorie, vendeur_nom: p.vendeur_nom, ville: p.ville || "Bamako", whatsapp: p.contact_whatsapp, image_url, video_url, created_at: p.created_at };
      }));
    }
    const { data: p2 } = await supabase.from("produits").select("id,titre,prix,categorie,whatsapp,image_url,video_url,created_at").order("created_at", { ascending: false }).limit(20);
    if (p2) tous.push(...p2.map((p: any) => ({ ...p, vendeur_nom: "Vendeur MM Mali", ville: "Bamako" })));
    tous.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (tous.length > 0) {
      setProduits(tous);
      sauverCache("mm_cache_accueil", tous);
      // On met aussi en cache pour Reels, comme ça Reels s'ouvre instantanément aussi
      sauverCache("mm_cache_reels", tous);
    }
    setRafraichissement(false);
  }

  useEffect(() => { void load(); }, []);

  // 🚀 Recherche et filtre sur le cache, 0 seconde, pas de Supabase
  const filtres = useMemo(() => {
    return produits.filter((p) => {
      if (categorie !== "Tous" && (p.categorie || "").toLowerCase() !== categorie.toLowerCase() && !(categorie === "Tous")) {
        // On accepte aussi si la catégorie contient le mot
        if (!(p.categorie || "").toLowerCase().includes(categorie.toLowerCase())) return false;
      }
      if (recherche.trim()) {
        const r = recherche.toLowerCase();
        return (p.titre || "").toLowerCase().includes(r) || (p.categorie || "").toLowerCase().includes(r);
      }
      return true;
    });
  }, [produits, recherche, categorie]);

  function ajouterPanier(p: any) {
    try {
      const panier = JSON.parse(localStorage.getItem("mm_panier") || "[]");
      const existe = panier.find((x: any) => String(x.id) === String(p.id));
      if (existe) existe.qte = (existe.qte || 1) + 1;
      else panier.push({ ...p, qte: 1 });
      localStorage.setItem("mm_panier", JSON.stringify(panier));
      alert("Ajouté au panier ✅");
    } catch {}
  }

  return (
    <div style={{ background: "#F2F2F2", minHeight: "100dvh", display: "flex", justifyContent: "center" }}>
    <div style={{ width: "100%", maxWidth: 430, background: "white", minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: 70 }}>
      {/* HEADER */}
      <div style={{ padding: "12px 12px 8px", position: "sticky", top: 0, background: "white", zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ fontWeight: 900, fontSize: 19, margin: 0 }}>MM <span style={{ color: "#FF6B35" }}>Mali</span> <span style={{ fontSize: 11, color: "#888", fontWeight: 400 }}>📍 BAMAKO</span></p>
          <button onClick={() => router.push("/compte")} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 700, color: "#FF6B35" }}>👤 Mon Compte</button>
        </div>
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="🔍 Cherche un produit à Bamako..." style={{ width: "100%", border: "1px solid #eee", borderRadius: 999, padding: "11px 14px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 10, scrollbarWidth: "none" } as any}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategorie(c)} style={{ whiteSpace: "nowrap", background: categorie === c ? "#FF6B35" : "#f2f2f2", color: categorie === c ? "white" : "#333", border: "none", padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 900 }}>{c}</button>
          ))}
        </div>
      </div>

      {/* BANNER */}
      <div style={{ margin: "0 12px 10px", background: "#FFF7ED", borderRadius: 14, padding: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 14, margin: "0 0 4px" }}>👋 Bienvenue chez MM Mali !</p>
        <p style={{ fontSize: 12, color: "#666", margin: "0 0 10px" }}>Achète et vends à Bamako. Paiement à la livraison ou Mobile Money. C'est gratuit.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/compte")} style={{ flex: 1, background: "#FF6B35", color: "white", border: "none", padding: "9px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>Aller à Mon Compte</button>
          <button onClick={() => router.push("/compte")} style={{ flex: 1, background: "#111", color: "white", border: "none", padding: "9px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>⭐ Devenir PRO - 2.000 F</button>
        </div>
      </div>
      <div style={{ margin: "0 12px 12px", background: "black", borderRadius: 14, padding: 14, color: "white" }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: "#FFD166", margin: "0 0 4px" }}>GRATUIT - 30 SECONDES - BAMAKO</p>
        <p style={{ fontWeight: 900, fontSize: 15, margin: "0 0 4px" }}>Tu vends quelque chose à Bamako ?</p>
        <p style={{ fontSize: 12, opacity: 0.8, margin: "0 0 10px" }}>Crée ta Boutique PRO. Publie tes produits. Reçois des clients sur WhatsApp.</p>
        <button onClick={() => router.push("/compte")} style={{ width: "100%", background: "#FF6B35", color: "white", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>Aller à Mon Compte →</button>
        <p style={{ fontSize: 10, opacity: 0.6, textAlign: "center", margin: "8px 0 0" }}>E-mail + Mot de passe + WhatsApp obligatoires • Livraison Bamako uniquement</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 12px 8px" }}>
        <p style={{ fontWeight: 900, fontSize: 14, margin: 0 }}>Produits à Bamako • {filtres.length} {rafraichissement ? "• Mise à jour..." : ""}</p>
        <button onClick={() => void load()} style={{ background: "none", border: "none", fontSize: 12, color: "#FF6B35", fontWeight: 900 }}>↻ Actualiser</button>
      </div>

      {/* PRODUITS */}
      {filtres.length === 0 && produits.length === 0 ? (
        <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} style={{ background: "#f2f2f2", height: 180, borderRadius: 12 }} />
          ))}
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#888", fontSize: 13 }}>Chargement des produits...</p>
        </div>
      ) : filtres.length === 0 ? (
        <p style={{ textAlign: "center", color: "#888", fontSize: 13, padding: 20 }}>Aucun produit pour "{recherche}" dans {categorie}.</p>
      ) : (
        <div style={{ padding: "0 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {filtres.map((p: any) => (
            <div key={p.id} onClick={() => router.push("/reels")} style={{ background: "white", border: "1px solid #eee", borderRadius: 12, overflow: "hidden", cursor: "pointer" }}>
              <div style={{ position: "relative", height: 150, background: "#f2f2f2" }}>
                {p.image_url ? <img src={p.image_url} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📦</div>}
                <span style={{ position: "absolute", top: 6, left: 6, background: "#FF6B35", color: "white", fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 999 }}>{p.categorie || "Neuf"}</span>
                {p.video_url && <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.6)", color: "white", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>▶️</span>}
              </div>
              <div style={{ padding: 8 }}>
                <p style={{ fontWeight: 900, fontSize: 12, margin: "0 0 2px", lineHeight: 1.2, height: 28, overflow: "hidden" }}>{p.titre}</p>
                <p style={{ fontWeight: 900, fontSize: 13, color: "#FF6B35", margin: "0 0 2px" }}>{Number(p.prix).toLocaleString()} F</p>
                <p style={{ fontSize: 11, color: "#888", margin: "0 0 6px" }}>📱 {p.whatsapp} • 📍 {p.ville}</p>
                <button onClick={(e) => { e.stopPropagation(); const msg = `Bonjour, je veux commander sur MM Mali : ${p.titre} - ${Number(p.prix).toLocaleString()} F`; ouvrirWhatsapp(p.whatsapp, msg); }} style={{ width: "100%", background: "#111", color: "white", border: "none", padding: "8px 0", borderRadius: 999, fontWeight: 900, fontSize: 11, marginBottom: 6 }}>COMMANDER</button>
                <button onClick={(e) => { e.stopPropagation(); const msg = `Bonjour, je veux commander : ${p.titre}`; ouvrirWhatsapp(p.whatsapp, msg); }} style={{ width: "100%", background: "#22C55E", color: "white", border: "none", padding: "8px 0", borderRadius: 999, fontWeight: 900, fontSize: 11, marginBottom: 6 }}>💬 WhatsApp</button>
                <button onClick={(e) => { e.stopPropagation(); ajouterPanier(p); }} style={{ width: "100%", background: "#f2f2f2", color: "#111", border: "none", padding: "8px 0", borderRadius: 999, fontWeight: 900, fontSize: 11 }}>🛒 Ajouter au Panier</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BARRE DU BAS */}
      <div style={{ background: "white", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-around", padding: "8px 0 10px", position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto", zIndex: 30 }}>
        <button style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#FF6B35" }}>🏠<br />Accueil</button>
        <button onClick={() => router.push("/messagerie")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>💬<br />Messagerie</button>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🛒<br />Panier</button>
        <button onClick={() => router.push("/reels")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🎬<br />Reels</button>
        <button onClick={() => router.push("/compte")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>👤<br />Compte</button>
      </div>
    </div>
    </div>
  );
}