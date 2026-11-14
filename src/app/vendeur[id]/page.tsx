"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profil = {
  id: string;
  nom: string | null;
  telephone: string | null;
  ville: string | null;
};

type Produit = {
  id: string;
  nom: string;
  prix: number;
  categorie: string;
  description: string | null;
  ville: string | null;
  vendeur_nom: string | null;
  contact_whatsapp: string | null;
  created_at: string;
};

type ImageProduit = {
  product_id: string;
  chemin: string;
  position: number;
};

type ProduitBoutique = Produit & {
  imageUrl: string | null;
};

export default function VendeurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [profile, setProfile] = useState<Profil | null>(null);
  const [produits, setProduits] = useState<ProduitBoutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let actif = true;

    async function loadBoutique() {
      try {
        setLoading(true);
        setErreur("");

        const { data: profilData, error: profilError } = await supabase
          .from("profiles")
          .select("id, nom, telephone, ville")
          .eq("id", id)
          .maybeSingle();

        if (profilError) throw profilError;

        if (!actif) return;

        if (profilData) {
          setProfile(profilData as Profil);
        } else {
          setProfile(null);
        }

        const { data: produitsData, error: produitsError } = await supabase
          .from("products")
          .select(
            "id, nom, prix, categorie, description, ville, vendeur_nom, contact_whatsapp, created_at"
          )
          .eq("vendeur_id", id)
          .eq("statut", "publie")
          .order("created_at", { ascending: false });

        if (produitsError) throw produitsError;

        const listeProduits = (produitsData ?? []) as Produit[];

        if (listeProduits.length === 0) {
          if (actif) setProduits([]);
          return;
        }

        const productIds = listeProduits.map((produit) => produit.id);

        const { data: imagesData, error: imagesError } = await supabase
          .from("product_images")
          .select("product_id, chemin, position")
          .in("product_id", productIds)
          .order("position", { ascending: false });

        if (imagesError) throw imagesError;

        const images = (imagesData ?? []) as ImageProduit[];

        const imagesParProduit = new Map<string, string>();

        for (const image of images) {
          if (!imagesParProduit.has(image.product_id)) {
            const url = image.chemin.startsWith("http")
              ? image.chemin
              : supabase.storage
                  .from("produits")
                  .getPublicUrl(image.chemin).data.publicUrl;

            imagesParProduit.set(image.product_id, url);
          }
        }

        const produitsAvecImages: ProduitBoutique[] = listeProduits.map(
          (produit) => ({
            ...produit,
            imageUrl: imagesParProduit.get(produit.id) ?? null,
          })
        );

        if (actif) {
          setProduits(produitsAvecImages);
        }
      } catch (error) {
        console.error("Erreur chargement boutique :", error);

        if (actif) {
          setErreur("Impossible de charger cette boutique pour le moment.");
        }
      } finally {
        if (actif) setLoading(false);
      }
    }

    void loadBoutique();

    return () => {
      actif = false;
    };
  }, [id]);

  function openWhatsApp(numero: string | null) {
    if (!numero) return;

    let telephone = numero.replace(/\D/g, "");

    if (!telephone) return;

    if (!telephone.startsWith("223")) {
      telephone = `223${telephone}`;
    }

    const message = encodeURIComponent(
      "Bonjour, je viens de découvrir votre boutique sur MM Mali."
    );

    window.open(
      `https://wa.me/${telephone}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
        <p className="font-bold text-gray-600">
          Chargement de la boutique...
        </p>
      </main>
    );
  }

  if (erreur) {
    return (
      <main className="min-h-screen bg-[#FFF9F5] flex flex-col items-center justify-center p-6 text-center">
        <p className="font-bold text-red-600">{erreur}</p>

        <Link
          href="/"
          className="mt-5 bg-black text-white px-6 py-3 rounded-full font-bold"
        >
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  const nomVendeur =
    produits.find((produit) => produit.vendeur_nom)?.vendeur_nom ||
    profile?.nom ||
    "Boutique vendeur";

  const telephone =
    produits.find((produit) => produit.contact_whatsapp)?.contact_whatsapp ||
    profile?.telephone ||
    null;

  return (
    <main className="min-h-screen bg-[#FFF9F5]">
      <header className="bg-[#171717] text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-xl font-black tracking-tight">
            MM <span className="text-[#FF6B35]">Mali</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-bold text-gray-200 hover:text-white"
          >
            Accueil
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B35]">
                Boutique MM Mali
              </p>

              <h1 className="text-2xl font-black text-gray-900 mt-2">
                {nomVendeur}
              </h1>

              <p className="text-sm text-gray-500 mt-2">
                {profile?.ville || produits[0]?.ville || "Mali"}
              </p>

              <p className="text-sm font-semibold text-gray-600 mt-3">
                {produits.length} produit{produits.length > 1 ? "s" : ""} publié
                {produits.length > 1 ? "s" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openWhatsApp(telephone)}
              disabled={!telephone}
              className="bg-[#25D366] text-white px-6 py-3 rounded-full font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Contacter le vendeur
            </button>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Tous les produits
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Découvrez les articles de cette boutique.
              </p>
            </div>

            <span className="bg-[#FFF0E8] text-[#E85D2A] px-3 py-2 rounded-full text-xs font-black">
              {produits.length} articles
            </span>
          </div>

          {produits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-lg font-black text-gray-800">
                Aucun produit disponible
              </p>

              <p className="text-sm text-gray-500 mt-2">
                Cette boutique ne possède pas encore de produit publié.
              </p>

              <Link
                href="/"
                className="inline-block mt-5 bg-[#FF6B35] text-white px-6 py-3 rounded-full font-bold"
              >
                Découvrir MM Mali
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {produits.map((produit) => (
                <Link
                  key={produit.id}
                  href={`/produit/${produit.id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {produit.imageUrl ? (
                      <Image
                        src={produit.imageUrl}
                        alt={produit.nom}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        Photo indisponible
                      </div>
                    )}

                    <span className="absolute top-2 left-2 bg-white/95 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-full">
                      {produit.categorie}
                    </span>
                  </div>

                  <div className="p-3">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-10">
                      {produit.nom}
                    </h3>

                    <p className="text-[#FF6B35] font-black text-sm mt-2">
                      {Number(produit.prix).toLocaleString("fr-FR")} FCFA
                    </p>

                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {produit.ville || "Mali"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}