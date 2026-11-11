"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    ville: "Bamako",
    quartier: "",
    bio: "",
    email: "",
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      setUser(u);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();

      if (profile) {
        setForm({
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          whatsapp: profile.whatsapp || "",
          ville: profile.ville || "Bamako",
          quartier: profile.quartier || "",
          bio: profile.bio || "",
          email: u.email || "",
        });
      } else {
        setForm((f) => ({ ...f, email: u.email || "" }));
      }
    }
    load();
  }, []);

  async function save() {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        whatsapp: form.whatsapp,
        ville: form.ville,
        quartier: form.quartier,
        bio: form.bio,
      },
      { onConflict: "id" }
    );
    if (error) {
      alert("Erreur: " + error.message);
    } else {
      alert("Profil sauvegarde !");
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="bg-white p-4 border-b flex items-center gap-3">
        <Link
          href="/compte"
          className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
        >
          ←
        </Link>
        <p className="font-black">Modifier mon profil</p>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-black">
              {form.full_name ? form.full_name[0].toUpperCase() : "U"}
            </div>
            <p className="font-black mt-2">
              {form.full_name || "Nom non defini"}
            </p>
            <p className="text-xs text-gray-500">{form.email}</p>
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <p className="text-[11px] font-bold">Nom complet *</p>
              <input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="w-full p-3 border rounded-xl mt-1 text-sm"
                placeholder="Ex: Adama Sylla"
              />
            </div>

            <div>
              <p className="text-[11px] font-bold">Email (non modifiable)</p>
              <input
                value={form.email}
                disabled
                className="w-full p-3 border rounded-xl mt-1 bg-gray-100 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-bold">Telephone</p>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl mt-1 text-sm"
                  placeholder="70 00 00 00"
                />
              </div>
              <div>
                <p className="text-[11px] font-bold">WhatsApp</p>
                <input
                  value={form.whatsapp}
                  onChange={(e) =>
                    setForm({ ...form, whatsapp: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl mt-1 text-sm"
                  placeholder="70 00 00 00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-bold">Ville</p>
                <select
                  value={form.ville}
                  onChange={(e) =>
                    setForm({ ...form, ville: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl mt-1 text-sm"
                >
                  <option>Bamako</option>
                  <option>Kayes</option>
                  <option>Sikasso</option>
                  <option>Segou</option>
                  <option>Mopti</option>
                  <option>Koutiala</option>
                </select>
              </div>
              <div>
                <p className="text-[11px] font-bold">Quartier</p>
                <input
                  value={form.quartier}
                  onChange={(e) =>
                    setForm({ ...form, quartier: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl mt-1 text-sm"
                  placeholder="Ex: Hamdallaye"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold">Bio boutique</p>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full p-3 border rounded-xl mt-1 text-sm h-24"
                placeholder="Je vends electronique, livraison rapide Bamako..."
              />
            </div>

            <button
              onClick={save}
              className="w-full bg-black text-white py-4 rounded-full font-black mt-2"
            >
              Enregistrer profil
            </button>

            <p className="text-[10px] text-gray-400 text-center mt-2">
              Tes infos email et localisation s affichent obligatoirement sur
              ton compte pour les clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}