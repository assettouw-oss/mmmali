"use client";
import { useEffect, useState, useRef } from "react";
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
function getUserKey() {
  if (typeof window === "undefined") return "anon";
  let k = localStorage.getItem("mm_user_key");
  if (!k) { k = "u_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("mm_user_key", k); }
  return k;
}
function lireCache(cle: string) {
  try {
    const c = localStorage.getItem(cle);
    if (!c) return [];
    const { data } = JSON.parse(c);
    return data || [];
  } catch { return []; }
}
function sauverCache(cle: string, data: any) {
  try { localStorage.setItem(cle, JSON.stringify({ data, time: Date.now() })); } catch {}
}

export default function Reels() {
  const router = useRouter();
  // 🚀 RAPIDE : On montre le cache tout de suite, 0 seconde
  const [reels, setReels] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    return lireCache("mm_cache_reels");
  });
  const [index, setIndex] = useState(0);
  const [sonActif, setSonActif] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("mm_son") === "1";
    return false;
  });
  const [likes, setLikes] = useState<string[]>([]);
  const [nbLikes, setNbLikes] = useState<Record<string, number>>({});
  const [commentairesOuvert, setCommentairesOuvert] = useState<string | null>(null);
  const [commentaires, setCommentaires] = useState<any[]>([]);
  const [nbCommentaires, setNbCommentaires] = useState<Record<string, number>>({});
  const [texteCommentaire, setTexteCommentaire] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [chargementCommentaires, setChargementCommentaires] = useState(false);
  const [reponseA, setReponseA] = useState<any | null>(null);
  const [commentairesAimes, setCommentairesAimes] = useState<string[]>([]);
  const [monUserKey, setMonUserKey] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<any>({});

  function activerSon() {
    setSonActif(true);
    try { localStorage.setItem("mm_son", "1"); } catch {}
    const v = videoRefs.current[index];
    if (v) { v.muted = false; v.volume = 1; v.play().catch(()=>{}); }
  }
  function couperSon() {
    setSonActif(false);
    try { localStorage.setItem("mm_son", "0"); } catch {}
    const v = videoRefs.current[index];
    if (v) { v.muted = true; }
  }

  // ❤️ LIKE - Dans Supabase, reste tant que la vidéo existe
  async function toggleLike(id: string) {
    const userKey = getUserKey();
    const dejaAime = likes.includes(id);
    const nbActuel = nbLikes[String(id)] || 0;
    setLikes((l) => dejaAime ? l.filter((x) => x !== id) : [...l, id]);
    setNbLikes((prev) => ({ ...prev, [String(id)]: dejaAime ? Math.max(0, nbActuel - 1) : nbActuel + 1 }));
    if (dejaAime) {
      await supabase.from("likes_reels").delete().eq("product_id", String(id)).eq("user_key", userKey);
    } else {
      const { error } = await supabase.from("likes_reels").insert({ product_id: String(id), user_key: userKey });
      if (error) {
        setLikes((l) => [...l, id]);
        setNbLikes((prev) => ({ ...prev, [String(id)]: nbActuel }));
      }
    }
  }

  async function ouvrirCommentaires(productId: string) {
    setCommentairesOuvert(productId);
    setCommentaires([]);
    setReponseA(null);
    setChargementCommentaires(true);
    setTexteCommentaire("");
    const { data } = await supabase.from("commentaires").select("*").eq("product_id", String(productId)).order("created_at", { ascending: true });
    if (data) {
      setCommentaires(data);
      setNbCommentaires((prev) => ({ ...prev, [productId]: data.length }));
      const ids = data.map((c: any) => c.id);
      if (ids.length > 0) {
        const { data: mesLikes } = await supabase.from("commentaire_likes").select("commentaire_id").eq("user_key", getUserKey()).in("commentaire_id", ids);
        if (mesLikes) setCommentairesAimes(mesLikes.map((l: any) => l.commentaire_id));
      }
    }
    setChargementCommentaires(false);
  }

  async function envoyerCommentaire() {
    if (!texteCommentaire.trim() || !commentairesOuvert || envoiEnCours) return;
    setEnvoiEnCours(true);
    const texte = texteCommentaire.trim();
    setTexteCommentaire("");
    const reponseCible = reponseA;
    setReponseA(null);
    const produitActuel = reels.find((r) => String(r.id) === String(commentairesOuvert));
    const { data, error } = await supabase.from("commentaires")
      .insert({ product_id: String(commentairesOuvert), auteur: "Client MM Mali", texte, parent_id: reponseCible ? reponseCible.id : null, user_key: getUserKey() })
      .select().single();
    if (error) {
      alert("Erreur : " + error.message);
      setTexteCommentaire(texte);
      setReponseA(reponseCible);
    } else if (data) {
      setCommentaires((prev) => [...prev, data]);
      setNbCommentaires((prev) => ({ ...prev, [commentairesOuvert]: (prev[commentairesOuvert] || 0) + 1 }));
      // 🔔 Notif pour le propriétaire
      if (!reponseCible && produitActuel) {
        await supabase.from("notifications_commentaires").insert({
          product_id: String(commentairesOuvert),
          product_titre: produitActuel.titre || "Ta vidéo",
          vendeur_whatsapp: String(produitActuel.whatsapp || ""),
          auteur: "Client MM Mali",
          texte: texte,
        }).then(()=>{});
      }
    }
    setEnvoiEnCours(false);
  }

  async function supprimerCommentaire(c: any) {
    if (c.user_key !== monUserKey) { alert("Tu ne peux supprimer que tes propres commentaires."); return; }
    const ok = confirm("Supprimer ton commentaire ?\n\n\"" + c.texte + "\"");
    if (!ok) return;
    const { error } = await supabase.from("commentaires").delete().eq("id", c.id).eq("user_key", monUserKey);
    if (error) { alert("Erreur : " + error.message); return; }
    setCommentaires((prev) => prev.filter((x) => x.id !== c.id && x.parent_id !== c.id));
    const nbASupprimer = 1 + commentaires.filter((x) => x.parent_id === c.id).length;
    if (commentairesOuvert) setNbCommentaires((prev) => ({ ...prev, [commentairesOuvert]: Math.max(0, (prev[commentairesOuvert] || 0) - nbASupprimer) }));
  }

  async function toggleLikeCommentaire(c: any) {
    const dejaAime = commentairesAimes.includes(c.id);
    const userKey = getUserKey();
    setCommentairesAimes((prev) => dejaAime ? prev.filter((x) => x !== c.id) : [...prev, c.id]);
    setCommentaires((prev) => prev.map((x) => x.id === c.id ? { ...x, likes: (x.likes || 0) + (dejaAime ? -1 : 1) } : x));
    if (dejaAime) {
      await supabase.from("commentaire_likes").delete().eq("commentaire_id", c.id).eq("user_key", userKey);
      await supabase.from("commentaires").update({ likes: Math.max(0, (c.likes || 0) - 1) }).eq("id", c.id);
    } else {
      const { error } = await supabase.from("commentaire_likes").insert({ commentaire_id: c.id, user_key: userKey });
      if (!error) await supabase.from("commentaires").update({ likes: (c.likes || 0) + 1 }).eq("id", c.id);
      else {
        setCommentairesAimes((prev) => prev.filter((x) => x !== c.id));
        setCommentaires((prev) => prev.map((x) => x.id === c.id ? { ...x, likes: c.likes || 0 } : x));
      }
    }
  }

  // 🚀 LOAD RAPIDE : On ne bloque jamais, on met à jour en fond
  async function load() {
    let tous: any[] = [];
    const { data: p1 } = await supabase.from("products")
      .select("id,nom,description,prix,categorie,vendeur_nom,ville,contact_whatsapp,statut,created_at,video_chemin, product_images(chemin,position)")
      .eq("statut", "publie").order("created_at", { ascending: false }).limit(8);
    if (p1) {
      tous.push(...p1.map((p: any) => {
        const img = (p.product_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0];
        const image_url = img?.chemin ? supabase.storage.from("produits").getPublicUrl(img.chemin).data.publicUrl : null;
        const video_url = p.video_chemin ? supabase.storage.from("produits").getPublicUrl(p.video_chemin).data.publicUrl : null;
        return { id: p.id, titre: p.nom, description: p.description, prix: p.prix, categorie: p.categorie, vendeur_nom: p.vendeur_nom, ville: p.ville || "Bamako", whatsapp: p.contact_whatsapp, image_url, video_url, created_at: p.created_at };
      }));
    }
    const { data: p2 } = await supabase.from("produits").select("id,titre,prix,description,categorie,whatsapp,image_url,video_url,created_at").order("created_at", { ascending: false }).limit(8);
    if (p2) tous.push(...p2.map((p: any) => ({ ...p, vendeur_nom: "Vendeur MM Mali", ville: "Bamako" })));
    tous.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (tous.length > 0) {
      setReels(tous);
      sauverCache("mm_cache_reels", tous);
      // Likes réels
      const ids = tous.map((r: any) => String(r.id));
      const { data: tousLikes } = await supabase.from("likes_reels").select("product_id, user_key").in("product_id", ids);
      if (tousLikes) {
        const compte: Record<string, number> = {};
        const mesLikes: string[] = [];
        const maCle = getUserKey();
        tousLikes.forEach((l: any) => {
          compte[l.product_id] = (compte[l.product_id] || 0) + 1;
          if (l.user_key === maCle) mesLikes.push(l.product_id);
        });
        setNbLikes(compte);
        setLikes(mesLikes);
      }
      // Nombre de commentaires par produit
      const { data: tousComms } = await supabase.from("commentaires").select("product_id").in("product_id", ids);
      if (tousComms) {
        const cCompte: Record<string, number> = {};
        tousComms.forEach((c: any) => { cCompte[c.product_id] = (cCompte[c.product_id] || 0) + 1; });
        setNbCommentaires(cCompte);
      }
    }
  }

  useEffect(() => { void load(); setMonUserKey(getUserKey()); }, []);
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((k) => {
      const v = videoRefs.current[k];
      if (!v) return;
      if (Number(k) === index) { v.muted = !sonActif; if (sonActif) v.volume = 1; v.play().catch(()=>{}); }
      else { v.pause(); }
    });
  }, [index, sonActif]);

  // 🚀 Pré-chargement vidéo suivante, comme TikTok
  useEffect(() => {
    const suivant = reels[index + 1];
    if (suivant?.video_url) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = suivant.video_url;
    }
    if (suivant?.image_url) {
      const img = new Image();
      img.src = suivant.image_url;
    }
  }, [index, reels]);

  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== index) setIndex(i);
  }

  // 🚀 Squelette TikTok, pas d'écran blanc
  if (reels.length === 0) return (
    <div style={{ background: "black", height: "100dvh", maxWidth: 430, margin: "0 auto", padding: 16 }}>
      <div style={{ height: "68%", background: "#222", borderRadius: 16 }} />
      <div style={{ height: 18, background: "#222", borderRadius: 99, marginTop: 16, width: "70%" }} />
      <div style={{ height: 18, background: "#222", borderRadius: 99, marginTop: 8, width: "40%" }} />
      <p style={{ color: "#888", textAlign: "center", marginTop: 20, fontSize: 13 }}>Chargement des Reels...</p>
      <div style={{ background: "white", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-around", padding: "8px 0 10px", position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🏠<br />Accueil</button>
        <button onClick={() => router.push("/messagerie")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>💬<br />Messagerie</button>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🛒<br />Panier</button>
        <button style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#FF6B35" }}>🎬<br />Reels</button>
        <button onClick={() => router.push("/compte")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>👤<br />Compte</button>
      </div>
    </div>
  );

  const commentairesPrincipaux = commentaires.filter((c) => !c.parent_id);
  const reponsesParParent: Record<string, any[]> = {};
  commentaires.filter((c) => c.parent_id).forEach((r) => { if (!reponsesParParent[r.parent_id]) reponsesParParent[r.parent_id] = []; reponsesParParent[r.parent_id].push(r); });

  return (
    <div style={{ background: "#F2F2F2", minHeight: "100dvh", display: "flex", justifyContent: "center" }}>
    <div style={{ width: "100%", maxWidth: 430, background: "white", position: "relative", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px 8px", background: "white" }}>
        <p style={{ fontWeight: 900, fontSize: 17, margin: 0 }}>MM <span style={{ color: "#FF6B35" }}>Mali</span></p>
        <p style={{ fontSize: 12, color: "#666", margin: 0, fontWeight: 700 }}>{index + 1} / {reels.length} • 👆 Glisse</p>
      </div>
      <div ref={containerRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", scrollSnapType: "y mandatory", scrollbarWidth: "none" } as any}>
        {reels.map((p, i) => (
          <div key={p.id} style={{ height: "100%", scrollSnapAlign: "start", position: "relative", background: "black", overflow: "hidden", flexShrink: 0 }}>
            {p.video_url ? (
              <video ref={(el) => { if (el) videoRefs.current[i] = el; }} src={p.video_url} loop playsInline muted={!sonActif} autoPlay={i === 0} poster={p.image_url || ""} onClick={() => sonActif ? couperSon() : activerSon()} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <img src={p.image_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            )}
            <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "white", fontSize: 11, fontWeight: 900, padding: "5px 10px", borderRadius: 999, zIndex: 20 }}>
              {p.video_url ? "▶️ Vidéo" : "🖼️ Photo"}
            </span>
            {p.video_url && (
              <button onClick={() => sonActif ? couperSon() : activerSon()} style={{ position: "absolute", top: 10, right: 10, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)", color: "white", fontSize: 16, zIndex: 20 }}>
                {sonActif ? "🔊" : "🔇"}
              </button>
            )}
            {p.video_url && i === index && !sonActif && (
              <div onClick={() => activerSon()} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.65)", color: "white", fontSize: 12, fontWeight: 900, padding: "10px 16px", borderRadius: 999, whiteSpace: "nowrap", zIndex: 20 }}>
                👆 Clique sur la vidéo pour le son
              </div>
            )}

            {/* ✅ BOUTONS À DROITE - Toujours visibles */}
            <div style={{ position: "absolute", right: 12, bottom: 150, display: "flex", flexDirection: "column", gap: 6, alignItems: "center", zIndex: 30 }}>
              <button onClick={() => toggleLike(p.id)} style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid white", background: "rgba(0,0,0,0.6)", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {likes.includes(p.id) ? "❤️" : "🤍"}
              </button>
              <span style={{ color: "white", fontSize: 12, fontWeight: 900, marginTop: -4, textShadow: "0 1px 3px black" }}>{nbLikes[String(p.id)] || 0}</span>
              <button onClick={() => ouvrirCommentaires(String(p.id))} style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid white", background: "rgba(0,0,0,0.6)", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>💬</button>
              <span style={{ color: "white", fontSize: 12, fontWeight: 900, marginTop: -4, textShadow: "0 1px 3px black" }}>{nbCommentaires[String(p.id)] || 0}</span>
              <button onClick={() => { const msg = `Bonjour, je veux commander : ${p.titre}`; ouvrirWhatsapp(p.whatsapp, msg); }} style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid white", background: "rgba(0,0,0,0.6)", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>↗️</button>
            </div>

            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "40px 12px 12px", background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.3) 50%, transparent)", zIndex: 10 }}>
              <p style={{ color: "white", fontWeight: 900, fontSize: 15, margin: "0 0 2px", lineHeight: 1.2 }}>{p.titre}</p>
              <p style={{ color: "#FFD166", fontWeight: 900, fontSize: 13, margin: "0 0 2px" }}>{Number(p.prix).toLocaleString()} F • {p.categorie || "Neuf"}</p>
              <p style={{ color: "white", fontSize: 12, margin: "0 0 8px", opacity: 0.9 }}>📱 {p.whatsapp} • 📍 {p.ville || "Bamako"}</p>
              <button onClick={() => { const msg = `Bonjour, je veux commander sur MM Mali : ${p.titre} - ${Number(p.prix).toLocaleString()} F`; ouvrirWhatsapp(p.whatsapp, msg); }} style={{ width: "100%", background: "#22C55E", color: "white", border: "none", padding: "12px 0", borderRadius: 999, fontWeight: 900, fontSize: 13 }}>
                💬 Commander sur WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>

      {commentairesOuvert && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }} onClick={() => { setCommentairesOuvert(null); setReponseA(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "white", borderRadius: "20px 20px 0 0", maxHeight: "75%", display: "flex", flexDirection: "column", padding: "12px 14px 14px" }}>
            <div style={{ width: 40, height: 5, background: "#ddd", borderRadius: 99, margin: "0 auto 10px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontWeight: 900, fontSize: 15, margin: 0 }}>💬 Commentaires • {commentaires.length}</p>
              <button onClick={() => { setCommentairesOuvert(null); setReponseA(null); }} style={{ background: "#eee", border: "none", width: 30, height: 30, borderRadius: "50%", fontSize: 14 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 0", display: "flex", flexDirection: "column", gap: 14, minHeight: 150 }}>
              {chargementCommentaires && <p style={{ textAlign: "center", color: "#888", fontSize: 13 }}>Chargement...</p>}
              {!chargementCommentaires && commentaires.length === 0 && <p style={{ textAlign: "center", color: "#888", fontSize: 13, padding: 20 }}>Aucun commentaire.<br />Sois le premier 👇</p>}
              {commentairesPrincipaux.map((c: any) => (
                <div key={c.id}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FF6B35", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>{(c.auteur || "C")[0]}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 900, fontSize: 12, margin: "0 0 2px" }}>{c.auteur} {c.user_key === monUserKey && c.user_key && <span style={{ background: "#FF6B35", color: "white", fontSize: 10, padding: "1px 6px", borderRadius: 99 }}>Moi</span>} <span style={{ color: "#999", fontWeight: 400 }}>{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></p>
                      <p style={{ fontSize: 13, margin: "0 0 4px" }}>{c.texte}</p>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <button onClick={() => toggleLikeCommentaire(c)} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 900, color: commentairesAimes.includes(c.id) ? "#E11D48" : "#888", padding: 0 }}>{commentairesAimes.includes(c.id) ? "❤️" : "🤍"} {c.likes || 0}</button>
                        <button onClick={() => setReponseA(c)} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 900, color: "#555", padding: 0 }}>↩️ Répondre</button>
                        {c.user_key === monUserKey && c.user_key && <button onClick={() => supprimerCommentaire(c)} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 900, color: "#E11D48", padding: 0 }}>🗑️ Supprimer</button>}
                      </div>
                    </div>
                  </div>
                  {(reponsesParParent[c.id] || []).map((r: any) => (
                    <div key={r.id} style={{ display: "flex", gap: 8, marginLeft: 42, marginTop: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#22C55E", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, flexShrink: 0 }}>{(r.auteur || "C")[0]}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 900, fontSize: 12, margin: "0 0 2px" }}>{r.auteur} {r.user_key === monUserKey && r.user_key && <span style={{ background: "#22C55E", color: "white", fontSize: 10, padding: "1px 6px", borderRadius: 99 }}>Moi</span>} <span style={{ color: "#999", fontWeight: 400 }}>{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></p>
                        <p style={{ fontSize: 13, margin: "0 0 4px" }}>{r.texte}</p>
                        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                          <button onClick={() => toggleLikeCommentaire(r)} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 900, color: commentairesAimes.includes(r.id) ? "#E11D48" : "#888", padding: 0 }}>{commentairesAimes.includes(r.id) ? "❤️" : "🤍"} {r.likes || 0}</button>
                          {r.user_key === monUserKey && r.user_key && <button onClick={() => supprimerCommentaire(r)} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 900, color: "#E11D48", padding: 0 }}>🗑️ Supprimer</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {reponseA && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFF7ED", padding: "8px 10px", borderRadius: 10, marginBottom: 8 }}>
                <p style={{ fontSize: 12, margin: 0 }}>↩️ Réponse à <b>{reponseA.auteur}</b></p>
                <button onClick={() => setReponseA(null)} style={{ background: "none", border: "none", fontSize: 14 }}>✕</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, borderTop: "1px solid #eee", paddingTop: 10 }}>
              <input value={texteCommentaire} onChange={(e) => setTexteCommentaire(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") envoyerCommentaire(); }} placeholder={reponseA ? `Répondre à ${reponseA.auteur}...` : "Écris ton commentaire..."} style={{ flex: 1, border: "1px solid #eee", borderRadius: 999, padding: "12px 14px", fontSize: 13, outline: "none" }} />
              <button onClick={envoyerCommentaire} disabled={envoiEnCours} style={{ background: envoiEnCours ? "#ccc" : "#FF6B35", color: "white", border: "none", padding: "10px 16px", borderRadius: 999, fontWeight: 900, fontSize: 13 }}>{envoiEnCours ? "..." : reponseA ? "Répondre" : "Envoyer"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: "white", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-around", padding: "8px 0 10px" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🏠<br />Accueil</button>
        <button onClick={() => router.push("/messagerie")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>💬<br />Messagerie</button>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🛒<br />Panier</button>
        <button style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#FF6B35" }}>🎬<br />Reels</button>
        <button onClick={() => router.push("/compte")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>👤<br />Compte</button>
      </div>
    </div>
    </div>
  );
}