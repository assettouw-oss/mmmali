"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase, supabaseConfigure } from "@/lib/supabase";

type ProductImage = {
  chemin: string;
  position: number | null;
};

type Product = {
  id: string;
  nom: string;
  prix: number | string;
  categorie: string;
  ville: string | null;
  statut: string;
  created_at: string;
  product_images: ProductImage[];
};

type CategoryInfo = {
  name: string;
  icon: string;
  banner: string;
};

const CAT_INFO: Record<string, CategoryInfo> = {
  restaurant: {
    name: "Restaurant",
    icon: "🍔",
    banner: "Idées pour le déjeuner - Livraison express",
  },
  electronique: {
    name: "Électronique",
    icon: "📱",
    banner: "Téléphones, écouteurs, chargeurs",
  },
  sports: {
    name: "Sports et Loisirs",
    icon: "⚽",
    banner: "Maillots, ballons, fitness",
  },
  cosmetique: {
    name: "Cosmétique",
    icon: "💄",
    banner: "Parfums, crèmes et beauté",
  },
  mode: {
    name: "Mode",
    icon: "👕",
    banner: "Habits, chaussures et sacs",
  },
  maison: {
    name: "Maison et Cuisine",
    icon: "🏠",
    banner: "Ustensiles, décoration et électroménager",
  },
  livres: {
    name: "Livres",
    icon: "📚",
    banner: "Livres et fournitures scolaires",
  },
  alimentation: {
    name: "Alimentation",
    icon: "🛒",
    banner: "Épicerie, boissons et snacks",
  },
};

const FILTRES = [
  "Tous",
  "Moins de 5 000 F",
  "5 000 - 20 000 F",
  "Plus de 20 000 F",
  "Nouveautés",
];

function obtenirImage(produit: Product): string | null {
  const images = [...(produit.product_images ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const chemin = images[0]?.chemin;

  if (!chemin) return null;

  if (chemin.startsWith("http://") || chemin.startsWith("https://")) {
    return chemin;
  }

  return supabase.storage.from("produits").getPublicUrl(chemin).data
    .publicUrl;
}

export default function CategoriePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [produits, setProduits] = useState<Product[]>([]);
  const [filtre, setFiltre] = useState("Tous");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const info: CategoryInfo = CAT_INFO[slug] ?? {
    name: slug,
    icon: "📦",
    banner: "Produits sélectionnés sur MM Mali",
  };

  useEffect(() => {
    let actif = true;

    async function chargerProduits() {
      setChargement(true);
      setErreur("");

      if (!supabaseConfigure) {
        if (actif) {
          setErreur("La connexion à la base de données n'est pas configurée.");
          setChargement(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, nom, prix, categorie, ville, statut, created_at, product_images(chemin, position)"
        )
        .eq("statut", "publie")
        .ilike("categorie", `%${info.name}%`)
        .order("created_at", { ascending: false })
        .limit(40);

      if (!actif) return;

      if (error) {
        setErreur("Impossible de charger les produits. Réessaie plus tard.");
        setProduits([]);
      } else {
        setProduits((data ?? []) as Product[]);
      }

      setChargement(false);
    }

    chargerProduits();

    return () => {
      actif = false;
    };
  }, [info.name]);

  const produitsFiltres = produits.filter((produit) => {
    const prix = Number(produit.prix);

    switch (filtre) {
      case "Moins de 5 000 F":
        return prix < 5000;

      case "5 000 - 20 000 F":
        return prix >= 5000 && prix <= 20000;

      case "Plus de 20 000 F":
        return prix > 20000;

      default:
        return true;
    }
  });

  return (
    <main className="min-h-screen bg-white pb-[80px]">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white p-3">
        <Link
          href="/categories"
          aria-label="Retour aux catégories"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
        >
          ←
        </Link>

        <h1 className="font-black">{info.name}</h1>
      </header>

      <section className="bg-[#0a7a2e] p-4 text-center text-sm font-bold text-white">
        <span aria-hidden="true">🔥 </span>
        {info.banner}
      </section>

      <div className="flex gap-2 overflow-x-auto border-b p-3">
        {FILTRES.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltre(f)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold ${
              filtre === f ? "bg-black text-white" : "bg-white text-gray-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {chargement ? (
        <div className="p-10 text-center text-sm text-gray-500">
          Chargement des produits...
        </div>
      ) : erreur ? (
        <div className="p-10 text-center">
          <p className="font-bold text-red-600">{erreur}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-black px-5 py-2 text-sm font-bold text-white"
          >
            Réessayer
          </button>
        </div>
      ) : produitsFiltres.length === 0 ? (
        <div className="p-10 text-center">
          <div className="text-5xl" aria-hidden="true">
            {info.icon}
          </div>

          <p className="mt-3 font-black">
            Aucun produit trouvé dans {info.name}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Cette catégorie ne contient pas encore de produit correspondant.
          </p>

          <Link
            href="/vendre"
            className="mt-4 inline-block rounded-full bg-black px-6 py-3 text-sm font-black text-white"
          >
            + Publier un produit
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-2 bg-[#f8f8f8] p-2">
          {produitsFiltres.map((produit) => {
            const image = obtenirImage(produit);

            return (
              <Link
                key={produit.id}
                href={`/produit/${produit.id}`}
                className="overflow-hidden rounded-xl border bg-white"
              >
                <div className="relative">
                  {image ? (
                    <img
                      src={image}
                      alt={produit.nom}
                      loading="lazy"
                      className="h-[160px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[160px] items-center justify-center bg-gray-100 text-4xl">
                      📦
                    </div>
                  )}

                  {slug === "restaurant" && (
                    <span className="absolute left-1 top-1 rounded bg-green-600 px-1.5 py-0.5 text-[8px] text-white">
                      RESTAURATION
                    </span>
                  )}

                  {slug === "electronique" && (
                    <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[8px] text-white">
                      ÉLECTRONIQUE
                    </span>
                  )}
                </div>

                <div className="p-2">
                  <p className="line-clamp-2 h-[32px] text-[11px] font-bold">
                    {produit.nom}
                  </p>

                  <p className="mt-1 text-[12px] font-black text-orange-600">
                    {Number(produit.prix).toLocaleString("fr-FR")} F
                  </p>

                  <p className="text-[9px] text-gray-500">
                    {produit.ville || "Bamako"}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <nav
        aria-label="Navigation principale"
        className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-white py-2"
      >
        <Link href="/" className="flex flex-col items-center text-[#0a7a2e]">
          <span>🏠</span>
          <span className="text-[10px] font-bold">Accueil</span>
        </Link>

        <Link href="/messagerie" className="flex flex-col items-center text-gray-400">
          <span>💬</span>
          <span className="text-[10px]">Messagerie</span>
        </Link>

        <Link href="/panier" className="flex flex-col items-center text-gray-400">
          <span>🛒</span>
          <span className="text-[10px]">Panier</span>
        </Link>

        <Link href="/reels" className="flex flex-col items-center text-gray-400">
          <span>🎬</span>
          <span className="text-[10px]">Reels</span>
        </Link>

        <Link href="/compte" className="flex flex-col items-center text-gray-400">
          <span>👤</span>
          <span className="text-[10px]">Compte</span>
        </Link>
      </nav>
    </main>
  );
}