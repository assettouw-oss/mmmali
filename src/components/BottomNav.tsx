"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const path = usePathname();
  const items = [
    { href: "/", label: "Accueil", icon: "🏠" },
    { href: "/messagerie", label: "Messagerie", icon: "💬" },
    { href: "/panier", label: "Panier", icon: "🛒" },
    { href: "/reels", label: "Reels", icon: "🎬" },
    { href: "/compte", label: "Compte", icon: "👤" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t flex justify-around items-center pt-2 pb-3 px-1">
        {items.map((it) => {
          const isActive = path === it.href;
          return (
            <Link key={it.href} href={it.href} className="flex flex-col items-center min-w-[56px]">
              <span className="text-[22px]">{it.icon}</span>
              <span className={`text-[10px] mt-1 ${isActive ? "font-black text-[#FF6B35]" : "text-gray-400"}`}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}