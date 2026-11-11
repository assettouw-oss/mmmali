import "./globals.css";
import BottomNav from "./BottomNav";
export const metadata = { title: "MM Mali", description: "Bienvenue chez MM Mali", manifest: "/manifest.json", themeColor: "#FF6B35" };
export const viewport = { width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover", themeColor: "#FF6B35" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr"><body style={{ margin: 0, background: "#E5E5E5" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", background: "#FFF9F5", minHeight: "100vh", position: "relative", boxShadow: "0 0 20px rgba(0,0,0,0.1)", paddingBottom: 80 }}>
        {children}<BottomNav />
      </div>
    </body></html>
  );
}