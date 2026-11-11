"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ComptePro() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [produits, setProduits] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return (window.location.href = "/connexion");
      setUser(user);
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof) setProfile(prof);
      else setProfile({ email: user.email, ville: "Bamako", type_compte: "vendeur" });
      const { data: prods } = await supabase.from("produits").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (prods) setProduits(prods);
    }
    load();
  }, []);

  async function getLocation() {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfile({ ...profile, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocLoading(false);
      },
      () => { alert("Active ton GPS"); setLocLoading(false); }
    );
  }

  // FONCTION CORRIGÉE QUI NE PLANTE PLUS
  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: profile.full_name,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      ville: profile.ville,
      quartier: profile.quartier,
      adresse_complete: profile.adresse_complete,
      latitude: profile.latitude,
      longitude: profile.longitude,
      type_compte: profile.type_compte,
      bio: profile.bio,
    }, { onConflict: 'id' });

    setSaving(false);
    if (error) alert("Erreur: " + error.message);
    else alert("✅ Compte PRO sauvegardé avec succès !");
  }

  if (!user) return <div className="p-10 text-center font-black">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <header className="bg-black text-white p-4 sticky top-0 z-40">
        <div className="max-w-[1300px] mx-auto flex justify-between items-center">
          <Link href="/" className="font-black text-2xl">mmmali<span className="text-orange-500">.</span></Link>
          <Link href={`/vendeur/${user.id}`} className="bg-white text-black px-4 py-2 rounded-full text-xs font-black">Voir boutique publique</Link>
        </div>
      </header>
      <div className="max-w-[1300px] mx-auto p-4">
        <div className="bg-white rounded-[20px] border p-6 max-w-[500px] mx-auto">
          <h2 className="font-black text-lg">Mon Compte PRO</h2>
          <div className="mt-5 space-y-3">
            <div><label className="text-[11px] font-black uppercase">Nom complet</label><input value={profile.full_name || ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="w-full p-3 border rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[11px] font-black uppercase">Téléphone</label><input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full p-3 border rounded-xl" /></div>
              <div><label className="text-[11px] font-black uppercase">WhatsApp</label><input value={profile.whatsapp || ""} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} className="w-full p-3 border rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[11px] font-black uppercase">Ville</label><select value={profile.ville || "Bamako"} onChange={(e) => setProfile({ ...profile, ville: e.target.value })} className="w-full p-3 border rounded-xl"><option>Bamako</option><option>Sikasso</option><option>Kayes</option></select></div>
              <div><label className="text-[11px] font-black uppercase">Quartier</label><input value={profile.quartier || ""} onChange={(e) => setProfile({ ...profile, quartier: e.target.value })} placeholder="Zreny" className="w-full p-3 border rounded-xl" /></div>
            </div>
            <div><label className="text-[11px] font-black uppercase">Adresse complète</label><input value={profile.adresse_complete || ""} onChange={(e) => setProfile({ ...profile, adresse_complete: e.target.value })} className="w-full p-3 border rounded-xl" /></div>
            <button onClick={getLocation} className="w-full bg-black text-white py-3 rounded-full font-bold text-xs">{locLoading ? "Recherche..." : profile.latitude ? `✅ Localisation OK` : "📍 Capturer ma position GPS"}</button>
            <div><label className="text-[11px] font-black uppercase">Bio</label><textarea value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="w-full p-3 border rounded-xl h-20" /></div>
            <button onClick={saveProfile} className="w-full bg-orange-500 text-black py-4 rounded-full font-black">{saving ? "Sauvegarde..." : "Sauvegarder mon compte PRO"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}