"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function lireCache(cle: string) {
  try {
    const c = localStorage.getItem(cle);
    if (!c) return null;
    return JSON.parse(c).data;
  } catch { return null; }
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

export default function Compte() {
  const router = useRouter();
  const [user, setUser] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    return lireCache("mm_cache_compte_user");
  });
  const [mesProduits, setMesProduits] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    return lireCache("mm_cache_compte_produits") || [];
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [message, setMessage] = useState("");
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);
  const [titreProduit, setTitreProduit] = useState("");
  const [prixProduit, setPrixProduit] = useState("");
  const [categorieProduit, setCategorieProduit] = useState("Électronique");
  const [descProduit, setDescProduit] = useState("");
  const [publieEnCours, setPublieEnCours] = useState(false);
  const [showPublier, setShowPublier] = useState(false);
  const [photoProduit, setPhotoProduit] = useState<File | null>(null);
  const [videoProduit, setVideoProduit] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState(false);
    const [popup, setPopup] = useState<"portefeuille" | "guide" | "favoris" | "commandes" | "assistance" | null>(null);
  // 📱 NUMÉRO DU PROPRIÉTAIRE MM MALI - CHANGE ICI SI CE N'EST PAS LE BON
  const WHATSAPP_PROPRIETAIRE = "22398196047";

  async function chargerMesProduits(userWhatsapp: string) {
  const propre = nettoyerWhatsapp(userWhatsapp);
  if (!propre) { setMesProduits([]); return; }

  const { data: p2 } = await supabase.from("produits").select("*").order("created_at", { ascending: false }).limit(50);
  if (!p2) return;

  // CORRECTION : On ne montre QUE mes produits. JAMAIS ceux des autres.
  // On a supprimé le code qui disait "si pas trouvé, montre tout"
  const mes = p2.filter((p: any) => nettoyerWhatsapp(p.whatsapp) === propre);
  setMesProduits(mes);
}

  function sauvegarderWhatsapp() {
    if (!whatsapp.trim()) { alert("Mets ton numéro WhatsApp."); return; }
    const propre = whatsapp.trim();
    const nouveauUser = { ...user, whatsapp: propre };
    setUser(nouveauUser);
    localStorage.setItem("mm_user", JSON.stringify(nouveauUser));
    localStorage.setItem("mm_vendeur_whatsapp", propre);
    localStorage.setItem("mm_whatsapp", propre);
    sauverCache("mm_cache_compte_user", nouveauUser);
    setEditWhatsapp(false);
    alert("WhatsApp sauvegardé ✅ : " + propre);
    void chargerMesProduits(propre);
  }

  // ⭐ BOUTON PRO : OUVRE WHATSAPP DIRECT AVEC LE PROPRIÉTAIRE
  function ouvrirWhatsAppPro() {
    const msg = "Bonjour MM Mali, je veux devenir PRO - 2.000 F / mois.\n\nMon nom : " + (user?.nom || "Adama") + "\nMon WhatsApp : " + (user?.whatsapp || whatsapp || "") + "\n\nExplique-moi comment activer mon PRO s'il te plait.";
    window.open("https://wa.me/" + WHATSAPP_PROPRIETAIRE + "?text=" + encodeURIComponent(msg), "_blank");
  }

  useEffect(() => {
    try {
      const sauve = localStorage.getItem("mm_user");
      if (sauve) {
        const u = JSON.parse(sauve);
        setUser(u);
        sauverCache("mm_cache_compte_user", u);
        if (u.whatsapp) { setWhatsapp(u.whatsapp); void chargerMesProduits(u.whatsapp); }
        if (u.nom) setNom(u.nom);
        if (u.email) setEmail(u.email);
        if (!u.whatsapp) void chargerMesProduits("");
      }
      const w = localStorage.getItem("mm_vendeur_whatsapp") || localStorage.getItem("mm_whatsapp") || "";
      if (w && !sauve) { setWhatsapp(w); void chargerMesProduits(w); }
    } catch {}
  }, []);

  async function handleAuth() {
    if (!email.trim() || !password.trim()) { setMessage("Mets ton e-mail + mot de passe."); return; }
    if (mode === "inscription" && (!nom.trim() || !whatsapp.trim())) { setMessage("Pour t'inscrire, mets ton nom + WhatsApp."); return; }
    setMessage("Connexion...");
    try {
      if (mode === "connexion") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) { setMessage("Erreur : " + error.message); return; }
        const u = { email: email.trim(), nom: nom || data.user?.user_metadata?.nom || "Adama", whatsapp: whatsapp || data.user?.user_metadata?.whatsapp || "", id: data.user?.id };
        localStorage.setItem("mm_user", JSON.stringify(u));
        localStorage.setItem("mm_vendeur_whatsapp", u.whatsapp);
        setUser(u);
        sauverCache("mm_cache_compte_user", u);
        setMessage("Bienvenue ✅");
        if (u.whatsapp) void chargerMesProduits(u.whatsapp);
        else void chargerMesProduits("");
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { nom: nom.trim(), whatsapp: whatsapp.trim() } } });
        if (error) { setMessage("Erreur : " + error.message); return; }
        const u = { email: email.trim(), nom: nom.trim(), whatsapp: whatsapp.trim(), id: data.user?.id };
        localStorage.setItem("mm_user", JSON.stringify(u));
        localStorage.setItem("mm_vendeur_whatsapp", u.whatsapp);
        setUser(u);
        sauverCache("mm_cache_compte_user", u);
        setMessage("Compte créé ✅ Tu peux publier.");
      }
    } catch (e: any) { setMessage("Erreur : " + e.message); }
  }

  function deconnexion() {
    localStorage.removeItem("mm_user");
    localStorage.removeItem("mm_cache_compte_user");
    setUser(null);
    setMesProduits([]);
    setMessage("Déconnecté.");
  }

   async function supprimerProduit(id: string, produitWhatsapp: string) {
  if (nettoyerWhatsapp(produitWhatsapp) !== nettoyerWhatsapp(user?.whatsapp || "")) {
    alert("⛔ Ce n'est pas ton produit. Tu ne peux pas le supprimer.");
    return;
  }
  if (!confirm("Supprimer ce produit ?")) return;
  await supabase.from("produits").delete().eq("id", id);
  setMesProduits((prev) => prev.filter((p: any) => p.id !== id));
}
  async function publierProduit() {
    if (!titreProduit.trim() || !prixProduit.trim()) { alert("Mets le titre + prix."); return; }
    if (!whatsapp.trim()) { alert("Mets ton WhatsApp dans ton profil."); return; }
    setPublieEnCours(true);
    let image_url = null;
    let video_url = null;
    try {
      if (photoProduit) {
        const nomFichier = `photo_${Date.now()}_${photoProduit.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const { error: errPhoto } = await supabase.storage.from("produits").upload(nomFichier, photoProduit);
        if (errPhoto) alert("Erreur photo : " + errPhoto.message);
        else image_url = supabase.storage.from("produits").getPublicUrl(nomFichier).data.publicUrl;
      }
      if (videoProduit) {
        const nomFichierVideo = `video_${Date.now()}_${videoProduit.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const { error: errVideo } = await supabase.storage.from("produits").upload(nomFichierVideo, videoProduit);
        if (errVideo) alert("Erreur vidéo : " + errVideo.message);
        else video_url = supabase.storage.from("produits").getPublicUrl(nomFichierVideo).data.publicUrl;
      }
      const { data, error } = await supabase.from("produits").insert({
        titre: titreProduit.trim(),
        prix: Number(prixProduit),
        categorie: categorieProduit,
        description: descProduit.trim() || titreProduit.trim(),
        whatsapp: whatsapp.trim(),
        vendeur_nom: nom || user?.nom || "Vendeur MM Mali",
        ville: "Bamako",
        image_url: image_url,
        video_url: video_url,
      }).select().single();
      if (error) { alert("Erreur publication : " + error.message); }
      else {
        alert("Produit publié avec photo / vidéo ✅");
        const nouveau = { id: data.id, titre: data.titre, prix: data.prix, categorie: data.categorie, image_url: data.image_url, video_url: data.video_url, created_at: data.created_at };
        const maj = [nouveau, ...mesProduits];
        setMesProduits(maj);
        sauverCache("mm_cache_compte_produits", maj);
        setTitreProduit(""); setPrixProduit(""); setDescProduit("");
        setPhotoProduit(null); setVideoProduit(null);
        setPhotoPreview(""); setVideoPreview("");
        setShowPublier(false);
      }
    } catch (e: any) { alert("Erreur : " + e.message); }
    setPublieEnCours(false);
  }

  return (
    <div style={{ background: "#F2F2F2", minHeight: "100dvh", display: "flex", justifyContent: "center" }}>
    <div style={{ width: "100%", maxWidth: 430, background: "white", minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: 70 }}>
      <div style={{ padding: "14px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>MM <span style={{ color: "#FF6B35" }}>Mali</span> • Compte</p>
        {user && <button onClick={deconnexion} style={{ background: "none", border: "none", color: "#888", fontSize: 12, fontWeight: 700 }}>Déconnexion</button>}
      </div>

      {!user ? (
        <div style={{ padding: "0 14px" }}>
          <div style={{ background: "#FFF7ED", borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <p style={{ fontWeight: 900, fontSize: 15, margin: "0 0 4px" }}>👋 Bienvenue sur MM Mali</p>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Connecte-toi pour vendre à Bamako. C'est gratuit, 30 secondes.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => setMode("connexion")} style={{ flex: 1, background: mode === "connexion" ? "#111" : "#f2f2f2", color: mode === "connexion" ? "white" : "#333", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 13 }}>Connexion</button>
            <button onClick={() => setMode("inscription")} style={{ flex: 1, background: mode === "inscription" ? "#FF6B35" : "#f2f2f2", color: mode === "inscription" ? "white" : "#333", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 13 }}>Inscription</button>
          </div>
          {mode === "inscription" && (
            <>
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ton nom, ex: Adama" style={{ width: "100%", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ton WhatsApp, ex: 98 19 60 47" style={{ width: "100%", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
            </>
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ton e-mail" style={{ width: "100%", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" style={{ width: "100%", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
          <button onClick={handleAuth} style={{ width: "100%", background: "#FF6B35", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: 900, fontSize: 14 }}>{mode === "connexion" ? "Se connecter" : "Créer mon compte"}</button>
          {message && <p style={{ textAlign: "center", fontSize: 12, color: "#555", marginTop: 10 }}>{message}</p>}
        </div>
      ) : (
        <div style={{ padding: "0 14px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#FFF7ED", borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FF6B35", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, flexShrink: 0 }}>{(user.nom || "A")[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 900, fontSize: 16, margin: "0 0 2px" }}>{user.nom || "Adama"}</p>
              {!editWhatsapp ? (
                <>
                  <p style={{ fontSize: 12, color: "#666", margin: "0 0 2px" }}>📱 {user.whatsapp || whatsapp || "Pas de WhatsApp"} <button onClick={() => setEditWhatsapp(true)} style={{ background: "none", border: "none", color: "#FF6B35", fontSize: 11, fontWeight: 900 }}>✏️ Modifier</button></p>
                  <p style={{ fontSize: 12, color: "#666", margin: 0 }}>📧 {user.email}</p>
                </>
              ) : (
                <>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ton WhatsApp, ex: 98 19 60 47" style={{ width: "100%", border: "1px solid #FF6B35", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", marginBottom: 6, boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={sauvegarderWhatsapp} style={{ flex: 1, background: "#22C55E", color: "white", border: "none", padding: "9px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>✅ Sauvegarder</button>
                    <button onClick={() => setEditWhatsapp(false)} style={{ flex: 1, background: "#eee", color: "#333", border: "none", padding: "9px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>Annuler</button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ background: "#111", color: "white", borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 11, opacity: 0.7, margin: "0 0 2px" }}>TON SOLDE MM MALI</p>
            <p style={{ fontWeight: 900, fontSize: 22, margin: "0 0 4px" }}>500 F</p>
            <p style={{ fontSize: 11, opacity: 0.7, margin: "0 0 10px" }}>Tu as {mesProduits.length} produit(s) en ligne</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowPublier(!showPublier)} style={{ flex: 1, background: "#FF6B35", color: "white", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>+ Publier un produit</button>
              <button onClick={ouvrirWhatsAppPro} style={{ flex: 1, background: "white", color: "#111", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>⭐ Devenir PRO - 2.000 F</button>
            </div>
          </div>


                    {/* ===== PARTAGER MM MALI ===== */}
          <div style={{ background: "#111", borderRadius: 14, padding: 14, marginTop: 14 }}>
            <p style={{ color: "white", fontWeight: 900, fontSize: 15, margin: "0 0 4px" }}>📣 Fais grandir MM Mali !</p>
            <p style={{ color: "#ccc", fontSize: 12, margin: "0 0 12px" }}>Partage le lien, tes amis à Bamako vont vendre aussi.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => {
                const lien = "https://mmmali-imvxjpv2b-mmmali.vercel.app";
                const texte = "Regarde MM Mali 🇲🇱, tu peux vendre à Bamako gratuitement ! " + lien;
                window.open("https://wa.me/?text=" + encodeURIComponent(texte), "_blank");
              }} style={{ flex: 1, background: "#25D366", color: "white", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>WhatsApp</button>
              <button onClick={() => {
                const lien = "https://mmmali-imvxjpv2b-mmmali.vercel.app";
                window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(lien), "_blank");
              }} style={{ flex: 1, background: "#1877F2", color: "white", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>Facebook</button>
              <button onClick={() => {
                const lien = "https://mmmali-imvxjpv2b-mmmali.vercel.app";
                navigator.clipboard.writeText(lien);
                alert("Lien copié ✅ Colle-le sur TikTok / Instagram");
              }} style={{ flex: 1, background: "white", color: "#111", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>Copier lien</button>
            </div>
          </div>

                    {/* ===== MON ACTIVITÉ ===== */}
          <p style={{ fontWeight: 900, fontSize: 12, color: "#888", margin: "18px 0 8px" }}>MON ACTIVITÉ</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPopup("commandes")} style={{ flex: 1, background: "white", border: "1px solid #eee", borderRadius: 14, padding: "14px 6px", textAlign: "left" }}>
              <span style={{ fontSize: 22 }}>📦</span><br /><span style={{ fontWeight: 900, fontSize: 13, color: "#2563EB" }}>Mes Commandes</span>
            </button>
            <button onClick={() => setPopup("favoris")} style={{ flex: 1, background: "white", border: "1px solid #eee", borderRadius: 14, padding: "14px 6px", textAlign: "left" }}>
              <span style={{ fontSize: 22 }}>❤️</span><br /><span style={{ fontWeight: 900, fontSize: 13, color: "#2563EB" }}>Mes Favoris</span>
            </button>
            <button onClick={() => router.push("/reels")} style={{ flex: 1, background: "white", border: "1px solid #eee", borderRadius: 14, padding: "14px 6px", textAlign: "left" }}>
              <span style={{ fontSize: 22 }}>📸</span><br /><span style={{ fontWeight: 900, fontSize: 13, color: "#2563EB" }}>Mes Stories</span>
            </button>
          </div>

          <p style={{ fontWeight: 900, fontSize: 12, color: "#888", margin: "18px 0 8px" }}>MON PORTEFEUILLE ET MON PROFIL</p>
          <button onClick={() => setPopup("portefeuille")} style={{ width: "100%", background: "white", border: "1px solid #eee", borderRadius: 14, padding: "14px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: "#2563EB" }}>💼 Mon Portefeuille et Mon Profil</span><span style={{ color: "#2563EB" }}>›</span>
          </button>

          <p style={{ fontWeight: 900, fontSize: 12, color: "#888", margin: "18px 0 8px" }}>RÉFÉRENCE</p>
          <button onClick={() => setPopup("guide")} style={{ width: "100%", background: "white", border: "1px solid #eee", borderRadius: 14, padding: "14px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: "#2563EB" }}>📖 Référence - Guide en Bambara</span><span style={{ color: "#2563EB" }}>›</span>
          </button>

          <p style={{ fontWeight: 900, fontSize: 12, color: "#888", margin: "18px 0 8px" }}>ASSISTANCE ET LÉGAL</p>
          <button onClick={() => setPopup("assistance")} style={{ width: "100%", background: "white", border: "1px solid #eee", borderRadius: 14, padding: "14px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: "#2563EB" }}>🛟 Assistance et Légal</span><span style={{ color: "#2563EB" }}>›</span>
          </button>

          {/* ===== LES VRAIES FENÊTRES - PLUS DE ALERT() ===== */}
          {popup && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }} onClick={() => setPopup(null)}>
              <div style={{ background: "white", width: "100%", maxWidth: 430, borderRadius: "18px 18px 0 0", padding: 20, maxHeight: "80dvh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p style={{ fontWeight: 900, fontSize: 17, margin: 0 }}>
                    {popup === "portefeuille" && "💼 Mon Portefeuille"}
                    {popup === "guide" && "📖 Guide en Bambara"}
                    {popup === "favoris" && "❤️ Mes Favoris"}
                    {popup === "commandes" && "📦 Mes Commandes"}
                    {popup === "assistance" && "🛟 Assistance et Légal"}
                  </p>
                  <button onClick={() => setPopup(null)} style={{ background: "#f2f2f2", border: "none", borderRadius: "50%", width: 30, height: 30, fontWeight: 900 }}>✕</button>
                </div>

                {popup === "portefeuille" && (
                  <>
                    <div style={{ background: "#111", color: "white", borderRadius: 14, padding: 16, marginBottom: 12 }}>
                      <p style={{ fontSize: 11, opacity: 0.7, margin: "0 0 2px" }}>TON SOLDE</p>
                      <p style={{ fontWeight: 900, fontSize: 26, margin: "0 0 4px" }}>500 F</p>
                      <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>Tu as {mesProduits.length} produit(s) en ligne</p>
                    </div>
                    <p style={{ fontSize: 13, margin: "0 0 4px" }}><b>Nom :</b> {user?.nom}</p>
                    <p style={{ fontSize: 13, margin: "0 0 4px" }}><b>WhatsApp :</b> {user?.whatsapp || whatsapp || "Pas de WhatsApp"}</p>
                    <p style={{ fontSize: 13, margin: "0 0 12px" }}><b>E-mail :</b> {user?.email}</p>
                    <button onClick={ouvrirWhatsAppPro} style={{ width: "100%", background: "#FF6B35", color: "white", border: "none", padding: "12px 0", borderRadius: 999, fontWeight: 900, fontSize: 13 }}>⭐ Devenir PRO - 2.000 F</button>
                  </>
                )}

                {popup === "guide" && (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 8px" }}>I ni ce ! Bienvenue sur MM Mali 🇲🇱</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px" }}>1. <b>I ka produit publier :</b> Clique sur + Publier un produit, mets photo, prix, WhatsApp.</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px" }}>2. <b>Client bé i wele :</b> Il te parle sur WhatsApp, tu discutes, tu vends.</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px" }}>3. <b>I ka PRO kè :</b> Si tu veux plus de clients, clique Devenir PRO - 2.000 F, tu parles au propriétaire sur WhatsApp.</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>4. <b>Kana i ka WhatsApp changè :</b> Mets toujours ton vrai numéro, sinon client té i sɔrɔ.</p>
                  </>
                )}

                {popup === "favoris" && (
                  <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Tu n'as pas encore de favoris. ❤️<br />Va sur Accueil, clique sur le ❤️ d'un produit pour le garder ici.</p>
                )}

                {popup === "commandes" && (
                  <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Tu n'as pas encore de commandes.<br />Quand un client te parle sur WhatsApp et achète, tu le verras ici.<br /><br />Va sur <b>Messagerie</b> pour voir tes discussions.</p>
                )}

                {popup === "assistance" && (
                  <>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>Un problème ? Tu parles direct au propriétaire de MM Mali sur WhatsApp. Il t'aide vite.</p>
                    <p style={{ fontSize: 13, margin: "0 0 12px" }}><b>📱 Propriétaire :</b> 98 19 60 47<br /><b>📍 Ville :</b> Bamako, Mali</p>
                    <button onClick={ouvrirWhatsAppPro} style={{ width: "100%", background: "#25D366", color: "white", border: "none", padding: "12px 0", borderRadius: 999, fontWeight: 900, fontSize: 13, marginBottom: 10 }}>💬 Parler au propriétaire sur WhatsApp</button>
                    <p style={{ fontSize: 11, color: "#888", lineHeight: 1.5, margin: 0 }}>En utilisant MM Mali, tu acceptes que les vendeurs et les clients se parlent sur WhatsApp. MM Mali ne gère pas les paiements entre vous. Faites attention, ne donnez jamais votre code.</p>
                  </>
                )}

                <button onClick={() => setPopup(null)} style={{ width: "100%", background: "#f2f2f2", border: "none", padding: "11px 0", borderRadius: 999, fontWeight: 900, fontSize: 13, marginTop: 16 }}>Fermer</button>
              </div>
            </div>
          )}
          <p style={{ fontWeight: 900, fontSize: 12, color: "#888", margin: "18px 0 8px", letterSpacing: 0.5 }}>MON ACTIVITÉ</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.push("/messagerie")} style={{ flex: 1, background: "white", border: "1px solid #eee", borderRadius: 14, padding: "14px 6px", textAlign: "left" }}>
              <span style={{ fontSize: 22 }}>📦</span><br /><span style={{ fontWeight: 900, fontSize: 13, color: "#2563EB" }}>Mes Commandes</span>
            </button>
            <button onClick={() => alert("Tes Favoris arrivent bientôt ❤️")} style={{ flex: 1, background: "white", border: "1px solid #eee", borderRadius: 14, padding: "14px 6px", textAlign: "left" }}>
              <span style={{ fontSize: 22 }}>❤️</span><br /><span style={{ fontWeight: 900, fontSize: 13, color: "#2563EB" }}>Mes Favoris</span>
            </button>
            <button onClick={() => router.push("/reels")} style={{ flex: 1, background: "white", border: "1px solid #eee", borderRadius: 14, padding: "14px 6px", textAlign: "left" }}>
              <span style={{ fontSize: 22 }}>📸</span><br /><span style={{ fontWeight: 900, fontSize: 13, color: "#2563EB" }}>Mes Stories</span>
            </button>
          </div>

          
          {showPublier && (
            <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, marginBottom: 12 }}>
              <p style={{ fontWeight: 900, fontSize: 14, margin: "0 0 8px" }}>📦 Publier un produit</p>
              <input value={titreProduit} onChange={(e) => setTitreProduit(e.target.value)} placeholder="Titre, ex: iPhone 12 Pro" style={{ width: "100%", border: "1px solid #eee", borderRadius: 10, padding: "11px 12px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
              <input value={prixProduit} onChange={(e) => setPrixProduit(e.target.value)} placeholder="Prix en F, ex: 135000" type="number" style={{ width: "100%", border: "1px solid #eee", borderRadius: 10, padding: "11px 12px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
              <select value={categorieProduit} onChange={(e) => setCategorieProduit(e.target.value)} style={{ width: "100%", border: "1px solid #eee", borderRadius: 10, padding: "11px 12px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }}>
                <option>Électronique</option><option>Mode</option><option>Restaurant</option><option>Sport</option><option>Maison</option><option>Beauté</option><option>Autre</option>
              </select>
              <textarea value={descProduit} onChange={(e) => setDescProduit(e.target.value)} placeholder="Description..." style={{ width: "100%", border: "1px solid #eee", borderRadius: 10, padding: "11px 12px", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box", minHeight: 60 }} />
              <p style={{ fontWeight: 900, fontSize: 13, margin: "10px 0 6px" }}>📸 Photo du produit</p>
              <label style={{ display: "block", border: "2px dashed #ddd", borderRadius: 12, padding: 14, textAlign: "center", cursor: "pointer", background: "#FAFAFA" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhotoProduit(f); setPhotoPreview(URL.createObjectURL(f)); } }} />
                {photoPreview ? <img src={photoPreview} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 10 }} /> : <span style={{ fontSize: 13, color: "#666" }}>📸 Clique pour choisir une photo<br /><span style={{ fontSize: 11, color: "#999" }}>Depuis ta galerie</span></span>}
              </label>
              {photoPreview && <button onClick={() => { setPhotoProduit(null); setPhotoPreview(""); }} style={{ background: "none", border: "none", color: "#E11D48", fontSize: 12, fontWeight: 900, marginTop: 4 }}>✕ Retirer la photo</button>}
              <p style={{ fontWeight: 900, fontSize: 13, margin: "14px 0 6px" }}>🎥 Vidéo du produit (pour Reels)</p>
              <label style={{ display: "block", border: "2px dashed #ddd", borderRadius: 12, padding: 14, textAlign: "center", cursor: "pointer", background: "#FAFAFA" }}>
                <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 50 * 1024 * 1024) { alert("Vidéo trop lourde. Moins de 50 Mo."); return; } setVideoProduit(f); setVideoPreview(URL.createObjectURL(f)); } }} />
                {videoPreview ? <video src={videoPreview} controls style={{ width: "100%", maxHeight: 180, borderRadius: 10 }} /> : <span style={{ fontSize: 13, color: "#666" }}>🎥 Clique pour choisir une vidéo<br /><span style={{ fontSize: 11, color: "#999" }}>Moins de 50 Mo, pour Reels</span></span>}
              </label>
              {videoPreview && <button onClick={() => { setVideoProduit(null); setVideoPreview(""); }} style={{ background: "none", border: "none", color: "#E11D48", fontSize: 12, fontWeight: 900, marginTop: 4 }}>✕ Retirer la vidéo</button>}
              <button onClick={publierProduit} disabled={publieEnCours} style={{ width: "100%", background: publieEnCours ? "#ccc" : "#22C55E", color: "white", border: "none", padding: "12px 0", borderRadius: 999, fontWeight: 900, fontSize: 13, marginTop: 14 }}>{publieEnCours ? "Publication..." : "Publier maintenant"}</button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <p style={{ fontWeight: 900, fontSize: 14, margin: 0 }}>Mes produits • {mesProduits.length}</p>
            <button onClick={() => void chargerMesProduits(whatsapp || user.whatsapp || "")} style={{ background: "none", border: "none", color: "#FF6B35", fontSize: 12, fontWeight: 900 }}>↻ Actualiser</button>
          </div>
          {mesProduits.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, border: "1px dashed #ddd", borderRadius: 14 }}>
              <p style={{ fontSize: 30, margin: "0 0 6px" }}>📦</p>
              <p style={{ fontSize: 13, color: "#888", margin: "0 0 10px" }}>Tu n'as pas encore de produit.<br />Publie ton premier produit, c'est gratuit.</p>
              <button onClick={() => setShowPublier(true)} style={{ background: "#FF6B35", color: "white", border: "none", padding: "10px 18px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>+ Publier mon 1er produit</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mesProduits.map((p: any) => (
                <div key={p.id} style={{ display: "flex", gap: 10, border: "1px solid #eee", borderRadius: 12, padding: 10, alignItems: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: "#f2f2f2", overflow: "hidden", flexShrink: 0 }}>
                    {p.image_url ? <img src={p.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 900, fontSize: 13, margin: "0 0 2px" }}>{p.titre}</p>
                    <p style={{ fontWeight: 900, fontSize: 12, color: "#FF6B35", margin: "0 0 2px" }}>{Number(p.prix).toLocaleString()} F • {p.categorie}</p>
                    <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{p.video_url ? "🎥 Vidéo • " : ""}En ligne • Bamako</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={() => router.push("/reels")} style={{ background: "#111", color: "white", border: "none", padding: "7px 12px", borderRadius: 999, fontWeight: 900, fontSize: 11 }}>Voir</button>
                    <button onClick={() => supprimerProduit(p.id, p.whatsapp)} disabled={suppressionEnCours === String(p.id)} style={{ background: suppressionEnCours === String(p.id) ? "#ccc" : "#FEE2E2", color: "#E11D48", border: "none", padding: "7px 12px", borderRadius: 999, fontWeight: 900, fontSize: 11 }}>{suppressionEnCours === String(p.id) ? "..." : "🗑️ Supprimer"}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {message && <p style={{ textAlign: "center", fontSize: 12, color: "#555", marginTop: 12 }}>{message}</p>}
        </div>
      )}

      <div style={{ background: "white", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-around", padding: "8px 0 10px", position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto", zIndex: 30 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🏠<br />Accueil</button>
        <button onClick={() => router.push("/messagerie")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>💬<br />Messagerie</button>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🛒<br />Panier</button>
        <button onClick={() => router.push("/reels")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#888" }}>🎬<br />Reels</button>
        <button style={{ background: "none", border: "none", fontSize: 11, fontWeight: "bold", color: "#FF6B35" }}>👤<br />Compte</button>
      </div>
    </div>
    </div>
  );
}