"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProfilForm = {
  nom: string;
  telephone: string;
  ville: string;
  email: string;
};

export default function ProfilPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfilForm>({
    nom: "",
    telephone: "",
    ville: "Bamako",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let actif = true;

    async function loadProfile() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
          if (actif) {
            setMessage("Connecte-toi pour modifier ton profil.");
            setLoading(false);
          }
          return;
        }

        if (!actif) return;

        setUserId(user.id);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("nom, telephone, ville")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!actif) return;

        setForm({
          nom: profile?.nom ?? "",
          telephone: profile?.telephone ?? "",
          ville: profile?.ville ?? "Bamako",
          email: user.email ?? "",
        });
      } catch (error) {
        console.error("Erreur chargement profil :", error);

        if (actif) {
          setMessage("Impossible de charger ton profil.");
        }
      } finally {
        if (actif) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      actif = false;
    };
  }, []);

  function updateField(
    field: keyof Omit<ProfilForm, "email">,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function save() {
    if (!userId || saving) return;

    if (!form.nom.trim()) {
      setMessage("Le nom complet est obligatoire.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nom: form.nom.trim(),
          telephone: form.telephone.trim(),
          ville: form.ville,
        })
        .eq("id", userId);

      if (error) throw error;

      setMessage("Profil enregistré avec succès !");
    } catch (error) {
      console.error("Erreur sauvegarde profil :", error);

      setMessage(
        error instanceof Error
          ? `Erreur : ${error.message}`
          : "Une erreur est survenue pendant la sauvegarde."
      );
    } finally {
      setSaving(false);
    }
  }

  const initiale = form.nom.trim()
    ? form.nom.trim().charAt(0).toUpperCase()
    : "U";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <p className="text-sm text-gray-500">Chargement du profil...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8]">
      <header className="bg-white p-4 border-b flex items-center gap-3">
        <Link
          href="/compte"
          aria-label="Retour au compte"
          className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
        >
          ←
        </Link>

        <h1 className="font-black">Modifier mon profil</h1>
      </header>

      <div className="max-w-xl mx-auto p-4">
        <section className="bg-white rounded-2xl border p-5">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-black">
              {initiale}
            </div>

            <p className="font-black mt-2">
              {form.nom || "Nom non défini"}
            </p>

            <p className="text-xs text-gray-500">{form.email}</p>
          </div>

          {!userId ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-red-600">{message}</p>
              <Link
                href="/compte"
                className="inline-block mt-4 bg-black text-white px-5 py-3 rounded-full text-sm font-bold"
              >
                Aller à mon compte
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="nom"
                  className="text-xs font-bold"
                >
                  Nom complet *
                </label>

                <input
                  id="nom"
                  value={form.nom}
                  onChange={(e) => updateField("nom", e.target.value)}
                  maxLength={100}
                  required
                  className="w-full p-3 border rounded-xl mt-1 text-sm"
                  placeholder="Ex : Adama Sylla"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-xs font-bold"
                >
                  Adresse email
                </label>

                <input
                  id="email"
                  value={form.email}
                  disabled
                  className="w-full p-3 border rounded-xl mt-1 bg-gray-100 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="telephone"
                  className="text-xs font-bold"
                >
                  Numéro de téléphone
                </label>

                <input
                  id="telephone"
                  type="tel"
                  value={form.telephone}
                  onChange={(e) =>
                    updateField("telephone", e.target.value)
                  }
                  maxLength={25}
                  className="w-full p-3 border rounded-xl mt-1 text-sm"
                  placeholder="70 00 00 00"
                />
              </div>

              <div>
                <label
                  htmlFor="ville"
                  className="text-xs font-bold"
                >
                  Ville
                </label>

                <select
                  id="ville"
                  value={form.ville}
                  onChange={(e) => updateField("ville", e.target.value)}
                  className="w-full p-3 border rounded-xl mt-1 text-sm"
                >
                  <option value="Bamako">Bamako</option>
                  <option value="Kayes">Kayes</option>
                  <option value="Sikasso">Sikasso</option>
                  <option value="Ségou">Ségou</option>
                  <option value="Mopti">Mopti</option>
                  <option value="Koutiala">Koutiala</option>
                </select>
              </div>

              {message && (
                <p
                  role="status"
                  className="text-sm text-center text-gray-700"
                >
                  {message}
                </p>
              )}

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="w-full bg-black text-white py-4 rounded-full font-black mt-2 disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer mon profil"}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                Tes informations sont enregistrées dans ton compte.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}