"use client";
import Link from "next/link";

export default function CategoriesPage() {
  const categories = [
    { name: "Restaurant", icon: "🍔", id: "restaurant", desc: "Plats, fast-food, livraison express", color: "bg-orange-100" },
    { name: "Électronique", icon: "📱", id: "electronique", desc: "Téléphones, accessoires, gadgets", color: "bg-blue-100" },
    { name: "Sports et Loisirs", icon: "⚽", id: "sports", desc: "Maillots, ballons, fitness", color: "bg-green-100" },
    { name: "Cosmétique", icon: "💄", id: "cosmetique", desc: "Beauté, parfums, soins", color: "bg-pink-100" },
    { name: "Mode", icon: "👕", id: "mode", desc: "Habits, chaussures, sacs", color: "bg-purple-100" },
    { name: "Maison et Cuisine", icon: "🏠", id: "maison", desc: "Ustensiles, déco, électroménager", color: "bg-yellow-100" },
    { name: "Livres", icon: "📚", id: "livres", desc: "Livres, cahiers, fournitures", color: "bg-indigo-100" },
    { name: "Alimentation", icon: "🛒", id: "alimentation", desc: "Épicerie, boissons, snacks", color: "bg-red-100" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-[80px]">
      <div className="bg-white p-4 border-b flex items-center gap-3">
        <Link href="/" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">←</Link>
        <p className="font-black">COLLECTIONS - Catégories</p>
      </div>
      <div className="p-3 grid grid-cols-2 gap-3">
        {categories.map(c=>(
          <Link key={c.id} href={`/categories/${c.id}`} className={`rounded-2xl p-4 border bg-white`}>
            <div className={`w-12 h-12 ${c.color} rounded-xl flex items-center justify-center text-2xl`}>{c.icon}</div>
            <p className="font-black text-[13px] mt-2">{c.name}</p>
            <p className="text-[11px] text-gray-500 mt-1">{c.desc}</p>
            <p className="text-[11px] text-[#0a7a2e] font-bold mt-2">Voir produits →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}