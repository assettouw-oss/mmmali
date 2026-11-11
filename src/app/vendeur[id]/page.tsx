"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function VendeurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [produits, setProduits] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", id).single();
      if (prof) setProfile(prof);
      const { data: prods } = await supabase.from("produits").select("*").eq("user_id", id).order("created_at", { ascending: false });
      if (prods) setProduits(prods);
      setLoading(false);
    }
    load();
  }, [id]);

  function openWhatsApp() {
    const phone = profile?.whatsapp || profile?.phone || "22370000000";
    const clean = phone.replace(/[^0-9]/g, "");
    const finalPhone = clean.startsWith("223") ? clean : `223${clean}`;
    window.open(`https://wa.me/${finalPhone}?text=Bonjour, je viens de voir votre boutique mmmali`, "_blank");
  }

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-black text-white p-4"><div className="max-w-[1200px] mx-auto flex justify-between"><Link href="/" className="font-black">mmmali.</Link><button onClick={openWhatsApp} className="bg-[#25D366] px-4 py-2 rounded-full text-xs font-black">WhatsApp vendeur</button></div></header>
      <div className="max-w-[1200px] mx-auto p-4">
        <div className="bg-white p-5 rounded-2xl border"><h1 className="font-black text-xl">{profile?.full_name || "Boutique vendeur"} âœ“</h1><p className="text-xs">{produits.length} produits â€¢ {profile?.ville} - {profile?.quartier}</p></div>

        <div className="bg-white p-4 rounded-2xl border mt-4">
          <h2 className="font-black">ðŸŽ¥ VidÃ©os qui jouent maintenant</h2>
          <div className="flex gap-3 overflow-x-auto mt-3">
            {produits.filter((p:any)=>p.video_url).map((p:any)=>(
              <div key={p.id} className="min-w-[220px] rounded-2xl overflow-hidden bg-black">
                {/* LECTEUR VIDEO QUI JOUE */}
                <video src={p.video_url} controls playsInline preload="metadata" poster={p.image_url} className="w-[220px] h-[350px] object-cover" />
                <div className="p-2 bg-white"><p className="text-xs font-bold truncate">{p.titre}</p><p className="text-xs text-orange-600 font-black">{Number(p.prix).toLocaleString()} FCFA</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border mt-4">
          <h2 className="font-black">Photos officielles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {produits.map((p:any)=>(
              <Link key={p.id} href={`/produit/${p.id}`} className="border rounded-xl overflow-hidden">
                <img src={p.image_url} className="aspect-square object-cover w-full" />
                <div className="p-2"><p className="text-xs font-bold">{p.titre}</p><p className="text-xs text-orange-600 font-black">{Number(p.prix).toLocaleString()} FCFA</p></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
