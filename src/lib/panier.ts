export type PanierItem = {
  id: string;
  titre: string;
  prix: number;
  image_url: string;
  quantite: number;
  vendeur_id: string;
};

type ProduitPourPanier = {
  id?: string;
  nom?: string;
  titre?: string;
  prix?: number | string;
  image_url?: string | null;
  vendeur_id?: string;
};

const KEY = "mmmali_panier_v2";

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

function estPanierItem(valeur: unknown): valeur is PanierItem {
  if (!estObjet(valeur)) return false;

  return (
    typeof valeur.id === "string" &&
    valeur.id.trim().length > 0 &&
    typeof valeur.titre === "string" &&
    valeur.titre.trim().length > 0 &&
    typeof valeur.prix === "number" &&
    Number.isFinite(valeur.prix) &&
    valeur.prix >= 0 &&
    typeof valeur.image_url === "string" &&
    typeof valeur.quantite === "number" &&
    Number.isInteger(valeur.quantite) &&
    valeur.quantite > 0 &&
    typeof valeur.vendeur_id === "string" &&
    valeur.vendeur_id.trim().length > 0
  );
}

const notifier = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("panier_updated"));
  }
};

// Récupérer le panier
export function getPanier(): PanierItem[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(KEY);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(estPanierItem);
  } catch {
    return [];
  }
}

// Sauvegarder le panier
function sauvegarder(panier: PanierItem[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(KEY, JSON.stringify(panier));
    notifier();
  } catch (error) {
    console.error("Impossible de sauvegarder le panier :", error);
    throw new Error("La sauvegarde du panier a échoué.");
  }
}

// Ajouter un produit
export function ajouterAuPanier(produit: ProduitPourPanier): PanierItem[] {
  if (typeof window === "undefined") return [];

  const id = produit.id?.trim();
  const titre = (produit.nom || produit.titre)?.trim();
  const prix = Number(produit.prix);
  const vendeur_id = produit.vendeur_id?.trim();
  const image_url = produit.image_url ?? "";

  if (!id || !titre || !vendeur_id) {
    throw new Error(
      "Produit incomplet : identifiant, nom ou vendeur manquant."
    );
  }

  if (!Number.isFinite(prix) || prix < 0) {
    throw new Error("Prix du produit invalide.");
  }

  if (typeof image_url !== "string") {
    throw new Error("Image du produit invalide.");
  }

  const panier = getPanier();
  const existe = panier.find((p) => p.id === id);

  if (existe) {
    existe.quantite += 1;
  } else {
    panier.push({
      id,
      titre,
      prix,
      image_url,
      quantite: 1,
      vendeur_id,
    });
  }

  sauvegarder(panier);

  return panier;
}

// Modifier la quantité
export function modifierQuantite(
  id: string,
  quantite: number
): PanierItem[] {
  if (!Number.isFinite(quantite)) {
    throw new Error("Quantité invalide.");
  }

  const panier = getPanier();

  const nouveauPanier = panier.map((p) =>
    p.id === id
      ? { ...p, quantite: Math.max(1, Math.floor(quantite)) }
      : p
  );

  sauvegarder(nouveauPanier);

  return nouveauPanier;
}

// Supprimer un produit
export function supprimerDuPanier(id: string): PanierItem[] {
  const panier = getPanier().filter((p) => p.id !== id);

  sauvegarder(panier);

  return panier;
}

// Vider le panier
export function viderPanier(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(KEY);
  notifier();
}

// Calculer le sous-total
export function calculerTotal(panier: PanierItem[]): number {
  return panier.reduce(
    (total, produit) => total + produit.prix * produit.quantite,
    0
  );
}

// Compter les articles
export function compterArticles(panier: PanierItem[]): number {
  return panier.reduce(
    (total, produit) => total + produit.quantite,
    0
  );
}