export const STATUTS: Record<string, string> = {
  nouvelle: "Nouvelle", confirmee: "Confirmée", expediee: "Expédiée", livree: "Livrée", annulee: "Annulée",
};
export const COULEURS: Record<string, string> = {
  nouvelle: "bg-amber-100", confirmee: "bg-blue-100", expediee: "bg-purple-100", livree: "bg-green-100", annulee: "bg-red-100",
};
export const PAIEMENTS: Record<string, string> = {
  livraison: "À la livraison", orange_money: "Orange Money", moov_money: "Moov Money",
};
export const ETAPES = ["nouvelle", "confirmee", "expediee", "livree"];

export const fcfa = (n: number) => n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ") + " FCFA";
export const dateFr = (s: string) => new Date(s).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
export const lienWhatsApp = (tel: string, texte: string) => {
  let t = tel.replace(/\D/g, ""); if (t.length === 8) t = "223" + t;
  return `https://wa.me/${t}?text=${encodeURIComponent(texte)}`;
};
