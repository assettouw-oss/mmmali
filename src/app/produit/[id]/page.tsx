"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProductRecord = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  categorie: string | null;
  etat: string | null;
  vendeur_nom: string | null;
  ville: string | null;
  contact_whatsapp: string | null;
  statut: string;
};

type ProductImageRecord = {
  chemin: string;
  position: number;
};

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

function getCart(): CartItem[] {
  try {
    const saved =
      localStorage.getItem("panier") ??
      localStorage.getItem("mmmali_cart");

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "qty" in item
    );
  } catch {
    return [];
  }
}

function getWhatsAppUrl(phone: string, message: string): string | null {
  let number = phone.replace(/\D/g, "");

  if (number.startsWith("00223")) {
    number = number.slice(2);
  }

  if (number.startsWith("223")) {
    number = number.slice(3);
  }

  if (number.length !== 8) {
    return null;
  }

  return `https://wa.me/223${number}?text=${encodeURIComponent(message)}`;
}

export default function ProduitDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("statut", "publie")
        .single();

      if (cancelled) return;

      if (error || !data) {
        setProduct(null);
        setLoading(false);
        return;
      }

      const productData = data as unknown as ProductRecord;
      setProduct(productData);

      const { data: imagesData } = await supabase
        .from("product_images")
        .select("chemin, position")
        .eq("product_id", id)
        .order("position", { ascending: true });

      if (cancelled) return;

      const images = (imagesData ?? []) as ProductImageRecord[];
      const firstImage = images[0];

      if (firstImage?.chemin) {
        const path = firstImage.chemin;

        const publicUrl = path.startsWith("http")
          ? path
          : supabase.storage.from("produits").getPublicUrl(path).data
              .publicUrl;

        setImageUrl(publicUrl);
      }

      setLoading(false);
    }

    if (id) {
      loadProduct();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  function ajouterAuPanier(): void {
    if (!product) return;

    setAdding(true);

    const cart = getCart();

    const existing = cart.find((item) => item.id === product.id);

    const productItem: CartItem = {
      id: product.id,
      titre: product.nom,
      prix: Number(product.prix),
      qty: 1,
      image_url: imageUrl,
      whatsapp: product.contact_whatsapp ?? "",
      ville: product.ville ?? "Bamako",
      quartier: "",
      mode_produit: product.etat ?? "Neuf",
    };

    let updatedCart: CartItem[];

    if (existing) {
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, qty: item.qty + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, productItem];
    }

    localStorage.setItem("panier", JSON.stringify(updatedCart));

    setMessage("Produit ajouté au panier avec succès !");
    setAdding(false);
  }

  if (loading) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        Chargement du produit...
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <p style={{ fontWeight: 900 }}>Produit introuvable</p>

        <Link
          href="/"
          style={{ color: "#FF6B35", fontWeight: "bold" }}
        >
          ← Retour Accueil
        </Link>
      </div>
    );
  }

  const whatsappUrl = product.contact_whatsapp
    ? getWhatsAppUrl(
        product.contact_whatsapp,
        `Bonjour, je suis intéressé par votre produit : ${product.nom} - ${Number(product.prix).toLocaleString("fr-FR")} FCFA`
      )
    : null;

  return (
    <div
      style={{
        background: "white",
        minHeight: "100vh",
        paddingBottom: 180,
      }}
    >
      {/* Retour */}
      <div style={{ padding: 12 }}>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "black",
            fontWeight: "bold",
            fontSize: 13,
            background: "#FFF1E8",
            padding: "8px 14px",
            borderRadius: 999,
          }}
        >
          ← Retour
        </Link>
      </div>

      {/* Photo du produit */}
      <div style={{ padding: "0 12px" }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.nom}
            width={900}
            height={700}
            unoptimized
            priority
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 420,
              borderRadius: 18,
              objectFit: "cover",
              background: "#f0f0f0",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 280,
              borderRadius: 18,
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 55,
            }}
          >
            📦
          </div>
        )}
      </div>

      {/* Informations vendeur */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 14px 0",
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
            fontSize: 16,
          }}
        >
          🏪
        </div>

        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 13, margin: 0 }}>
            {product.vendeur_nom || "Vendeur MM Mali"}
          </p>

          <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
            📍 {product.ville || "Bamako"} •{" "}
            {product.categorie || "Autre"}
          </p>
        </div>

        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            background: "#E6FFED",
            color: "green",
            padding: "4px 8px",
            borderRadius: 999,
            fontWeight: "bold",
          }}
        >
          Disponible
        </span>
      </div>

      {/* Nom, prix et description */}
      <div style={{ padding: 14 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 900,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {product.nom}
        </h1>

        <p
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#FF6B35",
            margin: "10px 0 0",
          }}
        >
          {Number(product.prix).toLocaleString("fr-FR")} FCFA
        </p>

        <p
          style={{
            fontSize: 13,
            color: "#333",
            lineHeight: 1.6,
            marginTop: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {product.description || "Aucune description disponible."}
        </p>

        {/* Détails */}
        <div
          style={{
            background: "#F9F9F9",
            borderRadius: 14,
            padding: 12,
            marginTop: 14,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 900, margin: 0 }}>
            📋 Détails du produit
          </p>

          <p style={{ fontSize: 12, color: "#555", margin: "8px 0 0" }}>
            • Catégorie : {product.categorie || "Non précisée"}
          </p>

          <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>
            • État : {product.etat || "Non précisé"}
          </p>

          <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>
            • Ville : {product.ville || "Bamako"}
          </p>

          <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>
            • Livraison : à confirmer avec le vendeur
          </p>
        </div>

        {message && (
          <div
            role="status"
            style={{
              background: "#E6FFED",
              color: "#16803D",
              borderRadius: 12,
              padding: 12,
              marginTop: 14,
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {message}
            <Link
              href="/panier"
              style={{
                display: "block",
                color: "#16803D",
                marginTop: 6,
              }}
            >
              Voir mon panier →
            </Link>
          </div>
        )}
      </div>

      {/* Barre d'achat fixe */}
      <div
        style={{
          position: "fixed",
          bottom: 78,
          left: 0,
          right: 0,
          zIndex: 60,
          padding: "0 12px",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            background: "white",
            borderRadius: 18,
            padding: 12,
            boxShadow: "0 -2px 20px rgba(0,0,0,0.12)",
            border: "1px solid #eee",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div>
              <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                Prix du produit
              </p>

              <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>
                {Number(product.prix).toLocaleString("fr-FR")} FCFA
              </p>
            </div>

            <p
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: "#25D366",
                margin: 0,
              }}
            >
              📱 {product.contact_whatsapp || "Contact non renseigné"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={ajouterAuPanier}
              disabled={adding}
              style={{
                flex: 1,
                background: "black",
                color: "white",
                border: "none",
                padding: "14px 0",
                borderRadius: 999,
                fontWeight: "bold",
                fontSize: 13,
                opacity: adding ? 0.6 : 1,
              }}
            >
              {adding ? "Ajout..." : "🛒 Ajouter au panier"}
            </button>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1.2,
                  background: "#25D366",
                  color: "white",
                  textAlign: "center",
                  padding: "14px 0",
                  borderRadius: 999,
                  fontWeight: "bold",
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                💬 WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                style={{
                  flex: 1.2,
                  background: "#ddd",
                  color: "#777",
                  border: "none",
                  padding: "14px 0",
                  borderRadius: 999,
                  fontWeight: "bold",
                  fontSize: 13,
                }}
              >
                WhatsApp indisponible
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}