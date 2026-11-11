export type PanierItem = {
  id: string;
  titre: string;
  prix: number;
  image_url: string;
  quantite: number;
  vendeur_id: string;
};

const KEY = "mmmali_panier_v2";

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

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (p: any) =>
        p.id &&
        p.titre &&
        Number.isFinite(Number(p.prix)) &&
        Number.isInteger(Number(p.quantite)) &&
        Number(p.quantite) > 0 &&
        p.vendeur_id
    );
  } catch {
    return [];
  }
}

// Sauvegarder le panier
function sauvegarder(panier: PanierItem[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(KEY, JSON.stringify(panier));
  notifier();
}

// Ajouter un produit
export function ajouterAuPanier(produit: any): PanierItem[] {
  if (typeof window === "undefined") return [];

  const id = produit.id;
  const titre = produit.nom || produit.titre;
  const prix = Number(produit.prix);
  const vendeur_id = produit.vendeur_id;

  if (!id || !titre || !vendeur_id) {
    throw new Error(
      "Produit incomplet : identifiant, nom ou vendeur manquant."
    );
  }

  if (!Number.isFinite(prix) || prix < 0) {
    throw new Error("Prix du produit invalide.");
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
      image_url: produit.image_url || "",
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
    (total, produit) =>
      total + produit.prix * produit.quantite,
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