"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

// Barre du bas, uniquement sur téléphone : accès direct aux pages principales.
export default function BarreNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, configure } = useAuth();
  if (!configure || pathname === "/connexion") return null;

  const lien = (href: string, libelle: string, icone: string) => (
    <Link key={libelle} href={href} aria-current={pathname === href ? "page" : undefined}
      className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${pathname === href ? "text-black" : "text-black/50"}`}>
      <span className="text-xl" aria-hidden>{icone}</span>{libelle}
    </Link>
  );

  function vendre() {
    if (!user) return router.push("/connexion");
    if (pathname === "/") window.dispatchEvent(new CustomEvent("mmmali:vue", { detail: "vendre" }));
    else router.push("/?vendre=1");
  }

  return (
    <nav aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end">
        {lien("/", "Boutique", "🏠")}
        {lien(user ? "/messages" : "/connexion", "Messages", "💬")}
        <button onClick={vendre} aria-label="Vendre un produit" className="flex flex-col items-center gap-0.5 pb-2 text-[11px] font-bold">
          <span className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-black text-2xl text-white shadow-lg" aria-hidden>+</span>Vendre
        </button>
        {lien(user ? "/commandes" : "/connexion", "Commandes", "📦")}
        {lien(user ? "/compte" : "/connexion", user ? "Compte" : "Connexion", "👤")}
      </div>
    </nav>
  );
}
