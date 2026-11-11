"use client";
import { useRouter, usePathname } from "next/navigation";

export default function BottomNav() {
  const router = useRouter();
  const path = usePathname();

  const items = [
    { label: "Accueil", icon: "🏠", route: "/" },
    { label: "Messagerie", icon: "💬", route: "/messagerie" },
    { label: "Panier", icon: "🛒", route: "/panier" },
    { label: "Reels", icon: "🎬", route: "/reels" },
    { label: "Compte", icon: "👤", route: "/compte" },
  ];

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 430,
      background: "white",
      borderTop: "1px solid #eee",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "10px 0 calc(10px + env(safe-area-inset-bottom))",
      paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
      zIndex: 9999,
    }}>
      {items.map((item) => {
        const active = path === item.route;
        return (
          <button
            key={item.label}
            onClick={() => router.push(item.route)}
            style={{
              background: "none", border: "none",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, cursor: "pointer", flex: 1,
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{
              fontSize: 12, fontWeight: active ? 900 : 500,
              color: active ? "#FF6B35" : "#888",
            }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}