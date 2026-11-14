"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  getPanier,
  viderPanier,
  type PanierItem,
} from "@/lib/panier";
import { supabase } from "@/lib/supabase";

type Profil = {
  nom: string | null;
  telephone: string | null;
  ville: string | null;
};

type FormulaireCommande = {
  nom: string;
  phone: string;
  ville: string;
  adresse: string;
};

type ModePaiement =
  | "livraison"
  | "orange_money"
  | "moov_money";

type LigneCommande = {
  product_id: string;
  quantite: number;
};

function messageErreur(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Impossible d'enregistrer la commande.";
}

export default function CommandePage() {
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [form, setForm] = useState<FormulaireCommande>({
    nom: "",
    phone: "",
    ville: "Bamako",
    adresse: "",
  });

  const [paiement, setPaiement] =
    useState<ModePaiement>("livraison");

  const [loading, setLoading] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let actif = true;

    async function charger() {
      try {
        const articles = getPanier();

        if (actif) {
          setPanier(articles);
        }

        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          if (actif) {
            setUser(null);
          }
          return;
        }

        if (actif) {
          setUser(data.user);
        }

        const { data: profil, error: erreurProfil } =
          await supabase
            .from("profiles")
            .select("nom, telephone, ville")
            .eq("id", data.user.id)
            .maybeSingle<Profil>();

        if (erreurProfil) {
          console.error("Erreur chargement profil :", erreurProfil);
        }

        if (actif && profil) {
          setForm({
            nom: profil.nom ?? "",
            phone: profil.telephone ?? "",
            ville: profil.ville ?? "Bamako",
            adresse: "",
          });
        }
      } catch (error: unknown) {
        console.error("Erreur de chargement :", error);

        if (actif) {
          setMessage("Impossible de charger les informations.");
        }
      } finally {
        if (actif) {
          setChargement(false);
        }
      }
    }

    void charger();

    return () => {
      actif = false;
    };
  }, []);

  const total = panier.reduce(
    (somme, produit) =>
      somme + produit.prix * produit.quantite,
    0
  );

  async function commander() {
    setMessage("");

    if (!user) {
      setMessage(
        "Connecte-toi à ton compte avant de commander."
      );
      return;
    }

    if (panier.length === 0) {
      setMessage("Ton panier est vide.");
      return;
    }

    if (!form.nom.trim() || !form.phone.trim()) {
      setMessage(
        "Le nom et le téléphone sont obligatoires."
      );
      return;
    }

    if (!form.ville.trim() || !form.adresse.trim()) {
      setMessage("Renseigne ta ville et ton quartier.");
      return;
    }

    const articles: LigneCommande[] = panier.map(
      (produit) => ({
        product_id: produit.id,
        quantite: produit.quantite,
      })
    );

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        "passer_commande",
        {
          p_nom: form.nom.trim(),
          p_telephone: form.phone.trim(),
          p_adresse: `${form.ville.trim()} - ${form.adresse.trim()}`,
          p_paiement: paiement,
          p_lignes: articles,
        }
      );

      if (error) {
        throw error;
      }

      const orderId = data as string | null;

      if (!orderId) {
        throw new Error(
          "La commande n'a pas été enregistrée."
        );
      }

      viderPanier();
      setPanier([]);

      alert(
        `Commande enregistrée avec succès !\nNuméro : ${orderId}`
      );

      window.location.href = "/";
    } catch (error: unknown) {
      console.error("Erreur commande :", error);
      setMessage(messageErreur(error));
    } finally {
      setLoading(false);
    }
  }

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Chargement de ta commande...
        </p>
      </div>
    );
  }

  if (panier.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="font-black text-xl">Panier vide</p>

          <p className="text-sm text-gray-500 mt-1">
            Ajoute des produits avant de commander.
          </p>

          <Link
            href="/"
            className="mt-4 inline-block bg-black text-white px-6 py-3 rounded-full"
          >
            Aller au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4">
      <div className="max-w-[700px] mx-auto">
        <Link href="/panier" className="text-sm underline">
          ← Retour au panier
        </Link>

        <h1 className="font-black text-2xl mt-3">
          Finaliser ma commande
        </h1>

        <div className="bg-white rounded-2xl border p-4 mt-4">
          <p className="font-black text-sm">
            MES PRODUITS ({panier.length})
          </p>

          <div className="mt-3 space-y-3">
            {panier.map((produit) => (
              <div
                key={produit.id}
                className="flex gap-3 border-b pb-3 last:border-0"
              >
                {produit.image_url && (
                  <img
                    src={produit.image_url}
                    alt={produit.titre}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                )}

                <div className="flex-1">
                  <p className="font-bold text-sm">
                    {produit.titre}
                  </p>

                  <p className="text-xs text-gray-500">
                    {produit.quantite} ×{" "}
                    {produit.prix.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>

                <p className="font-black text-sm text-orange-600">
                  {(
                    produit.prix * produit.quantite
                  ).toLocaleString("fr-FR")}{" "}
                  FCFA
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-black text-lg mt-3 pt-3 border-t">
            <span>Total</span>

            <span className="text-orange-600">
              {total.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4 mt-4">
          <p className="font-black text-sm">
            INFORMATIONS DU CLIENT
          </p>

          {user ? (
            <p className="text-xs text-green-700 mt-2">
              Connecté : {user.email}
            </p>
          ) : (
            <p className="text-sm text-red-600 mt-2">
              Tu dois te connecter pour commander.
            </p>
          )}

          <input
            value={form.nom}
            onChange={(e) =>
              setForm({ ...form, nom: e.target.value })
            }
            placeholder="Nom complet"
            className="w-full p-3 border rounded-xl mt-3"
          />

          <input
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            placeholder="Téléphone WhatsApp"
            className="w-full p-3 border rounded-xl mt-2"
          />

          <input
            value={form.ville}
            onChange={(e) =>
              setForm({ ...form, ville: e.target.value })
            }
            placeholder="Ville"
            className="w-full p-3 border rounded-xl mt-2"
          />

          <input
            value={form.adresse}
            onChange={(e) =>
              setForm({ ...form, adresse: e.target.value })
            }
            placeholder="Quartier / Adresse"
            className="w-full p-3 border rounded-xl mt-2"
          />

          <p className="font-bold text-sm mt-4">
            MODE DE PAIEMENT
          </p>

          <select
            value={paiement}
            onChange={(e) =>
              setPaiement(e.target.value as ModePaiement)
            }
            className="w-full p-3 border rounded-xl mt-2 bg-white"
          >
            <option value="livraison">
              Paiement à la livraison
            </option>

            <option value="orange_money">
              Orange Money
            </option>

            <option value="moov_money">
              Moov Money
            </option>
          </select>

          {message && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mt-3">
              {message}
            </p>
          )}

          <button
            onClick={commander}
            disabled={loading || !user}
            className="w-full bg-orange-500 text-white py-4 rounded-full font-black mt-4 disabled:opacity-50"
          >
            {loading
              ? "Enregistrement..."
              : "CONFIRMER MA COMMANDE"}
          </button>
        </div>
      </div>
    </div>
  );
}