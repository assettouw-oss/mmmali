"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const COMMISSION = 0.05; // 5% pour MM Mali
const PRIX_PRO = 2000; // 2000 F / mois

export default function Home() {
  const router = useRouter();
  const [produits, setProduits] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("Tous");
  const [page, setPage] = useState(0);
  const [plusDeProduits, setPlusDeProduits] = useState(true);
  const [chargeProduits, setChargeProduits] = useState(false);

  const [showBoutique, setShowBoutique] = useState(false);
  const [nomBoutique, setNomBoutique] = useState("");
  const [nom, setNom] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userConnecte, setUserConnecte] = useState<any>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [emailLogin, setEmailLogin] = useState("");
  const [passLogin, setPassLogin] = useState("");
  const [showPassLogin, setShowPassLogin] = useState(false);

  const [selected, setSelected] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sonActif, setSonActif] = useState(false);
  const videoPleinEcranRef = useRef<HTMLVideoElement>(null);

  // ===== NOUVEAU : COMMANDER + PAIEMENT + COMMISSION =====
  const [showCommander, setShowCommander] = useState<any>(null);
  const [acheteurNom, setAcheteurNom] = useState("");
  const [acheteurWhatsapp, setAcheteurWhatsapp] = useState("");
  const [paiement, setPaiement] = useState("Paiement à la livraison");
  const [showPro, setShowPro] = useState(false);

  async function load(pageActuelle = 0) {
    setChargeProduits(true);
    const PAR_PAGE = 6;
    const debut = pageActuelle * PAR_PAGE;
    const fin = debut + PAR_PAGE - 1;
    const { data } = await supabase.from("produits").select("id,titre,prix,mode_produit,categorie,whatsapp,description,image_url,video_url,boosted,created_at").order("boosted", { ascending: false }).order("created_at", { ascending: false }).range(debut, fin);
    if (data) {
      if (pageActuelle === 0) setProduits(data);
      else setProduits((ancien) => [...ancien, ...data]);
      if (data.length < PAR_PAGE) setPlusDeProduits(false); else setPlusDeProduits(true);
    }
    setChargeProduits(false);
  }

  useEffect(() => { load(0); }, []);

  useEffect(() => {
    if (selected?.video_url) {
      setIsPlaying(true); setSonActif(false);
      setTimeout(() => { const vid = videoPleinEcranRef.current; if (vid) { vid.muted = true; vid.play().catch(() => {}); } }, 100);
    }
  }, [selected]);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) setUserConnecte(data.session.user);
    }
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) setUserConnecte(session.user); else setUserConnecte(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ===== COMMANDER : ENREGISTRE + COMMISSION 5% + OUVRE WHATSAPP =====
  async function validerCommande() {
    const p = showCommander;
    if (!p) return;
    if (!acheteurNom) return alert("Mets ton nom");
    if (!acheteurWhatsapp) return alert("Mets ton numéro WhatsApp");
    setLoading(true);
    const prix = Number(p.prix || 0);
    const commission = Math.round(prix * COMMISSION);

    // 1. On enregistre la commande pour ta commission
    await supabase.from("commandes").insert({
      produit_id: p.id,
      titre: p.titre,
      prix: prix,
      commission: commission,
      vendeur_whatsapp: p.whatsapp,
      acheteur_nom: acheteurNom,
      acheteur_whatsapp: acheteurWhatsapp,
      paiement: paiement,
      ville: "Bamako",
      statut: "en_attente"
    });

    // 2. On ouvre WhatsApp du vendeur avec le message déjà écrit
    const message = `Bonjour, je veux commander sur MM Mali (Bamako) :\n- Produit : ${p.titre}\n- Prix : ${prix.toLocaleString()} F\n- Paiement : ${paiement}\n- Mon nom : ${acheteurNom}\n- Mon WhatsApp : ${acheteurWhatsapp}`;
    setLoading(false);
    setShowCommander(null);
    setShowLogin(false);
    setSelected(null);
    alert(`✅ Commande enregistrée !\nTu paies : ${prix.toLocaleString()} F\nPaiement : ${paiement}\nLe vendeur va te contacter.`);
    window.open("https://wa.me/223" + String(p.whatsapp || "").replace(/\s/g, "") + "?text=" + encodeURIComponent(message), "_blank");
  }

  async function entrerAvecEmail() {
    if (!emailLogin) return alert("Mets ton e-mail");
    if (!passLogin || passLogin.length < 6) return alert("Mot de passe : 6 caractères minimum");
    setLoading(true);
    const { data: login, error: errLogin } = await supabase.auth.signInWithPassword({ email: emailLogin.trim().toLowerCase(), password: passLogin });
    if (login.user) { setLoading(false); setShowLogin(false); alert("✅ Bienvenue ! Tu es connecté."); router.push("/compte"); return; }
    if (errLogin?.message.includes("Invalid login") || errLogin?.message.includes("invalid") || errLogin?.message.includes("Invalid")) {
      const { data: nouveau, error: errNouveau } = await supabase.auth.signUp({ email: emailLogin.trim().toLowerCase(), password: passLogin, options: { data: { full_name: nom || "Vendeur MM Mali", whatsapp: whatsapp || "", boutique_nom: nomBoutique || "Ma Boutique" } } });
      setLoading(false);
      if (errNouveau) return alert("Erreur: " + errNouveau.message);
      setShowLogin(false);
      if (nouveau.user) { alert("✅ Compte créé ! Bienvenue chez MM Mali."); router.push("/compte"); } else alert("Vérifie ton email pour confirmer ton compte, puis connecte-toi");
      return;
    }
    setLoading(false);
    return alert("Erreur: " + errLogin?.message);
  }

  async function creerBoutique() {
    if (userConnecte) { alert("Tu as déjà un compte ! Va dans Mon Compte."); router.push("/compte"); return; }
    if (!nomBoutique) return alert("Mets le nom de ta boutique");
    if (!nom) return alert("Mets ton nom");
    if (!whatsapp) return alert("Mets ton numéro WhatsApp - OBLIGATOIRE");
    if (!email) return alert("Mets ton adresse e-mail - OBLIGATOIRE");
    if (!password || password.length < 6) return alert("Mot de passe : 6 caractères minimum");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: nom, whatsapp: whatsapp, boutique_nom: nomBoutique } } });
    if (error) { setLoading(false); return alert("Erreur: " + error.message); }
    setLoading(false); setShowBoutique(false);
    if (data.user) { alert("✅ Félicitations ! Ta Boutique " + nomBoutique + " est créée !"); router.push("/compte"); } else alert("Vérifie ton email pour confirmer ton compte, puis connecte-toi");
  }

  const categories = ["Tous", "Restaurant", "Électronique", "Mode", "Cosmétique", "Maison", "Sport", "Santé", "Beauté", "Auto / Moto", "Immobilier", "Services", "Autre"];
  const filtres = produits.filter((p) => {
    const okCat = categorie === "Tous" || (p.mode_produit || p.categorie) === categorie;
    const okSearch = !search || p.titre?.toLowerCase().includes(search.toLowerCase());
    return okCat && okSearch;
  });
  function changerCategorie(c: string) { setCategorie(c); setPage(0); setPlusDeProduits(true); load(0); }

  return (
    <div style={{ background: "#FFF9F5", minHeight: "100vh", padding: "8px 10px 90px" }}>
      <div style={{ background: "white", padding: "10px 12px 8px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>MM <span style={{ color: "#FF6B35" }}>Mali</span> <span style={{ fontSize: 10, background: "#FFF1E8", padding: "3px 7px", borderRadius: 999 }}>📍 BAMAKO</span></p>
          <button onClick={() => router.push("/compte")} style={{ background: "#FFF1E8", border: "none", padding: "8px 12px", borderRadius: 999, fontWeight: "bold", fontSize: 12 }}>👤 Mon Compte</button>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Cherche un produit à Bamako..." style={{ width: "100%", padding: 11, borderRadius: 999, border: "1px solid #eee", marginTop: 8, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 8, paddingBottom: 4 }}>
          {categories.map((c) => (<button key={c} onClick={() => changerCategorie(c)} style={{ whiteSpace: "nowrap", padding: "7px 12px", borderRadius: 999, border: "none", background: categorie === c ? "#FF6B35" : "#F5F5F5", color: categorie === c ? "white" : "#333", fontSize: 12, fontWeight: "bold" }}>{c}</button>))}
        </div>
      </div>

      <div style={{ margin: "10px 0 0", background: "linear-gradient(135deg, #FF6B35, #FF9A3D)", borderRadius: 16, padding: 13, color: "white" }}>
        <p style={{ fontSize: 19, fontWeight: 900, margin: 0 }}>👋 Bienvenue chez MM Mali !</p>
        <p style={{ fontSize: 12, margin: "5px 0 0", lineHeight: 1.4, opacity: 0.95 }}>Achète et vends à Bamako. Paiement à la livraison ou Mobile Money. C'est gratuit.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {userConnecte ? (<button onClick={() => router.push("/compte")} style={{ flex: 1, background: "white", color: "#FF6B35", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>👤 Aller à Mon Compte</button>) : (<button onClick={() => setShowLogin(true)} style={{ flex: 1, background: "white", color: "#FF6B35", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>🏪 Entrer / Créer ma Boutique</button>)}
          <button onClick={() => setShowPro(true)} style={{ flex: 1, background: "black", color: "white", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>⭐ Devenir PRO - 2.000 F</button>
        </div>
      </div>

      <div style={{ margin: "10px 0", background: "black", borderRadius: 16, padding: 14, color: "white" }}>
        <p style={{ fontSize: 11, background: "#FF6B35", display: "inline-block", padding: "4px 10px", borderRadius: 999, fontWeight: 900, margin: 0 }}>🔥 GRATUIT - 30 SECONDES - BAMAKO</p>
        <h2 style={{ fontSize: 18, fontWeight: 900, margin: "8px 0 4px", lineHeight: 1.2 }}>Tu vends quelque chose<br />à Bamako ?</h2>
        <p style={{ fontSize: 12, color: "#ccc", margin: "0 0 12px", lineHeight: 1.4 }}>Crée ta Boutique PRO. Publie tes produits. Reçois des clients sur WhatsApp. MM Mali prend 5% sur chaque vente.</p>
        {userConnecte ? (<button onClick={() => router.push("/compte")} style={{ background: "#FF6B35", color: "white", border: "none", padding: "12px 20px", borderRadius: 999, fontWeight: 900, fontSize: 13, width: "100%" }}>👤 Aller à Mon Compte →</button>) : (<button onClick={() => setShowLogin(true)} style={{ background: "#FF6B35", color: "white", border: "none", padding: "12px 20px", borderRadius: 999, fontWeight: 900, fontSize: 13, width: "100%" }}>🏪 Entrer / Créer ma Boutique → C'est Gratuit</button>)}
        <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: "8px 0 0" }}>E-mail + Mot de passe + WhatsApp obligatoires • Livraison Bamako uniquement</p>
      </div>

      <p style={{ fontWeight: 900, fontSize: 13, margin: "0 0 8px" }}>Produits à Bamako • {filtres.length} • Clique sur une photo</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {filtres.map((p) => (
          <div key={p.id} style={{ background: "white", borderRadius: 12, overflow: "hidden" }}>
            <div onClick={() => { setSelected(p); setIsPlaying(true); }} style={{ position: "relative", cursor: "pointer" }}>
              <img src={p.image_url} loading="lazy" style={{ width: "100%", height: 120, objectFit: "cover", display: "block", background: "#eee" }} />
              {p.video_url && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 42, height: 42, background: "rgba(0,0,0,0.6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}>▶️</div>}
              <span style={{ position: "absolute", top: 6, left: 6, background: "#FF6B35", color: "white", fontSize: 9, padding: "3px 7px", borderRadius: 999, fontWeight: "bold" }}>{p.mode_produit || p.categorie || "Produit"}</span>
            </div>
            <div style={{ padding: "7px 8px" }}>
              <p style={{ fontSize: 11, fontWeight: "bold", margin: 0, lineHeight: 1.3 }}>{p.titre}</p>
              <p style={{ fontSize: 12, fontWeight: 900, margin: "4px 0", color: "#FF6B35" }}>{Number(p.prix).toLocaleString()} F</p>
              <p style={{ fontSize: 11, color: "#25D366", fontWeight: "bold", margin: 0 }}>📱 {p.whatsapp} • 📍 Bamako</p>
              <button onClick={() => setShowCommander(p)} style={{ width: "100%", background: "#FF6B35", color: "white", border: "none", padding: "8px 0", borderRadius: 999, fontWeight: "bold", fontSize: 11, marginTop: 7 }}>🛒 COMMANDER</button>
              <button onClick={() => window.open("https://wa.me/223" + String(p.whatsapp || "").replace(/\s/g, ""), "_blank")} style={{ width: "100%", background: "#25D366", color: "white", border: "none", padding: "8px 0", borderRadius: 999, fontWeight: "bold", fontSize: 11, marginTop: 5 }}>💬 WhatsApp</button>
            </div>
          </div>
        ))}
      </div>

      {plusDeProduits && filtres.length > 0 && (<button onClick={() => { const nouvellePage = page + 1; setPage(nouvellePage); load(nouvellePage); }} style={{ width: "100%", background: "black", color: "white", border: "none", padding: "12px 0", borderRadius: 999, fontWeight: 900, fontSize: 13, marginTop: 12 }}>{chargeProduits ? "Chargement..." : "Voir plus de produits ↓"}</button>)}
      {filtres.length === 0 && !chargeProduits && <p style={{ textAlign: "center", color: "#888", padding: 20 }}>Aucun produit pour l'instant. Sois le premier à publier à Bamako !</p>}

      {/* ===== PLEIN ECRAN ===== */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "black", zIndex: 200, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", color: "white" }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 14 }}>MM Mali • Bamako • {selected.mode_produit || selected.categorie || "Produit"}</p>
            <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "white", fontSize: 16, fontWeight: "bold" }}>X</button>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            {selected.video_url ? (<><video ref={videoPleinEcranRef} src={selected.video_url} autoPlay={isPlaying} muted={!sonActif} loop playsInline preload="auto" poster={selected.image_url || ""} onCanPlay={(e) => { e.currentTarget.play().catch(() => {}); }} style={{ width: "100%", maxHeight: "100%", objectFit: "contain", background: "black" }} onClick={(e) => { const v = e.currentTarget; if (!sonActif) { setSonActif(true); v.muted = false; v.play(); setIsPlaying(true); } else { if (v.paused) { v.play(); setIsPlaying(true); } else { v.pause(); setIsPlaying(false); } } }} /><button onClick={(e) => { e.stopPropagation(); const vid = videoPleinEcranRef.current; if (vid) { const nouveau = !sonActif; setSonActif(nouveau); vid.muted = !nouveau; vid.play().catch(() => {}); } }} style={{ position: "absolute", top: 12, right: 12, width: 42, height: 42, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)", color: "white", fontSize: 18, zIndex: 10 }}>{sonActif ? "🔊" : "🔇"}</button>{!sonActif && (<div onClick={() => { setSonActif(true); const vid = videoPleinEcranRef.current; if (vid) { vid.muted = false; vid.play(); } }} style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "white", fontSize: 12, fontWeight: "bold", padding: "8px 14px", borderRadius: 999, whiteSpace: "nowrap" }}>👆 Clique sur la vidéo pour le son</div>)}</>) : (<img src={selected.image_url} style={{ width: "100%", maxHeight: "100%", objectFit: "contain" }} />)}
          </div>
          <div style={{ background: "white", padding: 14, borderRadius: "20px 20px 0 0" }}>
            <p style={{ fontWeight: 900, fontSize: 15, margin: 0 }}>{selected.titre}</p>
            <p style={{ fontWeight: 900, fontSize: 15, margin: "6px 0", color: "#FF6B35" }}>{Number(selected.prix).toLocaleString()} F • 📍 Bamako</p>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 10px" }}>{selected.description || "Produit disponible à Bamako."}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowCommander(selected)} style={{ flex: 1, background: "#FF6B35", color: "white", border: "none", padding: "12px 0", borderRadius: 999, fontWeight: 900 }}>🛒 COMMANDER</button>
              <button onClick={() => setSelected(null)} style={{ background: "#F5F5F5", border: "none", padding: "12px 16px", borderRadius: 999, fontWeight: "bold" }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FENETRE COMMANDER - NOUVEAU : COMMISSION + PAIEMENT ===== */}
      {showCommander && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 430, borderRadius: "18px 18px 0 0", padding: "14px 14px 30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>🛒 Commander</p>
              <button onClick={() => setShowCommander(null)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#F5F5F5", fontWeight: 900 }}>X</button>
            </div>
            <p style={{ fontSize: 13, fontWeight: 900, margin: "8px 0 2px" }}>{showCommander.titre}</p>
            <p style={{ fontSize: 13, color: "#FF6B35", fontWeight: 900, margin: 0 }}>{Number(showCommander.prix).toLocaleString()} F • 📍 Bamako • Commission MM Mali incluse</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 900 }}>Ton nom *</label>
              <input value={acheteurNom} onChange={(e) => setAcheteurNom(e.target.value)} placeholder="Ex: Moussa Traoré" style={{ padding: "11px", borderRadius: 10, border: "1px solid #eee", fontSize: 13 }} />
              <label style={{ fontSize: 12, fontWeight: 900 }}>Ton WhatsApp *</label>
              <input value={acheteurWhatsapp} onChange={(e) => setAcheteurWhatsapp(e.target.value)} placeholder="Ex: 98 19 60 47" style={{ padding: "11px", borderRadius: 10, border: "2px solid #25D366", fontSize: 13, fontWeight: "bold" }} />
              <label style={{ fontSize: 12, fontWeight: 900 }}>Comment tu veux payer ? *</label>
              {["Paiement à la livraison", "Orange Money", "Wave", "Moov Money"].map((m) => (
                <button key={m} onClick={() => setPaiement(m)} style={{ textAlign: "left", padding: "11px", borderRadius: 10, border: paiement === m ? "2px solid #FF6B35" : "1px solid #eee", background: paiement === m ? "#FFF1E8" : "white", fontSize: 13, fontWeight: paiement === m ? 900 : 400 }}>
                  {m === "Paiement à la livraison" ? "💵 " : m === "Orange Money" ? "🟠 " : m === "Wave" ? "🔵 " : "🟡 "}{m} {paiement === m ? "✅" : ""}
                </button>
              ))}
              <div style={{ background: "#FFF1E8", borderRadius: 10, padding: "8px 10px", fontSize: 11, lineHeight: 1.4 }}>📍 Livraison à Bamako uniquement pour le moment.<br />{paiement === "Paiement à la livraison" ? "Tu paies quand tu reçois ton produit." : `Tu vas payer par ${paiement}. Le vendeur va te confirmer le numéro.`}</div>
              <button onClick={validerCommande} style={{ background: "black", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: "bold", fontSize: 13 }}>{loading ? "Enregistrement..." : `CONFIRMER - ${Number(showCommander.prix).toLocaleString()} F →`}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FENETRE PRO ===== */}
      {showPro && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 430, borderRadius: "18px 18px 0 0", padding: "14px 14px 30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>⭐ Devenir Vendeur PRO</p>
              <button onClick={() => setShowPro(false)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#F5F5F5", fontWeight: 900 }}>X</button>
            </div>
            <p style={{ fontSize: 12, color: "#888", margin: "6px 0 12px" }}>Pour les vendeurs à Bamako qui veulent vendre plus vite.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <p style={{ margin: 0 }}>✅ Badge PRO orange sur ta boutique</p>
              <p style={{ margin: 0 }}>✅ Tes produits en haut de l'Accueil</p>
              <p style={{ margin: 0 }}>✅ 20 produits au lieu de 6</p>
              <p style={{ margin: 0 }}>✅ Statistiques : combien de gens ont vu tes produits</p>
              <p style={{ fontSize: 18, fontWeight: 900, margin: "8px 0 0", textAlign: "center" }}>{PRIX_PRO.toLocaleString()} F / mois</p>
              <button onClick={() => { setShowPro(false); window.open("https://wa.me/223" + String(whatsapp || "").replace(/\s/g, ""), "_blank"); alert("Envoie ce message : Je veux devenir PRO MM Mali - 2.000 F / mois"); }} style={{ background: "#FF6B35", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: "bold", fontSize: 13 }}>⭐ Je veux devenir PRO →</button>
              <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: 0 }}>Paiement : Orange Money / Wave / Moov Money / Paiement à la livraison</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== FENETRE BOUTIQUE ===== */}
      {showBoutique && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 430, borderRadius: "18px 18px 0 0", padding: "12px 14px 30px", maxHeight: "88vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><p style={{ fontWeight: 900, fontSize: 14, margin: 0 }}>Inscrivez-vous sur MM Mali</p><p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>Bamako uniquement • C'est gratuit</p></div>
              <button onClick={() => setShowBoutique(false)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#F5F5F5", fontWeight: 900 }}>X</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 900 }}>Nom de ta Boutique *</label><input value={nomBoutique} onChange={(e) => setNomBoutique(e.target.value)} placeholder="Ex: Awa Boutique" style={{ padding: "10px 11px", borderRadius: 10, border: "1px solid #eee", fontSize: 13 }} />
              <label style={{ fontSize: 12, fontWeight: 900 }}>Ton nom complet *</label><input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Awa Diallo" style={{ padding: "10px 11px", borderRadius: 10, border: "1px solid #eee", fontSize: 13 }} />
              <label style={{ fontSize: 12, fontWeight: 900 }}>Numéro WhatsApp *</label><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex: 98 19 60 47" style={{ padding: "10px 11px", borderRadius: 10, border: "2px solid #25D366", fontWeight: "bold", fontSize: 13 }} />
              <label style={{ fontSize: 12, fontWeight: 900 }}>Adresse e-mail *</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Ex: awa@gmail.com" style={{ padding: "10px 11px", borderRadius: 10, border: "1px solid #eee", fontSize: 13 }} />
              <label style={{ fontSize: 12, fontWeight: 900 }}>Mot de passe *</label><div style={{ position: "relative" }}><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPass ? "text" : "password"} placeholder="6 caractères minimum" style={{ width: "100%", padding: "10px 11px", paddingRight: 40, borderRadius: 10, border: "1px solid #eee", boxSizing: "border-box", fontSize: 13 }} /><button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 8, top: 7, background: "none", border: "none", fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</button></div>
              <button onClick={creerBoutique} style={{ background: "black", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: "bold", fontSize: 13 }}>{loading ? "Création..." : "Créer ma Boutique PRO →"}</button>
              <button onClick={() => { setShowBoutique(false); setShowLogin(true); }} style={{ background: "white", color: "#333", border: "1px solid #eee", padding: "12px 0", borderRadius: 999, fontWeight: "bold", fontSize: 12 }}>J'ai déjà un compte → Se connecter</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FENETRE ENTRER ===== */}
      {showLogin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 430, borderRadius: "18px 18px 0 0", padding: "14px 14px 30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>👋 Entre chez MM Mali</p><button onClick={() => setShowLogin(false)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#F5F5F5", fontWeight: 900 }}>X</button></div>
            <p style={{ fontSize: 12, color: "#888", margin: "6px 0 12px" }}>Pas de compte ? Pas grave, on te le crée tout seul. C'est gratuit.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 900 }}>Adresse e-mail *</label><input value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} type="email" placeholder="Ex: awa@gmail.com" style={{ padding: "11px", borderRadius: 10, border: "1px solid #eee", fontSize: 13 }} />
              <label style={{ fontSize: 12, fontWeight: 900 }}>Mot de passe *</label><div style={{ position: "relative" }}><input value={passLogin} onChange={(e) => setPassLogin(e.target.value)} type={showPassLogin ? "text" : "password"} placeholder="6 caractères minimum" style={{ width: "100%", padding: "11px", paddingRight: 40, borderRadius: 10, border: "1px solid #eee", boxSizing: "border-box", fontSize: 13 }} /><button onClick={() => setShowPassLogin(!showPassLogin)} style={{ position: "absolute", right: 8, top: 7, background: "none", border: "none", fontSize: 16 }}>{showPassLogin ? "🙈" : "👁️"}</button></div>
              <button onClick={entrerAvecEmail} style={{ background: "black", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: "bold", fontSize: 13 }}>{loading ? "Connexion..." : "ENTRER →"}</button>
              <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: 0 }}>Si tu as déjà un compte, on te connecte. Sinon, on te crée un compte.</p>
              <button onClick={() => { setShowLogin(false); setShowBoutique(true); }} style={{ background: "white", color: "#333", border: "1px solid #eee", padding: "12px 0", borderRadius: 999, fontWeight: "bold", fontSize: 12 }}>Je veux créer ma Boutique avec Nom + WhatsApp →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}