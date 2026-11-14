"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET_IMAGES = "produits";
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

type ProfilVendeur = {
  nom: string | null;
  telephone: string | null;
  ville: string | null;
  role: string | null;
};

type Produit = {
  id: string;
  vendeur_id: string;
  nom: string;
  description: string | null;
  prix: number;
  categorie: string;
  etat: string | null;
  vendeur_nom: string | null;
  ville: string | null;
  contact_whatsapp: string | null;
  statut: string;
  created_at: string;
};

type ImageProduit = {
  product_id: string;
  chemin: string;
  position: number;
};

type Publication = Produit & {
  imageUrl: string;
  imagePath: string;
};

type FormulaireProduit = {
  nom: string;
  prix: string;
  categorie: string;
  ville: string;
  description: string;
};

const FORM_INITIAL: FormulaireProduit = {
  nom: "",
  prix: "",
  categorie: "electronique",
  ville: "Bamako",
  description: "",
};

const CATEGORIES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "electronique", label: "Électronique" },
  { value: "sports", label: "Sports" },
  { value: "cosmetique", label: "Cosmétique" },
  { value: "mode", label: "Mode" },
  { value: "maison", label: "Maison" },
  { value: "livres", label: "Livres" },
  { value: "alimentation", label: "Alimentation" },
  { value: "artisanat", label: "Artisanat" },
];

