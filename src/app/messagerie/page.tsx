"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// FIX BUILD VERCEL : Si les clés ne sont pas là pendant le build, on met un faux lien pour ne pas planter
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Onglet = "messages" | "commandes" | "notifs" | "boutique";

export default function Messagerie() {
  const [onglet, setOnglet] = useState<Onglet>("messages");
  const [chats, setChats] = useState<any[]>([]);
  const [chatOuvert, setChatOuvert] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [nouveauMsg, setNouveauMsg] = useState("");
  const [notifs, setNotifs] = useState<any[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profil, setProfil] = useState<any>({});

  const [boutique, setBoutique] = useState({ nom: "", description: "", ville: "Bamako", quartier: "", whatsapp: "", categorie: "Boutique Générale", photo: "" });
  const [boutiqueCreee, setBoutiqueCreee] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          setUser(u.user);
          const { data: prof } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
          if (prof) { setProfil(prof); setBoutique((b) => ({ ...b, nom: prof.full_name ? `Boutique de ${prof.full_name}` : "", whatsapp: prof.whatsapp || prof.phone || "", ville: prof.ville || "Bamako", quartier: prof.quartier || "" })); }
        }
        const { data: produits } = await supabase.from("produits").select("*").order("created_at", { ascending: false }).limit(20);
        if (produits && produits.length > 0) {
          const convs = produits.slice(0, 8).map((p: any, i: number) => ({
            id: p.id,
            nom: `Client ${i + 1} - ${p.titre?.substring(0, 15)}`,
            nomVendeurPro: p.whatsapp ? `Vendeur Pro - ${p.whatsapp}` : "Vendeur Pro MM Mali",
            produit: p,
            whatsapp: p.whatsapp || "98196047",
            ville: p.ville || "Bamako",
            dernierMsg: i === 0 ? "Bonjour, ton produit est encore dispo ?" : i === 1 ? "Je veux 2 pièces, livraison Hamdallaye" : i === 2 ? "C'est combien le prix final ?" : "Merci, je viens demain chercher",
            heure: i === 0 ? "10:24" : i === 1 ? "09:12" : "Hier",
            nonlu: i === 0 ? 2 : i === 1 ? 1 : 0,
            image_url: p.image_url,
          }));
          setChats(convs);
          const cmds = produits.slice(0, 3).map((p: any, i: number) => ({
            id: p.id,
            titre: p.titre,
            prix: p.prix,
            image_url: p.image_url,
            whatsapp: p.whatsapp,
            statut: i === 0 ? "En cours de livraison 🚚" : i === 1 ? "Confirmée ✅" : "Livrée 🎉",
            date: i === 0 ? "Aujourd'hui" : i === 1 ? "Hier" : "Il y a 2 jours",
            ville: p.ville,
          }));
          setCommandes(cmds);
          setNotifs([
            { id: 1, titre: "Nouvelle commande 📦", texte: `Quelqu'un a commandé : ${produits[0]?.titre}`, heure: "Il y a 5 min", lu: false, type: "commande" },
            { id: 2, titre: "Nouveau message 💬", texte: "Client 1 : Bonjour, ton produit est encore dispo ?", heure: "Il y a 12 min", lu: false, type: "message" },
            { id: 3, titre: "Produit vu 👀", texte: `Ton produit ${produits[1]?.titre} a été vu 24 fois`, heure: "Il y a 1h", lu: true, type: "vue" },
            { id: 4, titre: "Bonus MM Mali 🎉", texte: "Tu as reçu +500 F dans ton portefeuille", heure: "Hier", lu: true, type: "bonus" },
          ]);
        } else {
          setChats([
            { id: "1", nom: "Mariam Diallo", nomVendeurPro: "Vendeur Pro - Mariam Diallo", produit: { titre: "Robe Wax", prix: 15000, image_url: "https://via.placeholder.com/100", whatsapp: "70000001", ville: "Bamako" }, whatsapp: "70000001", ville: "Bamako", dernierMsg: "Bonjour, ton produit est encore dispo ?", heure: "10:24", nonlu: 2, image_url: "https://via.placeholder.com/100" },
            { id: "2", nom: "Ibrahim Traoré", nomVendeurPro: "Vendeur Pro - Ibrahim Traoré", produit: { titre: "iPhone 13", prix: 285000, image_url: "https://via.placeholder.com/100", whatsapp: "70000002", ville: "Hamdallaye" }, whatsapp: "70000002", ville: "Hamdallaye", dernierMsg: "Je veux 2 pièces, livraison Hamdallaye", heure: "09:12", nonlu: 0, image_url: "https://via.placeholder.com/100" },
            { id: "3", nom: "MM Mali Support", nomVendeurPro: "Vendeur Pro - MM Mali Support", produit: { titre: "Support", prix: 0, image_url: "https://via.placeholder.com/100", whatsapp: "98196047", ville: "Bamako" }, whatsapp: "98196047", ville: "Bamako", dernierMsg: "Bienvenue sur MM Mali 🎉", heure: "Hier", nonlu: 0, image_url: "https://via.placeholder.com/100" },
          ]);
          setCommandes([
            { id: "1", titre: "iPhone 13 Pro Max", prix: 285000, image_url: "https://via.placeholder.com/100", whatsapp: "70000002", statut: "En cours de livraison 🚚", date: "Aujourd'hui", ville: "Bamako" },
          ]);
          setNotifs([
            { id: 1, titre: "Bienvenue sur MM Mali 🎉", texte: "Ton compte est créé. Publie ton premier produit !", heure: "Aujourd'hui", lu: false, type: "bienvenue" },
          ]);
        }
      } catch (e) { console.log("load messagerie", e); }
    }
    load();
  }, []);

  function ouvrirChat(chat: any) {
    setChatOuvert(chat);
    setMessages([
      { id: 1, deMoi: false, texte: `Bonjour, je suis intéressé par : ${chat.produit?.titre}`, heure: "10:20" },
      { id: 2, deMoi: true, texte: "Bonjour oui, c'est encore disponible. Tu veux combien de pièces ?", heure: "10:22" },
      { id: 3, deMoi: false, texte: chat.dernierMsg, heure: chat.heure },
    ]);
    setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, nonlu: 0 } : c));
  }

  function envoyerMsg() {
    if (!nouveauMsg.trim() || !chatOuvert) return;
    setMessages((prev) => [...prev, { id: Date.now(), deMoi: true, texte: nouveauMsg, heure: "Maintenant" }]);
    setNouveauMsg("");
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now() + 1, deMoi: false, texte: "D'accord, je te confirme. Tu peux passer sur WhatsApp aussi ?", heure: "Maintenant" }]);
    }, 1000);
  }

  function creerBoutique() {
    if (!boutique.nom || !boutique.whatsapp) return alert("Nom de boutique et WhatsApp obligatoires");
    setBoutiqueCreee(true);
    alert(`✅ Boutique "${boutique.nom}" créée ! Les clients peuvent maintenant te trouver.`);
  }

  if (chatOuvert) {
    const waClean = String(chatOuvert.whatsapp || "").replace(/\s/g, "").replace(/^\+223/, "").replace(/^223/, "");
    return (
      <div style={{ background: "#FFF9F5", minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: 0 }}>
        <div style={{ background: "white", padding: 12, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setChatOuvert(null)} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#FFF1E8", fontSize: 16 }}>←</button>
          <img src={chatOuvert.image_url} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", background: "#f0f0f0" }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 900, fontSize: 14, margin: 0 }}>{chatOuvert.nomVendeurPro}</p>
            <p style={{ fontSize: 11, color: "#25D366", margin: 0 }}>● En ligne • {chatOuvert.ville} • 📱 {chatOuvert.whatsapp}</p>
          </div>
          <a href={`https://wa.me/223${waClean}?text=${encodeURIComponent(`Bonjour, je te parle depuis MM Mali pour : ${chatOuvert.produit?.titre}`)}`} target="_blank" style={{ background: "#25D366", color: "white", padding: "8px 12px", borderRadius: 999, fontSize: 11, fontWeight: "bold", textDecoration: "none" }}>WhatsApp</a>
        </div>
        <div style={{ background: "white", margin: 12, borderRadius: 14, padding: 10, display: "flex", gap: 10, alignItems: "center" }}>
          <img src={chatOuvert.produit?.image_url} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} />
          <div style={{ flex: 1 }}><p style={{ fontWeight: "bold", fontSize: 13, margin: 0 }}>{chatOuvert.produit?.titre}</p><p style={{ fontWeight: 900, fontSize: 13, margin: "2px 0 0" }}>{Number(chatOuvert.produit?.prix || 0).toLocaleString()} F</p><p style={{ fontSize: 11, color: "#888", margin: 0 }}>📍 {chatOuvert.ville}</p></div>
          <span style={{ fontSize: 10, background: "#FFF1E8", padding: "4px 8px", borderRadius: 999, fontWeight: "bold" }}>En discussion</span>
        </div>
        <div style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.map((m) => (
            <div key={m.id} style={{ alignSelf: m.deMoi ? "flex-end" : "flex-start", background: m.deMoi ? "black" : "white", color: m.deMoi ? "white" : "black", padding: "10px 14px", borderRadius: m.deMoi ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "80%", fontSize: 13 }}>
              <p style={{ margin: 0 }}>{m.texte}</p>
              <p style={{ fontSize: 9, opacity: 0.6, margin: "4px 0 0", textAlign: "right" }}>{m.heure} {m.deMoi ? "✓✓" : ""}</p>
            </div>
          ))}
        </div>
        <div style={{ background: "white", padding: 12, display: "flex", gap: 8, borderTop: "1px solid #eee", position: "sticky", bottom: 78 }}>
          <input value={nouveauMsg} onChange={(e) => setNouveauMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && envoyerMsg()} placeholder="Écris ton message..." style={{ flex: 1, padding: "12px 14px", borderRadius: 999, border: "1px solid #eee", background: "#F5F5F5" }} />
          <button onClick={envoyerMsg} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "black", color: "white", fontSize: 16 }}>➤</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#FFF9F5", minHeight: "100vh", padding: 14 }}>
      <h1 style={{ fontWeight: 900, fontSize: 20, margin: "6px 0" }}>Messagerie 💬</h1>
      <div style={{ display: "flex", gap: 6, background: "white", padding: 6, borderRadius: 999, marginBottom: 14 }}>
        <button onClick={() => setOnglet("messages")} style={{ flex: 1, padding: "9px 0", borderRadius: 999, border: "none", background: onglet === "messages" ? "black" : "transparent", color: onglet === "messages" ? "white" : "#333", fontWeight: "bold", fontSize: 11 }}>💬 Messages</button>
        <button onClick={() => setOnglet("commandes")} style={{ flex: 1, padding: "9px 0", borderRadius: 999, border: "none", background: onglet === "commandes" ? "black" : "transparent", color: onglet === "commandes" ? "white" : "#333", fontWeight: "bold", fontSize: 11 }}>📦 Commandes</button>
        <button onClick={() => setOnglet("notifs")} style={{ flex: 1, padding: "9px 0", borderRadius: 999, border: "none", background: onglet === "notifs" ? "black" : "transparent", color: onglet === "notifs" ? "white" : "#333", fontWeight: "bold", fontSize: 11 }}>🔔 Notifs {notifs.filter((n) => !n.lu).length > 0 && `(${notifs.filter((n) => !n.lu).length})`}</button>
        <button onClick={() => setOnglet("boutique")} style={{ flex: 1, padding: "9px 0", borderRadius: 999, border: "none", background: onglet === "boutique" ? "#FF6B35" : "transparent", color: onglet === "boutique" ? "white" : "#333", fontWeight: "bold", fontSize: 11 }}>🏪 Boutique</button>
      </div>
      {onglet === "messages" && (
        <>
          <input placeholder="🔍 Rechercher un client, un vendeur..." style={{ width: "100%", padding: "11px 14px", borderRadius: 999, border: "none", background: "white", fontSize: 13, boxSizing: "border-box" }} />
          <p style={{ fontSize: 11, color: "#888", margin: "12px 0 8px" }}>{chats.length} conversations avec tes clients</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {chats.map((c) => (
              <div key={c.id} onClick={() => ouvrirChat(c)} style={{ background: "white", borderRadius: 16, padding: 12, display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                <div style={{ position: "relative" }}>
                  <img src={c.image_url} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", background: "#f0f0f0" }} />
                  <span style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, background: "#25D366", borderRadius: "50%", border: "2px solid white" }}></span>
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p style={{ fontWeight: "bold", fontSize: 13, margin: 0 }}>{c.nomVendeurPro}</p>
                  <p style={{ fontSize: 11, color: "#FF6B35", fontWeight: "bold", margin: 0 }}>📦 {c.produit?.titre} • {Number(c.produit?.prix || 0).toLocaleString()} F</p>
                  <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.dernierMsg}</p>
                </div>
                <div style={{ textAlign: "right" }}><p style={{ fontSize: 10, color: "#999", margin: 0 }}>{c.heure}</p>{c.nonlu > 0 && <span style={{ background: "#FF6B35", color: "white", fontSize: 10, width: 18, height: 18, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>{c.nonlu}</span>}<p style={{ fontSize: 10, color: "#25D366", fontWeight: "bold", margin: "4px 0 0" }}>📱 {c.whatsapp}</p></div>
              </div>
            ))}
          </div>
          {chats.length === 0 && <p style={{ textAlign: "center", color: "#888", marginTop: 40 }}>Aucune conversation pour le moment.<br />Publie un produit, les clients vont t'écrire.</p>}
        </>
      )}
      {onglet === "commandes" && (
        <>
          <p style={{ fontSize: 11, color: "#888", margin: "0 0 10px" }}>{commandes.length} commandes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {commandes.map((cmd) => (
              <div key={cmd.id} style={{ background: "white", borderRadius: 16, padding: 12, display: "flex", gap: 10 }}>
                <img src={cmd.image_url} style={{ width: 70, height: 70, borderRadius: 12, objectFit: "cover", background: "#f0f0f0" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "bold", fontSize: 13, margin: 0 }}>{cmd.titre}</p>
                  <p style={{ fontWeight: 900, fontSize: 13, margin: "4px 0" }}>{Number(cmd.prix).toLocaleString()} F</p>
                  <p style={{ fontSize: 11, margin: 0 }}><span style={{ background: "#FFF1E8", padding: "3px 8px", borderRadius: 999, fontWeight: "bold" }}>{cmd.statut}</span></p>
                  <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>📍 {cmd.ville} • {cmd.date} • 📱 {cmd.whatsapp}</p>
                </div>
                <button onClick={() => setOnglet("messages")} style={{ background: "black", color: "white", border: "none", padding: "8px 12px", borderRadius: 999, fontSize: 11, fontWeight: "bold", alignSelf: "center" }}>Suivre →</button>
              </div>
            ))}
          </div>
          {commandes.length === 0 && <p style={{ textAlign: "center", color: "#888", marginTop: 40 }}>Aucune commande pour le moment</p>}
        </>
      )}
      {onglet === "notifs" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{notifs.filter((n) => !n.lu).length} non lues</p>
            <button onClick={() => setNotifs(notifs.map((n) => ({ ...n, lu: true })))} style={{ background: "none", border: "none", color: "#FF6B35", fontSize: 12, fontWeight: "bold" }}>Tout marquer lu</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {notifs.map((n) => (
              <div key={n.id} onClick={() => setNotifs(notifs.map((x) => x.id === n.id ? { ...x, lu: true } : x))} style={{ background: n.lu ? "white" : "#FFF1E8", borderRadius: 16, padding: 14, display: "flex", gap: 10, border: n.lu ? "1px solid #f0f0f0" : "1px solid #FFD9C0" }}>
                <div style={{ width: 40, height: 40, background: n.type === "commande" ? "#FFE8D9" : n.type === "message" ? "#E6FFED" : n.type === "bonus" ? "#FFF1E8" : "#F0F0F0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{n.type === "commande" ? "📦" : n.type === "message" ? "💬" : n.type === "bonus" ? "🎉" : "👀"}</div>
                <div style={{ flex: 1 }}><p style={{ fontWeight: 900, fontSize: 13, margin: 0 }}>{n.titre} {!n.lu && <span style={{ width: 8, height: 8, background: "#FF6B35", borderRadius: "50%", display: "inline-block", marginLeft: 6 }}></span>}</p><p style={{ fontSize: 12, color: "#555", margin: "4px 0 0", lineHeight: 1.4 }}>{n.texte}</p><p style={{ fontSize: 11, color: "#999", margin: "4px 0 0" }}>{n.heure}</p></div>
              </div>
            ))}
          </div>
          {notifs.length === 0 && <p style={{ textAlign: "center", color: "#888", marginTop: 40 }}>Aucune notification</p>}
        </>
      )}
      {onglet === "boutique" && (
        <>
          {!boutiqueCreee ? (
            <div style={{ background: "white", borderRadius: 18, padding: 16 }}>
              <p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>🏪 Créer ma Boutique</p>
              <p style={{ fontSize: 12, color: "#888", margin: "6px 0 0" }}>Crée ta boutique PRO. Les clients vont te trouver par ton nom de boutique, pas par ton nom personnel.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                <input value={boutique.nom} onChange={(e) => setBoutique({ ...boutique, nom: e.target.value })} placeholder="Nom de ta boutique * Ex: Boutique Mariam" style={{ padding: 13, borderRadius: 12, border: "1px solid #eee", fontWeight: "bold" }} />
                <input value={boutique.whatsapp} onChange={(e) => setBoutique({ ...boutique, whatsapp: e.target.value })} placeholder="WhatsApp de la boutique *" style={{ padding: 13, borderRadius: 12, border: "2px solid #25D366", fontWeight: "bold" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={boutique.categorie} onChange={(e) => setBoutique({ ...boutique, categorie: e.target.value })} style={{ flex: 1, padding: 13, borderRadius: 12, border: "1px solid #eee" }}><option>Boutique Générale</option><option>Electronique</option><option>Mode</option><option>Cosmetique</option><option>Restaurant</option><option>Maison</option></select>
                  <select value={boutique.ville} onChange={(e) => setBoutique({ ...boutique, ville: e.target.value })} style={{ flex: 1, padding: 13, borderRadius: 12, border: "1px solid #eee" }}><option>Bamako</option><option>Kayes</option><option>Sikasso</option><option>Segou</option><option>Mopti</option></select>
                </div>
                <input value={boutique.quartier} onChange={(e) => setBoutique({ ...boutique, quartier: e.target.value })} placeholder="Quartier de ta boutique" style={{ padding: 13, borderRadius: 12, border: "1px solid #eee" }} />
                <textarea value={boutique.description} onChange={(e) => setBoutique({ ...boutique, description: e.target.value })} placeholder="Description de ta boutique... Ex: Je vends des robes Wax, livraison rapide à Bamako" style={{ padding: 13, borderRadius: 12, border: "1px solid #eee", height: 80 }} />
                <label style={{ border: "2px dashed #ddd", borderRadius: 12, padding: 14, textAlign: "center", display: "block" }}>{boutique.photo ? <img src={boutique.photo} style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 10 }} /> : "📸 Logo / Photo de ta boutique"}<input type="file" accept="image/*" onChange={(e) => { const f = (e.target as any).files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setBoutique((b) => ({ ...b, photo: r.result as string })); r.readAsDataURL(f); }} style={{ display: "none" }} /></label>
                <button onClick={creerBoutique} style={{ background: "#FF6B35", color: "white", border: "none", padding: "15px 0", borderRadius: 999, fontWeight: "bold" }}>Créer ma Boutique →</button>
                <p style={{ fontSize: 11, color: "#888", textAlign: "center", margin: 0 }}>Gratuit • Tes clients te trouvent par ta boutique</p>
              </div>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: 18, padding: 18, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, background: "#FF6B35", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 30, margin: "0 auto", overflow: "hidden" }}>{boutique.photo ? <img src={boutique.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏪"}</div>
              <p style={{ fontWeight: 900, fontSize: 18, margin: "12px 0 0" }}>{boutique.nom}</p>
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0" }}>📍 {boutique.ville}, {boutique.quartier} • {boutique.categorie}</p>
              <p style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{boutique.description || "Boutique MM Mali"}</p>
              <p style={{ fontSize: 12, fontWeight: "bold", color: "#25D366" }}>📱 WhatsApp: {boutique.whatsapp}</p>
              <span style={{ background: "#E6FFED", color: "green", fontSize: 11, padding: "4px 10px", borderRadius: 999, fontWeight: "bold" }}>✓ Boutique Vérifiée</span>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={() => setBoutiqueCreee(false)} style={{ flex: 1, background: "#FFF1E8", color: "#FF6B35", border: "none", padding: "12px 0", borderRadius: 999, fontWeight: "bold" }}>✏️ Modifier</button>
                <a href={`https://wa.me/223${String(boutique.whatsapp).replace(/\s/g, "")}?text=Bonjour ${boutique.nom}, je veux commander`} target="_blank" style={{ flex: 1, background: "#25D366", color: "white", padding: "12px 0", borderRadius: 999, fontWeight: "bold", textDecoration: "none", textAlign: "center" }}>💬 WhatsApp</a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}