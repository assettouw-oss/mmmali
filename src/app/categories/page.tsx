"use client";

import Link from "next/link";

const categories = [
  {
    name: "Restaurant",
    icon: "🍔",
    id: "restaurant",
    desc: "Plats, fast-food, livraison express",
    color: "bg-orange-100",
  },
  {
    name: "Électronique",
    icon: "📱",
    id: "electronique",
    desc: "Téléphones, accessoires, gadgets",
    color: "bg-blue-100",
  },
  {
    name: "Sports et Loisirs",
    icon: "⚽",
    id: "sports",
    desc: "Maillots, ballons, fitness",
    color: "bg-green-100",
  },
  {
    name: "Cosmétique",
    icon: "💄",
    id: "cosmetique",
    desc: "Beauté, parfums, soins",
    color: "bg-pink-100",
  },
  {
    name: "Mode",
    icon: "👕",
    id: "mode",
    desc: "Habits, chaussures, sacs",
    color: "bg-purple-100",
  },
  {
    name: "Maison et Cuisine",
    icon: "🏠",
    id: "maison",
    desc: "Ustensiles, déco, électroménager",
    color: "bg-yellow-100",
  },
  {
    name: "Livres",
    icon: "📚",
    id: "livres",
    desc: "Livres, cahiers, fournitures",
    color: "bg-indigo-100",
  },
  {
    name: "Alimentation",
    icon: "🛒",
    id: "alimentation",
    desc: "Épicerie, boissons, snacks",
    color: "bg-red-100",
  },
];

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f8] pb-[80px]">
      <header className="flex items-center gap-3 border-b bg-white p-4">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
        >
          ←
        </Link>

        <h1 className="font-black">COLLECTIONS - Catégories</h1>
      </header>

      <section
        aria-label="Toutes les catégories"
        className="grid grid-cols-2 gap-3 p-3"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.id}`}
            className="rounded-2xl border bg-white p-4 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div
              aria-hidden="true"
              className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${category.color}`}
            >
              {category.icon}
            </div>

            <h2 className="mt-2 text-[13px] font-black">
              {category.name}
            </h2>

            <p className="mt-1 text-[11px] text-gray-500">
              {category.desc}
            </p>

            <p className="mt-2 text-[11px] font-bold text-[#0a7a2e]">
              Voir produits →
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}