"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
type Vue = "home" | "commandes" | "favoris" | "stories" | "portefeuille-profil" | "portefeuille" | "solde" | "profil" | "localisations" | "reference" | "assistance" | "tutoriel" | "faq" | "confidentialite" | "publications";
const MODES = ["Restaurant", "Ã‰lectronique", "Mode", "CosmÃ©tique", "Maison", "Sport", "SantÃ©", "BeautÃ©", "Auto / Moto", "Immobilier", "Services", "Autre"];
export default function Compte() {
  const [vue, setVue] = useState<Vue>("home");
  const [user, setUser] = useState<any>(null);
  const [chargementCompte, setChargementCompte] = useState(true);
  const [profil, setProfil] = useState({ nom: "", full_name: "", telephone: "", phone: "", whatsapp: "", ville: "Bamako", quartier: "", email: "", role: "vendeur", boutique_nom: "" });
  const [produits, setProduits] = useState<any[]>([]);
  const [solde, setSolde] = useState(500);
  const [showPub, setShowPub] = useState(false);
  const [pubForm, setPubForm] = useState({ titre: "", prix: "", categorie: "Ã‰lectronique", mode_produit: "Ã‰lectronique", ville: "Bamako", whatsapp: "", description: "", image_url: "", video_url: "", anonyme: true });
  const [montant, setMontant] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editProduit, setEditProduit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ titre: "", prix: "", mode_produit: "Ã‰lectronique", ville: "Bamako", whatsapp: "", description: "", image_url: "", video_url: "" });

  // âœ… NOUVEAU : Formulaire de connexion si pas connectÃ©
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // âœ… CORRIGÃ‰ : On utilise VRAIMENT nomAffiche partout dans l'Ã©cran
  // PrioritÃ© : boutique_nom -> nom -> metadata -> fallback
  const nomAffiche = profil?.boutique_nom || profil?.nom || user?.user_metadata?.boutique_nom || user?.user_metadata?.full_name || "Compte MM Mali";
  const whatsappAffiche = profil?.whatsapp || profil?.telephone || user?.user_metadata?.whatsapp || "Non dÃ©fini";
  const lettre = nomAffiche.charAt(0).toUpperCase();

  // âœ… UN SEUL useEffect, pas 2 - AVEC getSession, pas getUser
 useEffect(() => {
  async function load() {
    // âœ… Ã‰TAPE 0 : On prend la SESSION, c'est le plus fiable sur iPhone
    // getUser() tout seul dit souvent "pas connectÃ©" mÃªme quand tu l'es
    const { data: sess } = await supabase.auth.getSession();
    const u = sess.session?.user;
    if (!u) {
      setUser(null);
      setChargementCompte(false);
      return;
    }
    setUser(u);

    const meta: any = u.user_metadata || {};

    // âœ… Ã‰TAPE 1 : On affiche TOUT DE SUITE depuis le compte, on n'attend pas profiles
    // C'est Ã§a qui va afficher les infos du petit frÃ¨re en haut, mÃªme si profiles est vide
    const nomDirect = meta.boutique_nom || meta.full_name || "";
    const waDirect = meta.whatsapp || meta.phone || "";

    setProfil({
      nom: nomDirect,
      full_name: nomDirect,
      telephone: waDirect,
      phone: waDirect,
      whatsapp: waDirect,
      ville: "Bamako",
      quartier: "",
      email: u.email || "",
      role: "vendeur",
      boutique_nom: meta.boutique_nom || nomDirect,
    });
    setPubForm((f) => ({ ...f, whatsapp: waDirect}));

    // âœ… Ã‰TAPE 2 : On regarde si le profil existe dans la table
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();

    if (prof) {
      // Si il existe, on l'affiche (c'est le plus complet)
      setProfil({
        nom: prof.nom || nomDirect,
        full_name: prof.nom || nomDirect,
        telephone: prof.whatsapp || prof.telephone || waDirect,
        phone: prof.whatsapp || prof.telephone || waDirect,
        whatsapp: prof.whatsapp || prof.telephone || waDirect,
        ville: prof.ville || "Bamako",
        quartier: prof.quartier || "",
        email: u.email || prof.email || "",
        role: prof.role || "vendeur",
        boutique_nom: prof.boutique_nom || meta.boutique_nom || nomDirect,
      });
      setPubForm((f) => ({ ...f, whatsapp: prof.whatsapp || prof.telephone || waDirect }));
    } else {
      // âœ… Ã‰TAPE 3 : Si il n'existe PAS, on le crÃ©e maintenant
      // Ici Ã§a ne plante plus, parce que l'utilisateur est dÃ©jÃ  bien connectÃ©
      // Ce n'est plus comme dans app/page.tsx oÃ¹ il venait juste d'Ãªtre crÃ©Ã©
      console.log("Profil manquant, on le crÃ©e pour :", nomDirect);
      const { error } = await supabase.from("profiles").upsert({
        id: u.id,
        nom: nomDirect,
        boutique_nom: meta.boutique_nom || nomDirect,
        telephone: waDirect,
        whatsapp: waDirect,
        email: u.email,
        ville: "Bamako",
        role: "vendeur",
      }, { onConflict: "id" });
      if (error) console.log("Erreur crÃ©ation profil dans Compte:", error.message);
    }

    const r = await supabase.from("produits").select("*").eq("user_id", u.id).order("created_at", { ascending: false });
    if (r.data) setProduits(r.data);
    setChargementCompte(false);
  }
  load();

  // âœ… Si tu te connectes / dÃ©connectes pendant que la page est ouverte, Ã§a se met Ã  jour tout seul
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      setUser(session.user);
      load();
    } else {
      setUser(null);
      setChargementCompte(false);
    }
  });
  return () => listener.subscription.unsubscribe();
}, []);

  // âœ… NOUVEAU : Se connecter avec email + mot de passe
  async function seConnecter() {
    if (!loginEmail) return alert("Mets ton email");
    if (!loginPass) return alert("Mets ton mot de passe");
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    setLoginLoading(false);
    if (error) { alert("Erreur connexion: " + error.message + "\n\nVÃ©rifie que c'est le MÃŠME email que tu as utilisÃ© pour crÃ©er ta boutique."); return; }
    if (data.user) {
      setUser(data.user);
      alert("âœ… ConnectÃ© ! Bienvenue " + (data.user.user_metadata?.boutique_nom || data.user.user_metadata?.full_name || ""));
      window.location.reload();
    }
  }

  async function seDeconnecter() {
    await supabase.auth.signOut();
    setUser(null);
    setProfil({ nom: "", full_name: "", telephone: "", phone: "", whatsapp: "", ville: "Bamako", quartier: "", email: "", role: "vendeur", boutique_nom: "" });
    alert("DÃ©connectÃ©");
  }

  function upload(e: any, type: string, isEdit = false) {
  const file = e.target.files[0]; if (!file) return;

  // âœ… Si c'est une VIDÃ‰O, on ne compresse pas, on la prend telle quelle
  // Mais on refuse si elle est trop lourde > 15 Mo
  if (type === "video") {
    if (file.size > 15 * 1024 * 1024) {
      alert("VidÃ©o trop lourde ! Prends une vidÃ©o de moins de 15 secondes, ou coupe-la dans WhatsApp avant.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (isEdit) setEditForm((f) => ({ ...f, video_url: reader.result as string }));
      else setPubForm((f) => ({ ...f, video_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
    return;
  }

  // âœ… Si c'est une PHOTO, on la compresse pour que ce soit SUPER RAPIDE
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const max = 800; // âœ… 800px c'est largement suffisant pour un tÃ©lÃ©phone
    let w = img.width, h = img.height;
    if (w > max) { h = h * max / w; w = max; }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0, w, h);
    const compresse = canvas.toDataURL("image/jpeg", 0.7); // âœ… 0.7 = 70% qualitÃ©, 30x plus lÃ©ger
    URL.revokeObjectURL(url);
    if (isEdit) setEditForm((f) => ({ ...f, image_url: compresse }));
    else setPubForm((f) => ({ ...f, image_url: compresse }));
    console.log("Photo compressÃ©e :", file.size, "->", compresse.length);
  };
  img.src = url;
}

  async function savePub() {
    if (!pubForm.titre || !pubForm.prix || !pubForm.image_url) { alert("Titre, prix, photo obligatoires"); return; }
    if (!pubForm.whatsapp) { alert("WhatsApp obligatoire"); return; }
    // âœ… CORRIGÃ‰ : On re-vÃ©rifie la session JUSTE AVANT de publier
    // Avant tu prenais le vieux `user` qui pouvait Ãªtre vide, d'oÃ¹ "Tu dois Ãªtre connectÃ©"
    const { data: sess } = await supabase.auth.getSession();
    const userActuel = sess.session?.user || user;
    if (!userActuel) { alert("Tu dois Ãªtre connectÃ©. Connecte-toi d'abord, puis republie."); return; }
    const payload: any = { user_id: userActuel.id, titre: pubForm.titre, prix: Number(pubForm.prix), categorie: pubForm.mode_produit, mode_produit: pubForm.mode_produit, ville: pubForm.ville, whatsapp: pubForm.whatsapp, description: pubForm.description, image_url: pubForm.image_url, video_url: pubForm.video_url || null, anonyme: true };
    const { data, error } = await supabase.from("produits").insert(payload).select().single();
    if (error) {
      const { categorie, ...sansCat } = payload;
      const retry = await supabase.from("produits").insert(sansCat).select().single();
      if (retry.error) { alert("Erreur: " + retry.error.message); return; }
      setProduits((prev) => [retry.data, ...prev]);
    } else { setProduits((prev) => [data, ...prev]); }
    setShowPub(false);
    alert("âœ… PubliÃ© en ANONYME ! Tout le monde le voit sur Accueil");
    setPubForm({ titre: "", prix: "", categorie: "Ã‰lectronique", mode_produit: "Ã‰lectronique", ville: "Bamako", whatsapp: profil.whatsapp || "", description: "", image_url: "", video_url: "", anonyme: true });
    window.location.href = "/";
  }

  async function supprimerProduit(id: string, titre: string) {
    const ok = confirm(`Tu veux vraiment supprimer "${titre}" ?`);
    if (!ok) return;
    setProduits((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("produits").delete().eq("id", id);
    if (error) { alert("Erreur suppression: " + error.message); return; }
    alert("ðŸ—‘ï¸ Produit supprimÃ© !");
  }

  function ouvrirModifier(p: any) {
    setEditProduit(p);
    setEditForm({ titre: p.titre || "", prix: String(p.prix || ""), mode_produit: p.mode_produit || p.categorie || "Ã‰lectronique", ville: p.ville || "Bamako", whatsapp: p.whatsapp || "", description: p.description || "", image_url: p.image_url || "", video_url: p.video_url || "" });
    setShowEdit(true);
  }

  async function sauvegarderModification() {
    if (!editProduit) return;
    if (!editForm.titre || !editForm.prix) { alert("Titre et prix obligatoires"); return; }
    const { data, error } = await supabase.from("produits").update({ titre: editForm.titre, prix: Number(editForm.prix), categorie: editForm.mode_produit, mode_produit: editForm.mode_produit, ville: editForm.ville, whatsapp: editForm.whatsapp, description: editForm.description, image_url: editForm.image_url, video_url: editForm.video_url || null }).eq("id", editProduit.id).select().single();
    if (error) { alert("Erreur: " + error.message); return; }
    setProduits((prev) => prev.map((p) => p.id === editProduit.id ? data : p));
    setShowEdit(false); setEditProduit(null);
    alert("âœ… ModifiÃ© !");
  }

  // âœ… NOUVEAU : Si chargement, on montre Chargement, pas une page vide
  if (chargementCompte) {
    return (
      <div style={{ background: "#FFF9F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontWeight: 900 }}>â³ Chargement de ton Compte...</p>
      </div>
    );
  }

  // âœ… NOUVEAU : Si PAS CONNECTÃ‰, on affiche l'Ã©cran Se connecter, pas une page vide
  // C'est Ã§a qui te manquait : avant tu voyais vide et tu ne savais pas que tu n'Ã©tais pas connectÃ©
  if (!user) {
    return (
      <div style={{ background: "#FFF9F5", minHeight: "100vh", padding: "16px 12px 90px" }}>
        <div style={{ background: "white", borderRadius: 16, padding: 16, maxWidth: 430, margin: "20px auto 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, background: "#FF6B35", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 14 }}>MM</div>
            <div>
              <p style={{ fontWeight: 900, fontSize: 15, margin: 0 }}>Connecte-toi Ã  MM Mali</p>
              <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>Utilise le MÃŠME email que pour crÃ©er ta boutique</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 900 }}>Adresse e-mail *</label>
            <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" placeholder="Ex: awa@gmail.com" style={{ padding: "11px 12px", borderRadius: 10, border: "1px solid #eee", fontSize: 13 }} />
            <label style={{ fontSize: 12, fontWeight: 900 }}>Mot de passe *</label>
            <div style={{ position: "relative" }}>
              <input value={loginPass} onChange={(e) => setLoginPass(e.target.value)} type={showLoginPass ? "text" : "password"} placeholder="Ton mot de passe" style={{ width: "100%", padding: "11px 12px", paddingRight: 40, borderRadius: 10, border: "1px solid #eee", boxSizing: "border-box", fontSize: 13 }} />
              <button onClick={() => setShowLoginPass(!showLoginPass)} style={{ position: "absolute", right: 8, top: 8, background: "none", border: "none", fontSize: 16 }}>{showLoginPass ? "ðŸ™ˆ" : "ðŸ‘ï¸"}</button>
            </div>
            <button onClick={seConnecter} style={{ background: "black", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: "bold", fontSize: 13, marginTop: 4 }}>{loginLoading ? "Connexion..." : "Se connecter â†’"}</button>
            <button onClick={() => { window.location.href = "/"; }} style={{ background: "white", color: "#333", border: "1px solid #eee", padding: "12px 0", borderRadius: 999, fontWeight: "bold", fontSize: 12 }}>â† Retour Accueil / CrÃ©er ma Boutique</button>
            <p style={{ fontSize: 11, color: "#888", textAlign: "center", lineHeight: 1.4, margin: "4px 0 0" }}>Si tu as oubliÃ© ton email, c'est celui que tu as mis quand tu as crÃ©Ã© ta boutique. Si tu te connectes avec un autre email, tu verras un compte vide.</p>
          </div>
        </div>
      </div>
    );
  }

  if (vue !== "home") {
    return (
      <div style={{ background: "#FFF9F5", minHeight: "100vh", padding: 10 }}>
        {/* âœ… CORRIGÃ‰ : Ce bloc Ã©tait dehors du return avant, il faisait planter. Maintenant il est dedans */}
        <div style={{ background: "white", borderRadius: 14, padding: "12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 48, height: 48, background: "#FF6B35", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20, fontWeight: 900 }}>
            {lettre}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 900, fontSize: 15, margin: 0 }}>{nomAffiche}</p>
            <p style={{ fontSize: 11, color: "#25D366", fontWeight: "bold", margin: "2px 0 0" }}>ðŸ“± {whatsappAffiche}</p>
            <p style={{ fontSize: 11, color: "#888", margin: "1px 0 0" }}>ðŸ“§ {profil.email || user?.email || ""}</p>
            <p style={{ fontSize: 11, color: "#888", margin: "1px 0 0" }}>ðŸ“ {profil.ville || "Bamako"} â€¢ â­ {profil.role || "vendeur"}</p>
            <span style={{ background: "#E6FFED", color: "green", fontSize: 9, padding: "2px 7px", borderRadius: 999, fontWeight: "bold" }}>âœ“ COMPTE VÃ‰RIFIÃ‰</span>
          </div>
          <span style={{ background: "#FFF1E8", padding: "5px 9px", borderRadius: 999, fontSize: 12, fontWeight: "bold" }}>{solde} F</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", padding: 10, borderRadius: 12 }}>
          <button onClick={() => setVue("home")} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#FFF1E8", fontSize: 16 }}>â†</button>
          <p style={{ fontWeight: 900, margin: 0, fontSize: 14 }}>{vue === "commandes" && "Mes Commandes ðŸ“¦"} {vue === "favoris" && "Mes Favoris â¤ï¸"} {vue === "stories" && "Mes Stories ðŸ“¸"} {vue === "portefeuille-profil" && "Mon Portefeuille et Mon Profil"} {vue === "portefeuille" && "Portefeuille"} {vue === "solde" && "Solde"} {vue === "profil" && "Modifier mon profil"} {vue === "localisations" && "Mes Localisations"} {vue === "reference" && "RÃ©fÃ©rence"} {vue === "assistance" && "Assistance et LÃ©gal"} {vue === "tutoriel" && "Tutoriel et Guide VidÃ©o"} {vue === "faq" && "Centre d'aide FAQ"} {vue === "confidentialite" && "ConfidentialitÃ©"} {vue === "publications" && "Produits PubliÃ©s"}</p>
        </div>
        <div style={{ marginTop: 10 }}>
          {vue === "commandes" && <div style={{ background: "white", borderRadius: 14, padding: 14 }}><p style={{ fontWeight: 900 }}>Aucune commande</p></div>}
          {vue === "favoris" && <div style={{ background: "white", borderRadius: 14, padding: 14 }}><p style={{ fontWeight: 900 }}>â¤ï¸ Aucun favori</p></div>}
          {vue === "stories" && <div style={{ background: "white", borderRadius: 14, padding: 14, textAlign: "center" }}><p style={{ fontSize: 36 }}>ðŸ“¸</p><p style={{ fontWeight: 900 }}>Mes Stories</p></div>}
          {vue === "portefeuille-profil" && <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><button onClick={() => setVue("portefeuille")} style={{ background: "white", borderRadius: 12, padding: 14, border: "none", textAlign: "left", width: "100%", fontWeight: 900 }}>ðŸ’¼ Portefeuille â€º</button><button onClick={() => setVue("solde")} style={{ background: "white", borderRadius: 12, padding: 14, border: "none", textAlign: "left", width: "100%", fontWeight: 900 }}>ðŸ’° Solde : {solde} F â€º</button><button onClick={() => setVue("profil")} style={{ background: "white", borderRadius: 12, padding: 14, border: "none", textAlign: "left", width: "100%", fontWeight: 900 }}>ðŸ‘¤ Modifier mon profil â€º</button><button onClick={() => setVue("localisations")} style={{ background: "white", borderRadius: 12, padding: 14, border: "none", textAlign: "left", width: "100%", fontWeight: 900 }}>ðŸ“ Mes Localisations â€º</button></div>}
          {vue === "portefeuille" && <div style={{ background: "black", color: "white", borderRadius: 16, padding: 18, textAlign: "center" }}><p style={{ fontSize: 11, opacity: 0.7, margin: 0 }}>PORTEFEUILLE MM MALI</p><p style={{ fontSize: 30, fontWeight: 900, margin: "8px 0" }}>{solde.toLocaleString()} F</p><button onClick={() => setVue("solde")} style={{ background: "#FF6B35", color: "white", border: "none", padding: "10px 20px", borderRadius: 999, fontWeight: "bold" }}>+ DÃ©pÃ´t</button></div>}
          {vue === "solde" && <div style={{ background: "white", borderRadius: 16, padding: 16 }}><p style={{ fontWeight: 900, textAlign: "center" }}>Ton Solde : {solde.toLocaleString()} F</p><input value={montant} onChange={(e) => setMontant(e.target.value)} type="number" placeholder="Ex: 10000" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #eee", boxSizing: "border-box" }} /><button onClick={() => { if (Number(montant) >= 5000) { setSolde(solde + Number(montant)); setMontant(""); alert("DÃ©pÃ´t rÃ©ussi"); } else alert("Minimum 5000 F"); }} style={{ width: "100%", background: "black", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: "bold", marginTop: 10 }}>Faire un dÃ©pÃ´t</button></div>}
          {vue === "profil" && <div style={{ background: "white", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Email : {profil.email}</p>
            <input value={profil.nom} onChange={(e) => setProfil({ ...profil, nom: e.target.value, full_name: e.target.value })} placeholder="Nom complet" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
            <input value={profil.telephone} onChange={(e) => setProfil({ ...profil, telephone: e.target.value, whatsapp: e.target.value, phone: e.target.value })} placeholder="WhatsApp / TÃ©lÃ©phone" style={{ padding: 12, borderRadius: 12, border: "2px solid #25D366" }} />
            <input value={profil.boutique_nom} onChange={(e) => setProfil({ ...profil, boutique_nom: e.target.value })} placeholder="Nom de ta boutique" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
            <button onClick={async () => { await supabase.from("profiles").upsert({ id: user.id, nom: profil.nom, telephone: profil.telephone, whatsapp: profil.telephone, ville: profil.ville, quartier: profil.quartier, email: profil.email, boutique_nom: profil.boutique_nom, role: "vendeur" }, { onConflict: "id" }); alert("Profil sauvegardÃ©"); }} style={{ background: "black", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: "bold" }}>Enregistrer</button>
          </div>}
          {vue === "localisations" && <div style={{ background: "white", borderRadius: 14, padding: 14 }}><p style={{ fontWeight: 900 }}>ðŸ“ Mes Localisations</p><p style={{ fontSize: 12, color: "#888" }}>{profil.ville}, {profil.quartier}</p></div>}
          {vue === "reference" && <div style={{ background: "white", borderRadius: 16, padding: 16 }}><p style={{ fontWeight: 900 }}>ðŸ“– RÃ©fÃ©rence - Guide Local en Bambara</p><p style={{ fontSize: 12 }}>I bÉ› se ka feere san MM Mali kan.</p></div>}
          {vue === "assistance" && <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><button onClick={() => setVue("tutoriel")} style={{ background: "white", borderRadius: 12, padding: 14, border: "none", textAlign: "left", width: "100%", fontWeight: 900 }}>ðŸŽ¥ Tutoriel et Guide VidÃ©o â€º</button><button onClick={() => setVue("faq")} style={{ background: "white", borderRadius: 12, padding: 14, border: "none", textAlign: "left", width: "100%", fontWeight: 900 }}>â“ Centre d'aide FAQ â€º</button><button onClick={() => setVue("confidentialite")} style={{ background: "white", borderRadius: 12, padding: 14, border: "none", textAlign: "left", width: "100%", fontWeight: 900 }}>ðŸ”’ ConfidentialitÃ© â€º</button></div>}
          {vue === "tutoriel" && <div style={{ background: "white", borderRadius: 16, padding: 14 }}><p style={{ fontWeight: 900 }}>ðŸŽ¥ Tutoriel</p><div style={{ background: "#111", borderRadius: 12, height: 170, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 36 }}>â–¶ï¸</div></div>}
          {vue === "faq" && <div style={{ background: "white", borderRadius: 16, padding: 14 }}><p style={{ fontWeight: 900 }}>â“ FAQ</p><p style={{ fontSize: 12 }}>Comment publier ? Va sur Compte â†’ Publier.</p></div>}
          {vue === "confidentialite" && <div style={{ background: "white", borderRadius: 16, padding: 16 }}><p style={{ fontWeight: 900 }}>ðŸ”’ ConfidentialitÃ©</p><p style={{ fontSize: 13, lineHeight: 1.6 }}>Tes donnÃ©es sont protÃ©gÃ©es.</p></div>}
          {vue === "publications" && <div>
            <button onClick={() => { setPubForm({ titre: "", prix: "", categorie: "Ã‰lectronique", mode_produit: "Ã‰lectronique", ville: "Bamako", whatsapp: profil.whatsapp || "", description: "", image_url: "", video_url: "", anonyme: true }); setShowPub(true); }} style={{ width: "100%", background: "black", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: "bold" }}>+ Publier un produit</button>
            <p style={{ fontSize: 11, color: "#888", margin: "8px 0 0" }}>{produits.length} produits publiÃ©s</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              {produits.map((p) => (
                <div key={p.id} style={{ background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                  <div style={{ position: "relative" }}>
                    {p.image_url ? <img src={p.image_url} loading="lazy" style={{ width: "100%", height: 120, objectFit: "cover" }} /> : <div style={{ width: "100%", height: 120, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>ðŸŽ¬ VidÃ©o</div>}
                    <span style={{ position: "absolute", top: 6, left: 6, background: "#FF6B35", color: "white", fontSize: 9, padding: "3px 7px", borderRadius: 999, fontWeight: "bold" }}>{p.mode_produit || p.categorie || "Ã‰lectronique"}</span>
                  </div>
                  <div style={{ padding: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: "bold", margin: 0 }}>{p.titre}</p>
                    <p style={{ fontSize: 12, fontWeight: 900, margin: "3px 0" }}>{Number(p.prix).toLocaleString()} F</p>
                    <p style={{ fontSize: 10, color: "#25D366", fontWeight: "bold", margin: 0 }}>ðŸ“± {p.whatsapp}</p>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button onClick={() => ouvrirModifier(p)} style={{ flex: 1, background: "#FFF1E8", color: "#FF6B35", border: "none", padding: "7px 0", borderRadius: 999, fontSize: 11, fontWeight: "bold" }}>âœï¸ Modifier</button>
                      <button onClick={() => supprimerProduit(p.id, p.titre)} style={{ flex: 1, background: "#FFE8E8", color: "red", border: "none", padding: "7px 0", borderRadius: 999, fontSize: 11, fontWeight: "bold" }}>ðŸ—‘ï¸ Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {produits.length === 0 && <div style={{ background: "white", borderRadius: 12, padding: 18, textAlign: "center", marginTop: 10 }}><p style={{ fontWeight: 900 }}>Aucun produit publiÃ©</p></div>}
          </div>}
        </div>
        {showPub && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}><div style={{ background: "white", width: "100%", maxWidth: 430, borderRadius: "22px 22px 0 0", padding: 16, paddingBottom: 40, maxHeight: "92vh", overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontWeight: 900 }}>Publier un produit</p><button onClick={() => setShowPub(false)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none" }}>X</button></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            <input value={pubForm.titre} onChange={(e) => setPubForm({ ...pubForm, titre: e.target.value })} placeholder="Titre Ex: iPhone 13" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
            <input value={pubForm.prix} onChange={(e) => setPubForm({ ...pubForm, prix: e.target.value })} type="number" placeholder="Prix Ex: 15000" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
            <select value={pubForm.mode_produit} onChange={(e) => setPubForm({ ...pubForm, mode_produit: e.target.value, categorie: e.target.value })} style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", fontWeight: "bold", background: "white" }}>{MODES.map((m) => <option key={m} value={m}>{m}</option>)}</select>
            <input value={pubForm.whatsapp} onChange={(e) => setPubForm({ ...pubForm, whatsapp: e.target.value })} placeholder="WhatsApp Ex: 98 19 60 47" style={{ padding: 12, borderRadius: 12, border: "2px solid #25D366", fontWeight: "bold" }} />
            <label style={{ border: "2px dashed #ddd", borderRadius: 12, padding: 12, textAlign: "center", display: "block" }}>{pubForm.image_url ? <img src={pubForm.image_url} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }} /> : "ðŸ“¸ Choisir Photo *"}<input type="file" accept="image/*" onChange={(e) => upload(e, "image")} style={{ display: "none" }} /></label>
            <label style={{ border: "2px dashed #ddd", borderRadius: 12, padding: 12, textAlign: "center", display: "block" }}>{pubForm.video_url ? <video src={pubForm.video_url} style={{ width: "100%", height: 120 }} controls /> : "ðŸŽ¬ Choisir VidÃ©o"}<input type="file" accept="video/*" onChange={(e) => upload(e, "video")} style={{ display: "none" }} /></label>
            <textarea value={pubForm.description} onChange={(e) => setPubForm({ ...pubForm, description: e.target.value })} placeholder="Description..." style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", height: 60 }} />
            <button onClick={savePub} style={{ background: "black", color: "white", border: "none", padding: "14px 0", borderRadius: 999, fontWeight: "bold" }}>Publier pour tout le monde â†’</button>
            <div style={{ height: 20 }}></div>
          </div>
        </div></div>}
        {showEdit && editProduit && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}><div style={{ background: "white", width: "100%", maxWidth: 430, borderRadius: "22px 22px 0 0", padding: 16, paddingBottom: 40, maxHeight: "92vh", overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontWeight: 900 }}>âœï¸ Modifier</p><button onClick={() => setShowEdit(false)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none" }}>X</button></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            <input value={editForm.titre} onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })} placeholder="Titre" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
            <input value={editForm.prix} onChange={(e) => setEditForm({ ...editForm, prix: e.target.value })} type="number" placeholder="Prix" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
            <select value={editForm.mode_produit} onChange={(e) => setEditForm({ ...editForm, mode_produit: e.target.value })} style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", fontWeight: "bold", background: "white" }}>{MODES.map((m) => <option key={m} value={m}>{m}</option>)}</select>
            <input value={editForm.whatsapp} onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })} placeholder="WhatsApp" style={{ padding: 12, borderRadius: 12, border: "2px solid #25D366", fontWeight: "bold" }} />
            <label style={{ border: "2px dashed #ddd", borderRadius: 12, padding: 12, textAlign: "center", display: "block" }}>{editForm.image_url ? <img src={editForm.image_url} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }} /> : "ðŸ“¸ Changer Photo"}<input type="file" accept="image/*" onChange={(e) => upload(e, "image", true)} style={{ display: "none" }} /></label>
            <label style={{ border: "2px dashed #FF6B35", borderRadius: 12, padding: 12, textAlign: "center", display: "block", background: "#FFF9F5" }}>
              {editForm.video_url ? <video src={editForm.video_url} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }} controls /> : "ðŸŽ¬ Changer VidÃ©o / Ajouter une vidÃ©o"}
              <input type="file" accept="video/*" onChange={(e) => upload(e, "video", true)} style={{ display: "none" }} />
            </label>
            <button type="button" onClick={() => setEditForm({ ...editForm, video_url: "" })} style={{ background: "#FFE8E8", color: "red", border: "none", padding: "8px 0", borderRadius: 999, fontSize: 11, fontWeight: "bold" }}>ðŸ—‘ï¸ Enlever la vidÃ©o</button>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", height: 60 }} />
            <button onClick={sauvegarderModification} style={{ background: "black", color: "white", border: "none", padding: "14px 0", borderRadius: 999, fontWeight: "bold" }}>Enregistrer âœ…</button>
            <button onClick={() => supprimerProduit(editProduit.id, editProduit.titre)} style={{ background: "#FFE8E8", color: "red", border: "none", padding: "12px 0", borderRadius: 999, fontWeight: "bold" }}>ðŸ—‘ï¸ Supprimer</button>
          </div>
        </div></div>}
      </div>
    );
  }

  return (
    <div style={{ background: "#FFF9F5", minHeight: "100vh", padding: "10px 10px 90px" }}>
      {/* âœ… CORRIGÃ‰ : Maintenant on affiche nomAffiche / whatsappAffiche / lettre */}
      <div style={{ background: "white", borderRadius: 14, padding: "12px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 48, height: 48, background: "#FF6B35", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20, fontWeight: 900 }}>
          {lettre}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 900, fontSize: 15, margin: 0 }}>{nomAffiche}</p>
          <p style={{ fontSize: 11, color: "#25D366", fontWeight: "bold", margin: "2px 0 0" }}>ðŸ“± {whatsappAffiche}</p>
          <p style={{ fontSize: 11, color: "#888", margin: "1px 0 0" }}>ðŸ“ {profil.ville || "Bamako"} â€¢ {profil.email || user?.email || ""}</p>
          <p style={{ fontSize: 11, color: "#888", margin: "1px 0 0" }}>â­ {profil.role || "vendeur"} {profil.nom && profil.boutique_nom && profil.nom !== profil.boutique_nom ? `â€¢ ðŸ‘¤ ${profil.nom}` : ""}</p>
          <span style={{ background: "#E6FFED", color: "green", fontSize: 9, padding: "2px 7px", borderRadius: 999, fontWeight: "bold" }}>âœ“ COMPTE VÃ‰RIFIÃ‰</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <span style={{ background: "#FFF1E8", padding: "5px 9px", borderRadius: 999, fontSize: 12, fontWeight: "bold" }}>{solde} F</span>
          <button onClick={seDeconnecter} style={{ background: "#FFE8E8", color: "red", border: "none", padding: "5px 10px", borderRadius: 999, fontSize: 10, fontWeight: "bold" }}>DÃ©connexion</button>
        </div>
      </div>
      <button onClick={() => setVue("publications")} style={{ width: "100%", background: "#FF6B35", color: "white", border: "none", borderRadius: 12, padding: "11px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}><span style={{ fontWeight: 900, fontSize: 13 }}>ðŸª CrÃ©er ma Boutique PRO</span><span>â†’</span></button>
      <div style={{ background: "white", borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <div><p style={{ fontWeight: "bold", fontSize: 12, margin: 0 }}>ðŸ“¸ Publier un produit</p><p style={{ fontSize: 11, color: "#888", margin: "1px 0 0" }}>Photo + VidÃ©o + WhatsApp â€¢ Anonyme</p></div>
        <button onClick={() => setVue("publications")} style={{ background: "black", color: "white", border: "none", padding: "8px 15px", borderRadius: 999, fontSize: 12, fontWeight: "bold", flexShrink: 0 }}>+ Publier</button>
      </div>
      <p style={{ fontSize: 10, fontWeight: 900, color: "#999", margin: "12px 0 6px" }}>MON ACTIVITÃ‰</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <button onClick={() => setVue("commandes")} style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 12, padding: "10px 8px", textAlign: "left" }}><span style={{ fontSize: 18 }}>ðŸ“¦</span><p style={{ fontSize: 11, fontWeight: "bold", margin: "4px 0 0" }}>Mes Commandes</p></button>
        <button onClick={() => setVue("favoris")} style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 12, padding: "10px 8px", textAlign: "left" }}><span style={{ fontSize: 18 }}>â¤ï¸</span><p style={{ fontSize: 11, fontWeight: "bold", margin: "4px 0 0" }}>Mes Favoris</p></button>
        <button onClick={() => setVue("stories")} style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 12, padding: "10px 8px", textAlign: "left" }}><span style={{ fontSize: 18 }}>ðŸ“¸</span><p style={{ fontSize: 11, fontWeight: "bold", margin: "4px 0 0" }}>Mes Stories</p></button>
      </div>
      <p style={{ fontSize: 10, fontWeight: 900, color: "#999", margin: "12px 0 6px" }}>MON PORTEFEUILLE ET MON PROFIL</p>
      <button onClick={() => setVue("portefeuille-profil")} style={{ width: "100%", background: "white", border: "1px solid #f0f0f0", borderRadius: 12, padding: "11px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: "bold", fontSize: 12 }}>ðŸ’¼ Mon Portefeuille et Mon Profil</span><span>â€º</span></button>
      <p style={{ fontSize: 10, fontWeight: 900, color: "#999", margin: "12px 0 6px" }}>RÃ‰FÃ‰RENCE</p>
      <button onClick={() => setVue("reference")} style={{ width: "100%", background: "white", border: "1px solid #f0f0f0", borderRadius: 12, padding: "11px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: "bold", fontSize: 12 }}>ðŸ“– RÃ©fÃ©rence - Guide en Bambara</span><span>â€º</span></button>
      <p style={{ fontSize: 10, fontWeight: 900, color: "#999", margin: "12px 0 6px" }}>ASSISTANCE ET LÃ‰GAL</p>
      <button onClick={() => setVue("assistance")} style={{ width: "100%", background: "white", border: "1px solid #f0f0f0", borderRadius: 12, padding: "11px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: "bold", fontSize: 12 }}>ðŸ›Ÿ Assistance et LÃ©gal</span><span>â€º</span></button>
    </div>
  );
}
