"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPanier,
  viderPanier,
  type PanierItem,
} from "@/lib/panier";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CommandePage() {
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    nom: "",
    phone: "",
    ville: "Bamako",
    adresse: "",
  });
  const [paiement, setPaiement] = useState(
    "Paiement à la livraison"
  );
  const [loading, setLoading] = useState(false);
  const [messageErreur, setMessageErreur] = useState("");

  useEffect(() => {
    async function charger() {
      setPanier(getPanier());

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setUser(null);
        return;
      }

      setUser(data.user);

      const { data: profil } = await supabase
        .from("profiles")
        .select("full_name, phone, whatsapp, ville, quartier")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profil) {
        setForm({
          nom: profil.full_name || "",
          phone: profil.phone || profil.whatsapp || "",
          ville: profil.ville || "Bamako",
          adresse: profil.quartier || "",
        });
      }
    }

    charger();
  }, []);

  const total = panier.reduce(
    (s, p) => s + p.prix * p.quantite,
    0
  );

  async function commander() {
    setMessageErreur("");

    if (!user) {
      setMessageErreur(
        "Connecte-toi à ton compte avant de commander."
      );
      return;
    }

    if (panier.length === 0) {
      setMessageErreur("Ton panier est vide.");
      return;
    }

    if (!form.nom.trim() || !form.phone.trim()) {
      setMessageErreur(
        "Le nom et le téléphone sont obligatoires."
      );
      return;
    }

    if (!form.ville.trim() || !form.adresse.trim()) {
      setMessageErreur(
        "Renseigne ta ville et ton quartier."
      );
      return;
    }

    setLoading(true);

    try {
      const articles = panier.map((p) => ({
        product_id: p.id,
        quantite: p.quantite,
      }));

     const { data: orderId, error } = await supabase.rpc(
  "creer_commande_mmmali",
  {
    p_nom: form.nom.trim(),
    p_telephone: form.phone.trim(),
    p_adresse: `${form.ville.trim()} - ${form.adresse.trim()}`,
    p_paiement: paiement,
    p_items: articles,
  }
);

console.log("ID COMMANDE :", orderId);
console.log("ERREUR SUPABASE :", error);

if (error) {
  throw error;
}

if (!orderId) {
  throw new Error("La commande n'a pas été enregistrée.");
}
      // Vider le panier uniquement après confirmation de Supabase
      viderPanier();
      setPanier([]);

      alert(
        `Commande enregistrée avec succès !\nNuméro : ${orderId}`
      );

      window.location.href = "/";

    } catch (error: any) {
      console.error("Erreur commande :", error);

      setMessageErreur(
        error.message || "Impossible d'enregistrer la commande."
      );
    } finally {
      setLoading(false);
    }
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
            {panier.map((p) => (
              <div
                key={p.id}
                className="flex gap-3 border-b pb-3 last:border-0"
              >
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.titre}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                )}

                <div className="flex-1">
                  <p className="font-bold text-sm">
                    {p.titre}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.quantite} × {p.prix.toLocaleString()} FCFA
                  </p>
                </div>

                <p className="font-black text-sm text-orange-600">
                  {(p.prix * p.quantite).toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-black text-lg mt-3 pt-3 border-t">
            <span>Total</span>
            <span className="text-orange-600">
              {total.toLocaleString()} FCFA
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
            onChange={(e) => setPaiement(e.target.value)}
            className="w-full p-3 border rounded-xl mt-2 bg-white"
          >
            <option value="Paiement à la livraison">
              Paiement à la livraison
            </option>
            <option value="Orange Money">Orange Money</option>
            <option value="Moov Money">Moov Money</option>
            <option value="Wave">Wave</option>
          </select>

          {messageErreur && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mt-3">
              {messageErreur}
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