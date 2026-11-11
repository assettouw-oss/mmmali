"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const CAT_INFO: any = {
  restaurant: { name: "Restaurant", icon: "🍔", banner: "Idées pour le déjeuner - Livraison express 30min" },
  electronique: { name: "Électronique", icon: "📱", banner: "Téléphones, écouteurs, chargeurs - Garantie 1 an" },
  sports: { name: "Sports et Loisirs", icon: "⚽", banner: "Maillots, ballons, fitness - Prix grossiste" },
  cosmetique: { name: "Cosmétique", icon: "💄", banner: "Parfums originaux, crèmes, beauté" },
  mode: { name: "Mode", icon: "👕", banner: "Habits, chaussures, sacs - Nouvelle collection" },
  maison: { name: "Maison et Cuisine", icon: "🏠", banner: "Ustensiles, déco, électroménager" },
  livres: { name: "Livres", icon: "📚", banner: "Livres, Coran, fournitures scolaires" },
  alimentation: { name: "Alimentation", icon: "🛒", banner: "Épicerie, boissons, snacks - Prix détail" },
};

export default function CategoriePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [produits, setProduits] = useState<any[]>([]);
  const [filtre, setFiltre] = useState("Tous");

  const info = CAT_INFO[slug] || { name: slug, icon: "📦", banner: "Produits sélectionnés" };

  useEffect(() => {
    async function load() {
      // Cherche par catégorie, si vide montre tout
      const { data } = await supabase.from("produits").select("*").ilike("categorie", `%${slug}%`).limit(20);
      if (data && data.length > 0) setProduits(data);
      else {
        const { data: all } = await supabase.from("produits").select("*").order("created_at", { ascending: false }).limit(20);
        if (all) setProduits(all);
      }
    }
    load();
  }, [slug]);

  return (
    <div className="min-h-screen bg-white pb-[80px]">
      <div className="sticky top-0 z-30 bg-white border-b p-3 flex items-center gap-3">
        <Link href="/categories" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">←</Link>
        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">{info.icon}</div>
        <div><p className="font-black text-sm">{info.name}</p><p className="text-[11px] text-gray-500">{produits.length} produits</p></div>
        <div className="ml-auto flex gap-2"><Link href="/recherche" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">🔍</Link></div>
      </div>

      <div className="bg-[#0a7a2e] text-white p-3 text-[11px] font-bold text-center">🔥 {info.banner}</div>

      <div className="p-3 flex gap-2 overflow-x-auto border-b">
        {["Tous", "Moins de 5 000F", "5 000 - 20 000F", "Plus de 20 000F", "Nouveautés"].map(f=>(
          <button key={f} onClick={()=>setFiltre(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] border font-bold ${filtre===f ? "bg-black text-white" : "bg-white"}`}>{f}</button>
        ))}
      </div>

      {produits.length === 0 ? (
        <div className="p-10 text-center">
          <div className="text-5xl">{info.icon}</div>
          <p className="font-black mt-3">Aucun produit dans {info.name} pour le moment</p>
          <p className="text-xs text-gray-500 mt-1">Sois le premier vendeur à publier dans cette catégorie !</p>
          <Link href="/vendre" className="inline-block bg-black text-white px-6 py-3 rounded-full font-black mt-4 text-sm">+ Publier un produit</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-2 bg-[#f8f8f8]">
          {produits.map((p:any)=>{
            let show = true;
            const prix = Number(p.prix);
            if (filtre==="Moins de 5 000F") show = prix < 5000;
            if (filtre==="5 000 - 20 000F") show = prix >=5000 && prix <=20000;
            if (filtre==="Plus de 20 000F") show = prix > 20000;
            if (!show) return null;
            return (
              <Link key={p.id} href={`/produit/${p.id}`} className="bg-white border rounded-xl overflow-hidden">
                <div className="relative">
                  <img src={p.image_url} className="w-full h-[160px] object-cover" />
                  {slug==="restaurant" && <span className="absolute top-1 left-1 bg-green-600 text-white text-[8px] px-1.5 py-0.5 rounded">LIVRAISON EXPRESS</span>}
                  {slug==="electronique" && <span className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded">GARANTIE</span>}
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded">★ 4.8</span>
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-bold line-clamp-2 h-[32px]">{p.titre}</p>
                  <p className="text-[12px] font-black mt-1 text-orange-600">{prix.toLocaleString()} F</p>
                  <p className="text-[9px] text-gray-500">Min. 1 pièce • {p.ville || "Bamako"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
        <Link href="/" className="flex flex-col items-center text-[#0a7a2e]"><span>🏠</span><span className="text-[10px] font-bold">Accueil</span></Link>
        <Link href="/messagerie" className="flex flex-col items-center text-gray-400"><span>💬</span><span className="text-[10px]">Messagerie</span></Link>
        <Link href="/panier" className="flex flex-col items-center text-gray-400"><span>🛒</span><span className="text-[10px]">Panier</span></Link>
        <Link href="/reels" className="flex flex-col items-center text-gray-400"><span>🎬</span><span className="text-[10px]">Reels</span></Link>
        <Link href="/compte" className="flex flex-col items-center text-gray-400"><span>👤</span><span className="text-[10px]">Compte</span></Link>
      </div>
    </div>
  );
}