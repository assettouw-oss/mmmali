"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Panier() {
  const [items, setItems] = useState<any[]>([]);
  const [showCommande, setShowCommande] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [nom, setNom] = useState("");
  const [phone, setPhone] = useState("");
  const [quartier, setQuartier] = useState("");
  const [ville, setVille] = useState("Bamako");
  const [commandeOk, setCommandeOk] = useState(false);

  // CHARGE LE VRAI PANIER - depuis localStorage + depuis Supabase
  useEffect(() => {
    async function load() {
      // 1. Panier sauvegardé sur le téléphone
      const saved = localStorage.getItem("panier");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) { setItems(parsed); return; }
      }
      // 2. Si panier vide, on montre les vrais produits de Supabase pour tester
      const { data } = await supabase.from("produits").select("*").order("created_at", { ascending: false }).limit(4);
      if (data && data.length > 0) {
        const mapped = data.slice(0, 2).map((p: any) => ({ ...p, qty: 1 }));
        setItems(mapped);
      }
    }
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem("panier", JSON.stringify(items));
  }, [items]);

  const totalProduits = items.reduce((s, it) => s + Number(it.prix) * it.qty, 0);
  const livraison = items.length > 0 ? 1500 : 0;
  const total = totalProduits + livraison;

  // MESSAGE WHATSAPP AVEC TOUS LES PRODUITS + ADRESSES FOURNISSEURS
  function getMessageWhatsApp() {
    let msg = `Bonjour MM Mali, je veux commander :\n\n`;
    items.forEach((it, i) => {
      msg += `${i + 1}. ${it.titre} - ${Number(it.prix).toLocaleString()} F x ${it.qty} = ${(Number(it.prix) * it.qty).toLocaleString()} F\n`;
      msg += `   Fournisseur WhatsApp: ${it.whatsapp || "Non indiqué"} - Ville: ${it.ville || "Bamako"}\n\n`;
    });
    msg += `Sous-total: ${totalProduits.toLocaleString()} F\nLivraison: ${livraison.toLocaleString()} F\nTotal: ${total.toLocaleString()} F\n\n`;
    msg += `Mon nom: ${nom || "Client"}\nMon téléphone: ${phone || "Non indiqué"}\nMon adresse: ${quartier}, ${ville}`;
    return encodeURIComponent(msg);
  }

  // COMMANDER SUR WHATSAPP - OUVRE DIRECTEMENT WHATSAPP DU FOURNISSEUR
  function commanderWhatsApp() {
    if (items.length === 0) return alert("Panier vide");
    // On prend le WhatsApp du PREMIER fournisseur
    const premierFournisseur = items[0].whatsapp || "98196047";
    const waClean = String(premierFournisseur).replace(/\s/g, "").replace(/^\+223/, "").replace(/^223/, "");
    // On ouvre WhatsApp directement avec le numéro du fournisseur + le message
    window.open(`https://wa.me/223${waClean}?text=${getMessageWhatsApp()}`, "_blank");
  }

  // FOURNISSEURS UNIQUES - pour afficher leurs adresses
  const fournisseurs = Array.from(new Map(items.map((it) => [it.whatsapp, it])).values());

  return (
    <div style={{ background: "#FFF9F5", minHeight: "100vh", padding: 14, paddingBottom: 100 }}>
      <h1 style={{ fontWeight: 900, fontSize: 20, margin: "6px 0" }}>Mon Panier 🛒 ({items.length})</h1>

      {items.length === 0 ? (
        <div style={{ background: "white", borderRadius: 16, padding: 30, textAlign: "center" }}>
          <p style={{ fontSize: 40 }}>🛒</p>
          <p style={{ fontWeight: 900 }}>Panier vide</p>
          <p style={{ fontSize: 12, color: "#888" }}>Va sur Accueil et ajoute un produit</p>
          <Link href="/" style={{ display: "inline-block", background: "black", color: "white", padding: "11px 22px", borderRadius: 999, fontSize: 12, fontWeight: "bold", textDecoration: "none", marginTop: 10 }}>Aller sur Accueil →</Link>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((it) => (
              <div key={it.id} style={{ background: "white", borderRadius: 16, padding: 12, display: "flex", gap: 10 }}>
                <img src={it.image_url} style={{ width: 70, height: 70, borderRadius: 12, objectFit: "cover", background: "#f0f0f0" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "bold", fontSize: 13, margin: 0, lineHeight: 1.3 }}>{it.titre}</p>
                  <p style={{ fontWeight: 900, fontSize: 13, margin: "4px 0" }}>{Number(it.prix).toLocaleString()} F</p>
                  <p style={{ fontSize: 10, color: "#25D366", fontWeight: "bold", margin: "0 0 4px" }}>📱 Fournisseur: {it.whatsapp || "Non indiqué"}</p>
                  <p style={{ fontSize: 10, color: "#888", margin: 0 }}>📍 {it.ville || "Bamako"} • {it.mode_produit || "Neuf"}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <button onClick={() => setItems(items.map((x) => x.id === it.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid #eee", background: "white" }}>-</button>
                    <span style={{ fontWeight: "bold" }}>{it.qty}</span>
                    <button onClick={() => setItems(items.map((x) => x.id === it.id ? { ...x, qty: x.qty + 1 } : x))} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "black", color: "white" }}>+</button>
                    <button onClick={() => setItems(items.filter((x) => x.id !== it.id))} style={{ marginLeft: "auto", background: "none", border: "none", color: "red", fontSize: 12 }}>Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 16, padding: 14, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>Sous-total</span><b>{totalProduits.toLocaleString()} F</b></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8 }}><span>Livraison</span><b>{livraison.toLocaleString()} F</b></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginTop: 10, borderTop: "1px dashed #eee", paddingTop: 10 }}><span style={{ fontWeight: 900 }}>Total</span><b style={{ color: "#FF6B35" }}>{total.toLocaleString()} F</b></div>

            {/* BOUTON 1 : COMMANDER MAINTENANT -> OUVRE ADRESSE FOURNISSEUR */}
            <button onClick={() => setShowCommande(true)} style={{ width: "100%", background: "black", color: "white", border: "none", padding: "14px 0", borderRadius: 999, fontWeight: "bold", marginTop: 12 }}>Commander maintenant →</button>

            {/* BOUTON 2 : COMMANDER SUR WHATSAPP -> OUVRE WHATSAPP FOURNISSEUR */}
            <button onClick={() => setShowWhatsApp(true)} style={{ width: "100%", background: "#25D366", color: "white", border: "none", padding: "13px 0", borderRadius: 999, fontWeight: "bold", marginTop: 8 }}>Commander sur WhatsApp 💬</button>
          </div>
        </>
      )}

      {/* FENETRE 1 : COMMANDER MAINTENANT -> ADRESSE DU FOURNISSEUR */}
      {showCommande && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 80, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "white", width: "100%", borderRadius: "22px 22px 0 0", padding: 18, maxHeight: "92vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>Commander maintenant 📦</p>
              <button onClick={() => setShowCommande(false)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#f0f0f0" }}>X</button>
            </div>

            {!commandeOk ? (
              <>
                <p style={{ fontSize: 12, color: "#888", margin: "8px 0 0" }}>Voici l'adresse de ton fournisseur. Vérifie et confirme ta commande.</p>

                {/* ADRESSE DU FOURNISSEUR */}
                <p style={{ fontSize: 11, fontWeight: 900, color: "#999", margin: "16px 0 8px" }}>ADRESSE DU FOURNISSEUR</p>
                {fournisseurs.map((f: any, i) => (
                  <div key={i} style={{ background: "#FFF9F5", borderRadius: 14, padding: 12, marginBottom: 10, border: "1px solid #FFE8D9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 36, height: 36, background: "#888", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>🕶️</div>
                      <div><p style={{ fontWeight: 900, fontSize: 13, margin: 0 }}>Vendeur Anonyme - Fournisseur {i + 1}</p><p style={{ fontSize: 11, color: "#888", margin: 0 }}>{f.titre}</p></div>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7 }}>
                      <p style={{ margin: 0 }}>📍 <b>Ville :</b> {f.ville || "Bamako"}</p>
                      <p style={{ margin: 0 }}>🏠 <b>Quartier / Adresse :</b> {f.quartier || f.ville || "Bamako - Quartier non précisé, appelle le fournisseur"}</p>
                      <p style={{ margin: 0 }}>📱 <b>WhatsApp Fournisseur :</b> <span style={{ color: "#25D366", fontWeight: "bold" }}>{f.whatsapp || "Non indiqué"}</span></p>
                      <p style={{ margin: 0 }}>📦 <b>Produit :</b> {f.titre} - {Number(f.prix).toLocaleString()} F x {f.qty}</p>
                    </div>
                    <a href={`https://wa.me/223${String(f.whatsapp || "").replace(/\s/g, "")}?text=${encodeURIComponent(`Bonjour, je veux commander: ${f.titre}`)}`} target="_blank" style={{ display: "block", background: "#25D366", color: "white", textAlign: "center", padding: "10px 0", borderRadius: 999, fontSize: 12, fontWeight: "bold", textDecoration: "none", marginTop: 10 }}>💬 Appeler ce fournisseur sur WhatsApp</a>
                  </div>
                ))}

                {/* TON ADRESSE DE LIVRAISON */}
                <p style={{ fontSize: 11, fontWeight: 900, color: "#999", margin: "16px 0 8px" }}>TON ADRESSE DE LIVRAISON</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ton nom complet *" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ton téléphone *" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Ton quartier *" style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #eee" }} />
                    <select value={ville} onChange={(e) => setVille(e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #eee" }}><option>Bamako</option><option>Kayes</option><option>Sikasso</option><option>Segou</option><option>Mopti</option></select>
                  </div>
                </div>

                <div style={{ background: "#FFF9F5", borderRadius: 12, padding: 12, marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>Total à payer</span><b style={{ color: "#FF6B35" }}>{total.toLocaleString()} F</b></div>
                  <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>Paiement à la livraison • Orange Money • Wave</p>
                </div>

                <button onClick={() => { if (!nom || !phone || !quartier) return alert("Mets ton nom, téléphone et quartier"); setCommandeOk(true); }} style={{ width: "100%", background: "black", color: "white", border: "none", padding: "15px 0", borderRadius: 999, fontWeight: "bold", marginTop: 14 }}>Confirmer ma commande →</button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: 50 }}>✅</p>
                <p style={{ fontWeight: 900, fontSize: 17 }}>Commande confirmée !</p>
                <p style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>Merci {nom}. Le fournisseur va t'appeler sur {phone}.<br />Livraison à {quartier}, {ville} - {total.toLocaleString()} F</p>
                <button onClick={() => { setShowCommande(false); setCommandeOk(false); setItems([]); localStorage.removeItem("panier"); }} style={{ background: "black", color: "white", border: "none", padding: "13px 24px", borderRadius: 999, fontWeight: "bold", marginTop: 12 }}>Fermer</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FENETRE 2 : COMMANDER SUR WHATSAPP -> NUMERO DU FOURNISSEUR DIRECTEMENT SUR WHATSAPP */}
      {showWhatsApp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 80, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "white", width: "100%", borderRadius: "22px 22px 0 0", padding: 18, maxHeight: "92vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>Commander sur WhatsApp 💬</p>
              <button onClick={() => setShowWhatsApp(false)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#f0f0f0" }}>X</button>
            </div>
            <p style={{ fontSize: 12, color: "#888", margin: "8px 0 0" }}>Clique sur le fournisseur pour ouvrir WhatsApp directement avec son numéro.</p>

            {fournisseurs.map((f: any, i) => {
              const waClean = String(f.whatsapp || "").replace(/\s/g, "").replace(/^\+223/, "").replace(/^223/, "");
              return (
                <div key={i} style={{ background: "#E6FFED", borderRadius: 14, padding: 14, marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 44, height: 44, background: "#25D366", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20 }}>💬</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 900, fontSize: 13, margin: 0 }}>{f.titre}</p>
                    <p style={{ fontSize: 12, margin: "2px 0 0" }}>📱 Fournisseur : <b>{f.whatsapp}</b></p>
                    <p style={{ fontSize: 11, color: "#888", margin: 0 }}>📍 {f.ville || "Bamako"} • {Number(f.prix).toLocaleString()} F x {f.qty}</p>
                  </div>
                  <a href={`https://wa.me/223${waClean}?text=${getMessageWhatsApp()}`} target="_blank" style={{ background: "#25D366", color: "white", padding: "10px 16px", borderRadius: 999, fontSize: 12, fontWeight: "bold", textDecoration: "none", whiteSpace: "nowrap" }}>Ouvrir ↗</a>
                </div>
              );
            })}

            <div style={{ background: "#FFF9F5", borderRadius: 12, padding: 12, marginTop: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 900, margin: 0 }}>Message qui sera envoyé :</p>
              <p style={{ fontSize: 11, color: "#555", whiteSpace: "pre-wrap", margin: "6px 0 0", lineHeight: 1.5 }}>{decodeURIComponent(getMessageWhatsApp())}</p>
            </div>

            <button onClick={commanderWhatsApp} style={{ width: "100%", background: "#25D366", color: "white", border: "none", padding: "15px 0", borderRadius: 999, fontWeight: "bold", marginTop: 14 }}>💬 Ouvrir WhatsApp du fournisseur →</button>
            <p style={{ fontSize: 11, color: "#888", textAlign: "center", margin: "8px 0 0" }}>Ça ouvre WhatsApp directement avec le numéro du fournisseur</p>
          </div>
        </div>
      )}
    </div>
  );
}