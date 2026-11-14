"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type CartItem = {
  id: string;
  titre: string;
  prix: number;
  qty: number;
  image_url: string;
  whatsapp: string;
  ville: string;
  quartier: string;
  mode_produit: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null;

  const id = value.id;
  const prix = Number(value.prix);
  const qty = Number(value.qty ?? 1);

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    !Number.isFinite(prix) ||
    prix < 0 ||
    !Number.isFinite(qty) ||
    qty < 1
  ) {
    return null;
  }

  return {
    id: String(id),
    titre: String(value.titre ?? value.nom ?? "Produit sans nom"),
    prix,
    qty: Math.floor(qty),
    image_url: String(value.image_url ?? value.photo_url ?? ""),
    whatsapp: String(value.whatsapp ?? value.contact_whatsapp ?? ""),
    ville: String(value.ville ?? "Bamako"),
    quartier: String(value.quartier ?? ""),
    mode_produit: String(value.mode_produit ?? value.etat ?? "Neuf"),
  };
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);

    const values = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.items)
        ? parsed.items
        : [];

    return values
      .map(normalizeCartItem)
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

function formatFCFA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} F`;
}

function whatsappUrl(phone: string, message: string): string | null {
  let number = phone.replace(/\D/g, "");

  if (number.startsWith("00223")) {
    number = number.slice(2);
  }

  if (!number.startsWith("223")) {
    number = `223${number}`;
  }

  if (number.length < 11 || number.length > 15) {
    return null;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default function Panier() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [showCommande, setShowCommande] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [nom, setNom] = useState("");
  const [phone, setPhone] = useState("");
  const [quartier, setQuartier] = useState("");
  const [ville, setVille] = useState("Bamako");
  const [commandeOk, setCommandeOk] = useState(false);

  // Chargement du vrai panier enregistré sur le téléphone.
  useEffect(() => {
    const saved =
      localStorage.getItem("panier") ??
      localStorage.getItem("mmmali_cart");

    setItems(parseCart(saved));
    setLoaded(true);
  }, []);

  // Sauvegarde uniquement après le chargement initial.
  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem("panier", JSON.stringify(items));
  }, [items, loaded]);

  const totalProduits = useMemo(
    () => items.reduce((sum, item) => sum + item.prix * item.qty, 0),
    [items]
  );

  // Tarif provisoire à adapter à la politique de livraison de MM Mali.
  const livraison = items.length > 0 ? 1500 : 0;
  const total = totalProduits + livraison;

  // Regroupement des produits par fournisseur.
  const fournisseurs = useMemo(() => {
    const map = new Map<string, CartItem>();

    items.forEach((item) => {
      const key = item.whatsapp || `sans-numero-${item.id}`;

      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    return Array.from(map.values());
  }, [items]);

  function getMessageWhatsApp(): string {
    let message = "Bonjour MM Mali, je souhaite commander :\n\n";

    items.forEach((item, index) => {
      message += `${index + 1}. ${item.titre} - ${formatFCFA(item.prix)} x ${item.qty} = ${formatFCFA(item.prix * item.qty)}\n`;
      message += `Fournisseur WhatsApp : ${item.whatsapp || "Non indiqué"} - Ville : ${item.ville}\n\n`;
    });

    message += `Sous-total : ${formatFCFA(totalProduits)}\n`;
    message += `Livraison : ${formatFCFA(livraison)}\n`;
    message += `Total : ${formatFCFA(total)}\n\n`;
    message += `Mon nom : ${nom || "Client"}\n`;
    message += `Mon téléphone : ${phone || "Non indiqué"}\n`;
    message += `Mon adresse : ${quartier}, ${ville}`;

    return message;
  }

  function ouvrirWhatsAppFournisseur(): void {
    if (items.length === 0) {
      alert("Ton panier est vide.");
      return;
    }

    const premierFournisseur = items.find((item) => item.whatsapp.trim());

    if (!premierFournisseur) {
      alert("Aucun numéro WhatsApp de fournisseur n'est renseigné.");
      return;
    }

    const url = whatsappUrl(
      premierFournisseur.whatsapp,
      getMessageWhatsApp()
    );

    if (!url) {
      alert("Le numéro WhatsApp du fournisseur semble invalide.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function ouvrirWhatsAppIndividuel(item: CartItem): void {
    if (!item.whatsapp.trim()) {
      alert("Le fournisseur n'a pas renseigné son numéro WhatsApp.");
      return;
    }

    const message =
      `Bonjour, je souhaite commander ${item.titre}.\n` +
      `Quantité : ${item.qty}\n` +
      `Prix : ${formatFCFA(item.prix * item.qty)}`;

    const url = whatsappUrl(item.whatsapp, message);

    if (!url) {
      alert("Le numéro WhatsApp du fournisseur semble invalide.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function modifierQuantite(id: string, changement: number): void {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, qty: Math.max(1, item.qty + changement) }
          : item
      )
    );
  }

  function supprimerProduit(id: string): void {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }

  function confirmerInformations(): void {
    if (!nom.trim() || !phone.trim() || !quartier.trim()) {
      alert("Renseigne ton nom, ton téléphone et ton quartier.");
      return;
    }

    setCommandeOk(true);
  }

  function fermerCommande(): void {
    setShowCommande(false);
    setCommandeOk(false);
  }

  if (!loaded) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        Chargement du panier...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFF9F5",
        minHeight: "100vh",
        padding: 14,
        paddingBottom: 100,
      }}
    >
      <h1 style={{ fontWeight: 900, fontSize: 20, margin: "6px 0 16px" }}>
        Mon Panier 🛒 ({items.length})
      </h1>

      {items.length === 0 ? (
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 30,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 40 }}>🛒</p>
          <p style={{ fontWeight: 900 }}>Panier vide</p>
          <p style={{ fontSize: 12, color: "#888" }}>
            Va sur Accueil et ajoute un produit à ton panier.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "black",
              color: "white",
              padding: "11px 22px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: "bold",
              textDecoration: "none",
              marginTop: 10,
            }}
          >
            Aller sur Accueil →
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 12,
                  display: "flex",
                  gap: 10,
                }}
              >
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.titre}
                    width={70}
                    height={70}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 12,
                      objectFit: "cover",
                      background: "#f0f0f0",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 12,
                      background: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    📦
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: "bold",
                      fontSize: 13,
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.titre}
                  </p>

                  <p
                    style={{
                      fontWeight: 900,
                      fontSize: 13,
                      margin: "4px 0",
                    }}
                  >
                    {formatFCFA(item.prix)}
                  </p>

                  <p
                    style={{
                      fontSize: 10,
                      color: "#25D366",
                      fontWeight: "bold",
                      margin: "0 0 4px",
                    }}
                  >
                    📱 Fournisseur : {item.whatsapp || "Non indiqué"}
                  </p>

                  <p style={{ fontSize: 10, color: "#888", margin: 0 }}>
                    📍 {item.ville} • {item.mode_produit}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 6,
                    }}
                  >
                    <button
                      type="button"
                      aria-label={`Diminuer la quantité de ${item.titre}`}
                      onClick={() => modifierQuantite(item.id, -1)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: "1px solid #eee",
                        background: "white",
                      }}
                    >
                      -
                    </button>

                    <span style={{ fontWeight: "bold" }}>{item.qty}</span>

                    <button
                      type="button"
                      aria-label={`Augmenter la quantité de ${item.titre}`}
                      onClick={() => modifierQuantite(item.id, 1)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: "none",
                        background: "black",
                        color: "white",
                      }}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => supprimerProduit(item.id)}
                      style={{
                        marginLeft: "auto",
                        background: "none",
                        border: "none",
                        color: "red",
                        fontSize: 12,
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 14,
              marginTop: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span>Sous-total</span>
              <b>{formatFCFA(totalProduits)}</b>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              <span>Livraison</span>
              <b>{formatFCFA(livraison)}</b>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 15,
                marginTop: 10,
                borderTop: "1px dashed #eee",
                paddingTop: 10,
              }}
            >
              <span style={{ fontWeight: 900 }}>Total</span>
              <b style={{ color: "#FF6B35" }}>{formatFCFA(total)}</b>
            </div>

            <button
              type="button"
              onClick={() => setShowCommande(true)}
              style={{
                width: "100%",
                background: "black",
                color: "white",
                border: "none",
                padding: "14px 0",
                borderRadius: 999,
                fontWeight: "bold",
                marginTop: 12,
              }}
            >
              Commander maintenant →
            </button>

            <button
              type="button"
              onClick={() => setShowWhatsApp(true)}
              style={{
                width: "100%",
                background: "#25D366",
                color: "white",
                border: "none",
                padding: "13px 0",
                borderRadius: 999,
                fontWeight: "bold",
                marginTop: 8,
              }}
            >
              Commander sur WhatsApp 💬
            </button>
          </div>
        </>
      )}

      {/* Fenêtre de commande */}
      {showCommande && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 80,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              background: "white",
              width: "100%",
              borderRadius: "22px 22px 0 0",
              padding: 18,
              maxHeight: "92vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>
                Commander maintenant 📦
              </p>

              <button
                type="button"
                onClick={fermerCommande}
                aria-label="Fermer"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "none",
                  background: "#f0f0f0",
                }}
              >
                X
              </button>
            </div>

            {!commandeOk ? (
              <>
                <p style={{ fontSize: 12, color: "#888", margin: "8px 0 0" }}>
                  Vérifie les informations des fournisseurs et renseigne ton
                  adresse de livraison.
                </p>

                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#999",
                    margin: "16px 0 8px",
                  }}
                >
                  FOURNISSEURS
                </p>

                {fournisseurs.map((fournisseur, index) => (
                  <div
                    key={fournisseur.whatsapp || fournisseur.id}
                    style={{
                      background: "#FFF9F5",
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 10,
                      border: "1px solid #FFE8D9",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          background: "#888",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                        }}
                      >
                        🏪
                      </div>

                      <div>
                        <p
                          style={{
                            fontWeight: 900,
                            fontSize: 13,
                            margin: 0,
                          }}
                        >
                          Fournisseur {index + 1}
                        </p>
                        <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                          {fournisseur.titre}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        lineHeight: 1.7,
                      }}
                    >
                      <p style={{ margin: 0 }}>
                        📍 <b>Ville :</b> {fournisseur.ville}
                      </p>
                      <p style={{ margin: 0 }}>
                        🏠 <b>Adresse détaillée :</b>{" "}
                        {fournisseur.quartier || "Non renseignée"}
                      </p>
                      <p style={{ margin: 0 }}>
                        📱 <b>WhatsApp :</b>{" "}
                        <span style={{ color: "#25D366", fontWeight: "bold" }}>
                          {fournisseur.whatsapp || "Non indiqué"}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => ouvrirWhatsAppIndividuel(fournisseur)}
                      style={{
                        width: "100%",
                        display: "block",
                        background: "#25D366",
                        color: "white",
                        border: "none",
                        padding: "10px 0",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: "bold",
                        marginTop: 10,
                      }}
                    >
                      💬 Contacter ce fournisseur
                    </button>
                  </div>
                ))}

                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#999",
                    margin: "16px 0 8px",
                  }}
                >
                  TON ADRESSE DE LIVRAISON
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ton nom complet *"
                    autoComplete="name"
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #eee",
                    }}
                  />

                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ton téléphone *"
                    type="tel"
                    autoComplete="tel"
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #eee",
                    }}
                  />

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={quartier}
                      onChange={(e) => setQuartier(e.target.value)}
                      placeholder="Ton quartier *"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #eee",
                      }}
                    />

                    <select
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #eee",
                      }}
                    >
                      <option>Bamako</option>
                      <option>Kayes</option>
                      <option>Sikasso</option>
                      <option>Ségou</option>
                      <option>Mopti</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    background: "#FFF9F5",
                    borderRadius: 12,
                    padding: 12,
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span>Total estimé</span>
                    <b style={{ color: "#FF6B35" }}>
                      {formatFCFA(total)}
                    </b>
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      color: "#888",
                      margin: "6px 0 0",
                    }}
                  >
                    Le paiement et la livraison seront à confirmer avec le
                    fournisseur.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={confirmerInformations}
                  style={{
                    width: "100%",
                    background: "black",
                    color: "white",
                    border: "none",
                    padding: "15px 0",
                    borderRadius: 999,
                    fontWeight: "bold",
                    marginTop: 14,
                  }}
                >
                  Vérifier mes informations →
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: 50 }}>✅</p>

                <p style={{ fontWeight: 900, fontSize: 17 }}>
                  Informations enregistrées !
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: "#888",
                    lineHeight: 1.6,
                  }}
                >
                  Merci {nom}. Tes informations sont prêtes. Contacte le
                  fournisseur pour confirmer la commande et la livraison.
                  <br />
                  Livraison souhaitée : {quartier}, {ville}
                  <br />
                  Total estimé : {formatFCFA(total)}
                </p>

                <button
                  type="button"
                  onClick={ouvrirWhatsAppFournisseur}
                  style={{
                    width: "100%",
                    background: "#25D366",
                    color: "white",
                    border: "none",
                    padding: "13px 20px",
                    borderRadius: 999,
                    fontWeight: "bold",
                    marginTop: 12,
                  }}
                >
                  Contacter le fournisseur sur WhatsApp
                </button>

                <button
                  type="button"
                  onClick={fermerCommande}
                  style={{
                    background: "white",
                    color: "#555",
                    border: "1px solid #eee",
                    padding: "12px 24px",
                    borderRadius: 999,
                    fontWeight: "bold",
                    marginTop: 10,
                  }}
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fenêtre WhatsApp */}
      {showWhatsApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 80,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              background: "white",
              width: "100%",
              borderRadius: "22px 22px 0 0",
              padding: 18,
              maxHeight: "92vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>
                Commander sur WhatsApp 💬
              </p>

              <button
                type="button"
                onClick={() => setShowWhatsApp(false)}
                aria-label="Fermer"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "none",
                  background: "#f0f0f0",
                }}
              >
                X
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#888", margin: "8px 0 0" }}>
              Choisis le fournisseur que tu souhaites contacter.
            </p>

            {fournisseurs.map((fournisseur) => {
              const url = whatsappUrl(
                fournisseur.whatsapp,
                getMessageWhatsApp()
              );

              return (
                <div
                  key={fournisseur.whatsapp || fournisseur.id}
                  style={{
                    background: "#E6FFED",
                    borderRadius: 14,
                    padding: 14,
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: "#25D366",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 20,
                    }}
                  >
                    💬
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: 900,
                        fontSize: 13,
                        margin: 0,
                      }}
                    >
                      {fournisseur.titre}
                    </p>

                    <p style={{ fontSize: 12, margin: "2px 0 0" }}>
                      📱 {fournisseur.whatsapp || "Numéro non renseigné"}
                    </p>

                    <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                      📍 {fournisseur.ville}
                    </p>
                  </div>

                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#25D366",
                        color: "white",
                        padding: "10px 16px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: "bold",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Ouvrir ↗️
                    </a>
                  ) : (
                    <span style={{ fontSize: 11, color: "#888" }}>
                      Indisponible
                    </span>
                  )}
                </div>
              );
            })}

            <div
              style={{
                background: "#FFF9F5",
                borderRadius: 12,
                padding: 12,
                marginTop: 12,
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 900, margin: 0 }}>
                Message qui sera envoyé :
              </p>

              <p
                style={{
                  fontSize: 11,
                  color: "#555",
                  whiteSpace: "pre-wrap",
                  margin: "6px 0 0",
                  lineHeight: 1.5,
                }}
              >
                {getMessageWhatsApp()}
              </p>
            </div>

            <button
              type="button"
              onClick={ouvrirWhatsAppFournisseur}
              style={{
                width: "100%",
                background: "#25D366",
                color: "white",
                border: "none",
                padding: "15px 0",
                borderRadius: 999,
                fontWeight: "bold",
                marginTop: 14,
              }}
            >
              💬 Ouvrir WhatsApp du fournisseur →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}