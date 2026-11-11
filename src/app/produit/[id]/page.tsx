"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ProduitDetail() {
  const params = useParams();
  const id = params.id as string;
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("produits").select("*").eq("id", id).single();
      if (data) setP(data);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  if (loading) return <div style={{ padding: 20, textAlign: "center" }}>Chargement...</div>;
  if (!p) return <div style={{ padding: 20, textAlign: "center" }}><p style={{ fontWeight: 900 }}>Produit introuvable</p><Link href="/" style={{ color: "#FF6B35", fontWeight: "bold" }}>← Retour Accueil</Link></div>;

  const wa = p.whatsapp || "98196047";
  const waClean = String(wa).replace(/\s/g, "").replace(/^\+223/, "").replace(/^223/, "");
  const waLink = `https://wa.me/223${waClean}?text=${encodeURIComponent(`Bonjour, je veux ce produit : ${p.titre} - ${p.prix} FCFA`)}`;

  return (
    <div style={{ background: "white", minHeight: "100vh", paddingBottom: 160 }}>
      {/* BOUTON RETOUR */}
      <div style={{ padding: 12 }}>
        <Link href="/" style={{ textDecoration: "none", color: "black", fontWeight: "bold", fontSize: 13, background: "#FFF1E8", padding: "8px 14px", borderRadius: 999 }}>← Retour</Link>
      </div>

      {/* PHOTO / VIDEO - SANS TEXTE PAR DESSUS */}
      <div style={{ padding: "0 12px" }}>
        {p.video_url ? (
          <video src={p.video_url} controls playsInline poster={p.image_url} style={{ width: "100%", borderRadius: 18, maxHeight: 420, objectFit: "cover", background: "black" }} />
        ) : (
          <img src={p.image_url} style={{ width: "100%", borderRadius: 18, maxHeight: 420, objectFit: "cover" }} />
        )}
      </div>

      {/* VENDEUR ANONYME - UNE SEULE LIGNE, PAS DE CHEVAUCHEMENT */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 14px 0" }}>
        <div style={{ width: 36, height: 36, background: "#888", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16 }}>🕶️</div>
        <div>
          <p style={{ fontWeight: 900, fontSize: 13, margin: 0 }}>Vendeur Anonyme</p>
          <p style={{ fontSize: 11, color: "#888", margin: 0 }}>📍 {p.ville || "Bamako"} • {p.categorie || "Electronique"} • {p.mode_produit || "Neuf"}</p>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 10, background: "#E6FFED", color: "green", padding: "4px 8px", borderRadius: 999, fontWeight: "bold" }}>✓ Vérifié</span>
      </div>

      {/* TITRE / PRIX / DESCRIPTION - CHACUN SUR SA LIGNE */}
      <div style={{ padding: "14px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>{p.titre}</h1>
        <p style={{ fontSize: 22, fontWeight: 900, color: "#FF6B35", margin: "10px 0 0" }}>{Number(p.prix).toLocaleString()} FCFA</p>
        <p style={{ fontSize: 13, color: "#333", lineHeight: 1.6, marginTop: 12, whiteSpace: "pre-wrap" }}>{p.description || "N'hésite pas à me contacter"}</p>

        <div style={{ background: "#F9F9F9", borderRadius: 14, padding: 12, marginTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 900, margin: 0 }}>📋 Détails du produit</p>
          <p style={{ fontSize: 12, color: "#555", margin: "8px 0 0" }}>• Catégorie : {p.categorie || "Electronique"}</p>
          <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>• État : {p.mode_produit || "Neuf"}</p>
          <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>• Ville : {p.ville || "Bamako"}</p>
          <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>• Livraison : 1 500 F à Bamako</p>
        </div>
      </div>

      {/* BOUTONS - FIXES EN BAS, AU DESSUS DU MENU, PAS CACHES */}
      <div style={{ position: "fixed", bottom: 78, left: 0, right: 0, zIndex: 60, padding: "0 12px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", background: "white", borderRadius: 18, padding: 12, boxShadow: "0 -2px 20px rgba(0,0,0,0.12)", border: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 11, color: "#888", margin: 0 }}>Prix total</p>
              <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{Number(p.prix).toLocaleString()} FCFA</p>
            </div>
            <p style={{ fontSize: 12, fontWeight: "bold", color: "#25D366", margin: 0 }}>📱 {wa}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ flex: 1, background: "black", color: "white", border: "none", padding: "14px 0", borderRadius: 999, fontWeight: "bold", fontSize: 13 }}>🛒 Ajouter au Panier</button>
            <a href={waLink} target="_blank" style={{ flex: 1.2, background: "#25D366", color: "white", textAlign: "center", padding: "14px 0", borderRadius: 999, fontWeight: "bold", fontSize: 13, textDecoration: "none" }}>💬 WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  );
}