export default function PublicationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [produits, setProduits] = useState<Publication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Publication | null>(null);
  const [form, setForm] = useState<FormulaireProduit>(FORM_INITIAL);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async (id: string) => {
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(
        "id, vendeur_id, nom, description, prix, categorie, etat, vendeur_nom, ville, contact_whatsapp, statut, created_at"
      )
      .eq("vendeur_id", id)
      .order("created_at", { ascending: false });

    if (productError) throw productError;

    const rows = (productData ?? []) as Produit[];

    if (rows.length === 0) {
      setProduits([]);
      return;
    }

    const ids = rows.map((product) => product.id);

    const { data: imageData, error: imageError } = await supabase
      .from("product_images")
      .select("product_id, chemin, position")
      .in("product_id", ids)
      .order("position", { ascending: false });

    if (imageError) throw imageError;

    const images = (imageData ?? []) as ImageProduit[];
    const imageByProduct = new Map<string, ImageProduit>();

    for (const image of images) {
      if (!imageByProduct.has(image.product_id)) {
        imageByProduct.set(image.product_id, image);
      }
    }

    const publications: Publication[] = rows.map((product) => {
      const image = imageByProduct.get(product.id);

      const imageUrl = image
        ? image.chemin.startsWith("http")
          ? image.chemin
          : supabase.storage
              .from(BUCKET_IMAGES)
              .getPublicUrl(image.chemin).data.publicUrl
        : "";

      return {
        ...product,
        imageUrl,
        imagePath: image?.chemin ?? "",
      };
    });

    setProduits(publications);
  }, []);

  useEffect(() => {
    let actif = true;

    async function initialize() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!data.user) {
          window.location.assign("/connexion");
          return;
        }

        if (!actif) return;

        setUserId(data.user.id);
        await loadProducts(data.user.id);
      } catch (error) {
        console.error("Erreur chargement publications :", error);

        if (actif) {
          setMessage("Impossible de charger tes publications.");
        }
      } finally {
        if (actif) setLoading(false);
      }
    }

    void initialize();

    return () => {
      actif = false;
    };
  }, [loadProducts]);

  function resetForm() {
    setForm(FORM_INITIAL);
    setImageFile(null);
    setImagePreview("");
    setEditing(null);
  }

  function openNewForm() {
    resetForm();
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving || uploading) return;

    setShowForm(false);
    resetForm();
  }

  function selectImage(file: File | undefined) {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Choisis une image JPG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setMessage("La photo ne doit pas dépasser 2 Mo.");
      return;
    }

    setMessage("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File, id: string) {
    const extension = file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const path = `${id}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET_IMAGES)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    return path;
  }

  async function saveProduit() {
    if (!userId || saving || uploading) return;

    const nom = form.nom.trim();
    const prix = Number(form.prix);

    if (!nom || !form.prix || !Number.isFinite(prix) || prix <= 0) {
      setMessage("Saisis un nom et un prix valide.");
      return;
    }

    if (!imageFile && !editing?.imagePath) {
      setMessage("Une photo du produit est obligatoire.");
      return;
    }

    setSaving(true);
    setMessage("");

    let uploadedPath = "";

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("nom, telephone, ville, role")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const profile = profileData as ProfilVendeur | null;

      if (!profile) {
        throw new Error("Ton profil vendeur est introuvable.");
      }

      if (imageFile) {
        setUploading(true);
        uploadedPath = await uploadImage(imageFile, userId);
        setUploading(false);
      }

      const payload = {
        vendeur_id: userId,
        nom,
        prix,
        categorie: form.categorie,
        ville: form.ville,
        description: form.description.trim(),
        vendeur_nom: profile.nom ?? "",
        contact_whatsapp: profile.telephone ?? "",
        statut: "publie",
      };

      let productId = editing?.id;

      if (editing) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editing.id)
          .eq("vendeur_id", userId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        productId = data.id;
      }

      if (uploadedPath && productId) {
        const { error: imageError } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            chemin: uploadedPath,
            position: Date.now(),
          });

        if (imageError) throw imageError;
      }

      await loadProducts(userId);

      setShowForm(false);
      resetForm();
      setMessage(
        editing
          ? "Produit modifié avec succès."
          : "Produit publié avec succès."
      );
    } catch (error) {
      console.error("Erreur publication :", error);

      if (uploadedPath) {
        await supabase.storage
          .from(BUCKET_IMAGES)
          .remove([uploadedPath]);
      }

      setMessage(
        error instanceof Error
          ? `Erreur : ${error.message}`
          : "Une erreur est survenue pendant la publication."
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  function editProduit(product: Publication) {
    setEditing(product);

    setForm({
      nom: product.nom,
      prix: String(product.prix),
      categorie: product.categorie || "electronique",
      ville: product.ville || "Bamako",
      description: product.description || "",
    });

    setImageFile(null);
    setImagePreview(product.imageUrl);
    setMessage("");
    setShowForm(true);
  }

  async function supprimer(id: string) {
    if (!userId || deletingId) return;

    const product = produits.find((item) => item.id === id);

    if (!product) return;

    if (!window.confirm("Veux-tu vraiment supprimer ce produit ?")) {
      return;
    }

    setDeletingId(id);
    setMessage("");

    try {
      if (product.imagePath && !product.imagePath.startsWith("http")) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_IMAGES)
          .remove([product.imagePath]);

        if (storageError) throw storageError;
      }

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .eq("vendeur_id", userId);

      if (error) throw error;

      await loadProducts(userId);
      setMessage("Produit supprimé.");
    } catch (error) {
      console.error("Erreur suppression :", error);

      setMessage(
        error instanceof Error
          ? `Erreur : ${error.message}`
          : "Impossible de supprimer ce produit."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
        <p className="text-sm text-gray-500">Chargement des publications...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] pb-20">
      <header className="bg-white p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/compte"
            aria-label="Retour au compte"
            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
          >
            ←
          </Link>

          <h1 className="font-black">Mes publications</h1>
        </div>

        <button
          type="button"
          onClick={openNewForm}
          className="bg-black text-white px-4 py-2 rounded-full text-xs font-black"
        >
          + Publier
        </button>
      </header>

      <section className="max-w-5xl mx-auto p-3">
        <div className="bg-[#0a7a2e] text-white rounded-xl p-3 text-xs">
          Publie les photos de tes marchandises. Tes produits pourront
          apparaître dans le catalogue MM Mali.
        </div>

        {message && (
          <p role="status" className="mt-3 text-sm text-center text-gray-700">
            {message}
          </p>
        )}

        {produits.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center mt-4">
            <div className="text-5xl">📦</div>
            <p className="font-black mt-2">Aucune publication</p>
            <p className="text-xs text-gray-500">
              Ajoute ton premier produit au catalogue.
            </p>

            <button
              type="button"
              onClick={openNewForm}
              className="bg-black text-white px-6 py-3 rounded-full font-black mt-4 text-sm"
            >
              + Publier mon premier produit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {produits.map((product) => (
              <article
                key={product.id}
                className="bg-white border rounded-xl overflow-hidden"
              >
                <div className="relative h-[150px] bg-gray-100">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.nom}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-4xl">
                      📦
                    </div>
                  )}

                  <span className="absolute top-1 right-1 bg-black/70 text-white text-[9px] px-2 py-1 rounded">
                    {product.ville || "Mali"}
                  </span>
                </div>

                <div className="p-2">
                  <p className="text-xs font-bold line-clamp-2 min-h-8">
                    {product.nom}
                  </p>

                  <p className="text-sm font-black text-orange-600">
                    {Number(product.prix).toLocaleString("fr-FR")} FCFA
                  </p>

                  <p className="text-[10px] text-gray-500">
                    {product.categorie}
                  </p>

                  <div className="flex gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => editProduit(product)}
                      className="flex-1 bg-gray-100 py-2 rounded-full text-[10px] font-bold"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === product.id}
                      onClick={() => supprimer(product.id)}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-full text-[10px] font-bold disabled:opacity-50"
                    >
                      {deletingId === product.id ? "..." : "Supprimer"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <section className="bg-white w-full md:max-w-[460px] rounded-t-[24px] md:rounded-[24px] p-5 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center">
              <h2 className="font-black">
                {editing ? "Modifier le produit" : "Publier un produit"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving || uploading}
                aria-label="Fermer"
                className="w-8 h-8 bg-gray-100 rounded-full disabled:opacity-50"
              >
                X
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <label htmlFor="nom-produit" className="text-xs font-bold">
                  Nom du produit *
                </label>

                <input
                  id="nom-produit"
                  value={form.nom}
                  maxLength={150}
                  onChange={(e) =>
                    setForm({ ...form, nom: e.target.value })
                  }
                  placeholder="Ex : Téléphone"
                  className="w-full p-3 border rounded-xl text-sm mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prix-produit" className="text-xs font-bold">
                    Prix (FCFA) *
                  </label>

                  <input
                    id="prix-produit"
                    type="number"
                    min="1"
                    value={form.prix}
                    onChange={(e) =>
                      setForm({ ...form, prix: e.target.value })
                    }
                    placeholder="25000"
                    className="w-full p-3 border rounded-xl text-sm mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="categorie" className="text-xs font-bold">
                    Catégorie
                  </label>

                  <select
                    id="categorie"
                    value={form.categorie}
                    onChange={(e) =>
                      setForm({ ...form, categorie: e.target.value })
                    }
                    className="w-full p-3 border rounded-xl text-sm mt-1"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="ville-produit" className="text-xs font-bold">
                  Ville
                </label>

                <select
                  id="ville-produit"
                  value={form.ville}
                  onChange={(e) =>
                    setForm({ ...form, ville: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl text-sm mt-1"
                >
                  <option value="Bamako">Bamako</option>
                  <option value="Kayes">Kayes</option>
                  <option value="Sikasso">Sikasso</option>
                  <option value="Ségou">Ségou</option>
                  <option value="Mopti">Mopti</option>
                  <option value="Koutiala">Koutiala</option>
                </select>
              </div>

              <div>
                <label htmlFor="photo-produit" className="text-xs font-bold">
                  Photo du produit *
                </label>

                <div className="mt-1 border-2 border-dashed rounded-xl p-3 text-center">
                  {imagePreview ? (
                    <div className="relative w-full h-36">
                      <Image
                        src={imagePreview}
                        alt="Aperçu du produit"
                        fill
                        unoptimized
                        sizes="100vw"
                        className="object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Aucune photo</p>
                  )}

                  <label
                    htmlFor="photo-produit"
                    className="inline-block mt-2 bg-black text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer"
                  >
                    Choisir une photo 📸
                  </label>

                  <input
                    id="photo-produit"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => selectImage(e.target.files?.[0])}
                    className="hidden"
                  />

                  <p className="text-[10px] text-gray-400 mt-2">
                    JPG, PNG ou WebP — maximum 2 Mo.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description-produit"
                  className="text-xs font-bold"
                >
                  Description
                </label>

                <textarea
                  id="description-produit"
                  value={form.description}
                  maxLength={2000}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Détails, livraison, garantie..."
                  className="w-full p-3 border rounded-xl text-sm h-24 mt-1"
                />
              </div>

              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
                La publication de vidéos dans Reels sera ajoutée après la mise
                en place de son enregistrement dans Supabase.
              </div>

              <button
                type="button"
                onClick={saveProduit}
                disabled={saving || uploading}
                className="w-full bg-black text-white py-4 rounded-full font-black disabled:opacity-50"
              >
                {uploading
                  ? "Envoi de la photo..."
                  : saving
                    ? "Enregistrement..."
                    : editing
                      ? "Enregistrer les modifications"
                      : "Publier sur MM Mali →"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}