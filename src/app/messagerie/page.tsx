"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

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
function nettoyerWhatsapp(num: any) {
  if (!num) return "";
  let n = String(num).replace(/[^0-9]/g, "");
  if (n.startsWith("00223")) n = n.slice(5);
  else if (n.startsWith("223")) n = n.slice(3);
  else if (n.startsWith("0")) n = n.slice(1);
  if (n.length !== 8) return "";
  return "223" + n;
}

export default function Messagerie() {
  const router = useRouter();
  // 🚀 RAPIDE : Cache tout de suite
  const [notifs, setNotifs] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    return lireCache("mm_cache_notifs");
  });
  const [conversations, setConversations] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("mm_conversations") || "[]"); } catch { return []; }
  });
  const [onglet, setOnglet] = useState<"commentaires" | "conversations">("commentaires");
  const [monWhatsapp, setMonWhatsapp] = useState("");

  async function chargerNotifs() {
    // On récupère le whatsapp du vendeur
    let w = "";
    try {
      const u = JSON.parse(localStorage.getItem("mm_user") || "null");
      if (u?.whatsapp) w = nettoyerWhatsapp(u.whatsapp);
    } catch {}
    if (!w) w = nettoyerWhatsapp(localStorage.getItem("mm_vendeur_whatsapp") || localStorage.getItem("mm_whatsapp") || "");
    setMonWhatsapp(w);

    // On charge les notifs - on montre d'abord celles du cache, puis on met à jour
    let q = supabase.from("notifications_commentaires").select("*").order("created_at", { ascending: false }).limit(30);
    // Si on connait ton whatsapp, on ne montre que TES vidéos
    // Pour tester, on montre tout si tu n'as pas encore de whatsapp sauvé
    if (w) {
      // On essaie filtré, si vide on montre tout pour ne pas rater
      const { data: filtre } = await q.eq("vendeur_whatsapp", w);
      if (filtre && filtre.length > 0) {
        setNotifs(filtre);
        sauverCache("mm_cache_notifs", filtre);
        return;
      }
      // Sinon on montre aussi les notifs sans whatsapp ou avec autre format
      const { data: tous } = await supabase.from("notifications_commentaires").select("*").order("created_at", { ascending: false }).limit(30);
      if (tous) {
        // On filtre à la main pour être sûr : on compare les numéros nettoyés
        const miens = tous.filter((n: any) => {
          if (!n.vendeur_whatsapp) return true; // ancien commentaire sans whatsapp, on le montre pour tester
          return nettoyerWhatsapp(n.vendeur_whatsapp) === w;
        });
        setNotifs(miens);
        sauverCache("mm_cache_notifs", miens);
      }
      return;
    }
    const { data } = await q;
    if (data) {
      setNotifs(data);
      sauverCache("mm_cache_notifs", data);
    }
  }

  useEffect(() => { void chargerNotifs(); }, []);

  async function marquerLu(id: string) {
    await supabase.from("notifications_commentaires").update({ lu: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, lu: true } : n));
  }

  function ouvrirWhatsappVendeur(num: any, message: string) {
    const propre = nettoyerWhatsapp(num);
    if (!propre) { alert("Pas de numéro WhatsApp."); return; }
    window.open(`https://wa.me/${propre}?text=${encodeURIComponent(message)}`, "_blank");
  }

  const nbNonLus = notifs.filter((n) => !n.lu).length;

  return (
    <div style={{ background: "#F2F2F2", minHeight: "100dvh", display: "flex", justifyContent: "center" }}>
    <div style={{ width: "100%", maxWidth: 430, background: "white", minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: 70 }}>
      <div style={{ padding: "14px 12px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>💬 Messagerie {nbNonLus > 0 && <span style={{ background: "#E11D48", color: "white", fontSize: 11, padding: "2px 8px", borderRadius: 99 }}>{nbNonLus} nouveau</span>}</p>
        <button onClick={() => void chargerNotifs()} style={{ background: "none", border: "none", color: "#FF6B35", fontSize: 12, fontWeight: 900 }}>↻ Actualiser</button>
      </div>

      {/* ONGLETS */}
      <div style={{ display: "flex", gap: 8, padding: "0 12px 12px" }}>
        <button onClick={() => setOnglet("commentaires")} style={{ flex: 1, background: onglet === "commentaires" ? "#111" : "#f2f2f2", color: onglet === "commentaires" ? "white" : "#333", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>💬 Commentaires sur mes vidéos ({notifs.length})</button>
        <button onClick={() => setOnglet("conversations")} style={{ flex: 1, background: onglet === "conversations" ? "#111" : "#f2f2f2", color: onglet === "conversations" ? "white" : "#333", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>📱 Conversations ({conversations.length})</button>
      </div>

      {onglet === "commentaires" ? (
        <div style={{ padding: "0 12px" }}>
          <div style={{ background: "#FFF7ED", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <p style={{ fontWeight: 900, fontSize: 13, margin: "0 0 4px" }}>💬 Commentaires sur tes vidéos</p>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Quand quelqu'un commente ta vidéo dans Reels, ça apparaît ici instantanément. Clique pour voir la vidéo et répondre.</p>
            {monWhatsapp && <p style={{ fontSize: 11, color: "#999", margin: "6px 0 0" }}>Ton WhatsApp : {monWhatsapp} • On ne te montre que TES vidéos.</p>}
          </div>

          {notifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, border: "1px dashed #ddd", borderRadius: 14 }}>
              <p style={{ fontSize: 36, margin: "0 0 8px" }}>💬</p>
              <p style={{ fontWeight: 900, fontSize: 14, margin: "0 0 4px" }}>Aucun commentaire pour l'instant</p>
              <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px" }}>Quand quelqu'un commente ta vidéo, ça va apparaître ici.<br />Publie une vidéo dans Compte pour recevoir des commentaires.</p>
              <button onClick={() => router.push("/reels")} style={{ background: "#FF6B35", color: "white", border: "none", padding: "10px 18px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>Voir mes Reels 🎬</button>
            </div>
          ) : (
            notifs.map((n: any) => (
              <div key={n.id} onClick={() => { void marquerLu(n.id); router.push("/reels"); }} style={{ background: n.lu ? "white" : "#FFF7ED", border: n.lu ? "1px solid #eee" : "1px solid #FFD166", borderRadius: 12, padding: 12, marginBottom: 10, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontWeight: 900, fontSize: 13, margin: "0 0 2px" }}>💬 Nouveau commentaire sur : {n.product_titre || "Ta vidéo"}</p>
                  {!n.lu && <span style={{ background: "#E11D48", color: "white", fontSize: 10, padding: "2px 7px", borderRadius: 99, fontWeight: 900, whiteSpace: "nowrap" }}>NOUVEAU</span>}
                </div>
                <p style={{ fontSize: 13, margin: "0 0 4px" }}><b>{n.auteur || "Client"} :</b> {n.texte}</p>
                <p style={{ fontSize: 11, color: "#999", margin: 0 }}>{new Date(n.created_at).toLocaleString()} • Clique pour voir la vidéo →</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ padding: "0 12px" }}>
          <div style={{ background: "#F0FDF4", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <p style={{ fontWeight: 900, fontSize: 13, margin: "0 0 4px" }}>📱 Tes conversations WhatsApp</p>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Tes clients te parlent sur WhatsApp. Clique sur un client pour continuer sur WhatsApp.</p>
          </div>
          {conversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, border: "1px dashed #ddd", borderRadius: 14 }}>
              <p style={{ fontSize: 36, margin: "0 0 8px" }}>💬</p>
              <p style={{ fontWeight: 900, fontSize: 14, margin: "0 0 4px" }}>0 conversation avec tes clients</p>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Aucune conversation pour le moment.<br />Quand un client clique sur WhatsApp sur ton produit, il apparaîtra ici.</p>
            </div>
          ) : (
            conversations.map((c: any, i: number) => (
              <div key={i} onClick={() => ouvrirWhatsappVendeur(c.whatsapp, `Bonjour, on continue pour ${c.titre || "ton produit"} ?`)} style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 10, cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#22C55E", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>{(c.nom || "C")[0]}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 900, fontSize: 13, margin: "0 0 2px" }}>{c.nom || "Client"} • {c.whatsapp}</p>
                  <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{c.titre || "Produit"} • {c.prix ? Number(c.prix).toLocaleString() + " F" : ""}</p>
                </div>
                <span style={{ fontSize: 18 }}>↗️</span>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ background: "white", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-around", padding: "8px 0 10px", position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto", zIndex: 30 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🏠<br />Accueil</button>
        <button style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#FF6B35" }}>💬<br />Messagerie {nbNonLus > 0 ? `(${nbNonLus})` : ""}</button>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🛒<br />Panier</button>
        <button onClick={() => router.push("/reels")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🎬<br />Reels</button>
        <button onClick={() => router.push("/compte")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>👤<br />Compte</button>
      </div>
    </div>
    </div>
  );
}