"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  nom: string;
  telephone: string;
  ville: string;
  role: "client" | "vendeur" | "admin";
};

type Product = {
  id: string;
  nom: string;
  prix: number;
  categorie: string | null;
  statut: "publie" | "masque";
  created_at: string;
};

export default function ComptePro() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({
    id: "",
    nom: "",
    telephone: "",
    ville: "Bamako",
    role: "client",
  });

  const [produits, setProduits] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let actif = true;

    async function load() {
      try {
        const {
          data: { user: utilisateur },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !utilisateur) {
          router.replace("/connexion");
          return;
        }

        if (!actif) return;
        setUser(utilisateur);

        const { data: profil, error: profilError } = await supabase
          .from("profiles")
          .select("id, nom, telephone, ville, role")
          .eq("id", utilisateur.id)
          .single();

        if (profilError) {
          throw profilError;
        }

        if (!actif) return;

        const profilVendeur: Profile = {
          id: profil.id,
          nom: profil.nom ?? "",
          telephone: profil.telephone ?? "",
          ville: profil.ville ?? "Bamako",
          role: profil.role,
        };

        setProfile(profilVendeur);

        if (profil.role !== "vendeur") {
          setMessage(
            "Ce compte n'a pas encore le rôle vendeur. Contacte l'administration pour vérifier ton accès."
          );
          return;
        }

        const { data: listeProduits, error: produitsError } = await supabase
          .from("products")
          .select("id, nom, prix, categorie, statut, created_at")
          .eq("vendeur_id", utilisateur.id)
          .order("created_at", { ascending: false });

        if (produitsError) {
          throw produitsError;
        }

        if (actif) {
          setProduits((listeProduits ?? []) as Product[]);
        }
      } catch (error) {
        console.error("Erreur de chargement du compte PRO :", error);
        if (actif) {
          setMessage("Impossible de charger ton compte. Réessaie plus tard.");
        }
      } finally {
        if (actif) setLoading(false);
      }
    }

    void load();

    return () => {
      actif = false;
    };
  }, [router]);

  async function saveProfile() {
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nom: profile.nom.trim(),
          telephone: profile.telephone.trim(),
          ville: profile.ville,
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage("Ton compte PRO a été sauvegardé avec succès.");
    } catch (error) {
      console.error("Erreur de sauvegarde :", error);
      setMessage("La sauvegarde a échoué. Vérifie les informations et réessaie.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center font-bold">
        Chargement de ton compte...
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#f7f7f7]">
      <header className="sticky top-0 z-40 bg-black p-4 text-white">
        <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-3">
          <Link href="/" className="text-2xl font-black">
            mmmali<span className="text-orange-500">.</span>
          </Link>

          <Link
            href={`/vendeur/${user.id}`}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-black"
          >
            Voir ma boutique
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1300px] p-4">
        <section className="mx-auto max-w-[600px] rounded-[20px] border bg-white p-6">
          <h1 className="text-xl font-black">Mon compte PRO</h1>

          <p className="mt-1 text-sm text-gray-500">
            Gère les informations de ton compte vendeur.
          </p>

          {message && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-orange-50 p-3 text-sm"
            >
              {message}
            </p>
          )}

          {profile.role === "vendeur" && (
            <>
              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="nom"
                    className="text-xs font-black uppercase"
                  >
                    Nom complet
                  </label>
                  <input
                    id="nom"
                    value={profile.nom}
                    onChange={(event) =>
                      setProfile((ancien) => ({
                        ...ancien,
                        nom: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border p-3"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="telephone"
                    className="text-xs font-black uppercase"
                  >
                    Téléphone
                  </label>
                  <input
                    id="telephone"
                    type="tel"
                    value={profile.telephone}
                    onChange={(event) =>
                      setProfile((ancien) => ({
                        ...ancien,
                        telephone: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border p-3"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ville"
                    className="text-xs font-black uppercase"
                  >
                    Ville
                  </label>
                  <select
                    id="ville"
                    value={profile.ville}
                    onChange={(event) =>
                      setProfile((ancien) => ({
                        ...ancien,
                        ville: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border p-3"
                  >
                    <option value="Bamako">Bamako</option>
                    <option value="Sikasso">Sikasso</option>
                    <option value="Kayes">Kayes</option>
                    <option value="Ségou">Ségou</option>
                    <option value="Mopti">Mopti</option>
                    <option value="Koutiala">Koutiala</option>
                    <option value="Gao">Gao</option>
                    <option value="Tombouctou">Tombouctou</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full rounded-full bg-orange-500 py-4 font-black text-black disabled:opacity-50"
                >
                  {saving ? "Sauvegarde..." : "Sauvegarder mon compte PRO"}
                </button>
              </div>

              <div className="mt-8 border-t pt-5">
                <h2 className="text-lg font-black">Mes produits</h2>

                {produits.length === 0 ? (
  <p className="mt-3 text-sm text-gray-500">
    Tu n&apos;as pas encore publié de produit.
  </p>
) : (
                  <div className="mt-4 space-y-3">
                    {produits.map((produit) => (
                      <div
                        key={produit.id}
                        className="flex items-center justify-between gap-3 rounded-xl border p-3"
                      >
                        <div>
                          <p className="font-bold">{produit.nom}</p>
                          <p className="text-sm text-gray-500">
                            {produit.prix.toLocaleString("fr-FR")} FCFA
                          </p>
                        </div>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                          {produit.statut === "publie"
                            ? "Publié"
                            : "Masqué"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}