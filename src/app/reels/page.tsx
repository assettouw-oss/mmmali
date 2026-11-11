"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Reels() {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [indexActif, setIndexActif] = useState(0);
  const [sonActif, setSonActif] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    async function load() {
      try {
        // âœ… RAPIDE : On prend 8 seulement, et juste les colonnes qu'on a besoin, pas tout
        const { data, error } = await supabase.from("produits").select("id,titre,prix,mode_produit,categorie,whatsapp,description,image_url,video_url,created_at").order("created_at", { ascending: false }).limit(8);
        if (error) { setVideos([]); setChargement(false); return; }
        const liste = (data || []).filter((p: any) => p.video_url || p.image_url);
        setVideos(liste);
        setChargement(false);
      } catch (e: any) { setChargement(false); }
    }
    load();
  }, []);

  // âœ… RAPIDE + QUI JOUE : Quand tu glisses, on met en pause les autres, on joue celle que tu regardes
  // Avant toutes les vidÃ©os jouaient en mÃªme temps, c'est Ã§a qui faisait ramer. Maintenant 1 seule joue.
  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      if (i === indexActif) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [indexActif, videos]);

  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    const cardH = el.clientHeight * 0.82;
    const i = Math.round(el.scrollTop / cardH);
    if (i !== indexActif && i >= 0 && i < videos.length) setIndexActif(i);
  }

  if (chargement) {
    return (
      <div style={{ background: "#FFF9F5", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontWeight: 900 }}>â³ Chargement des Reels...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div style={{ background: "#FFF9F5", height: "100vh", padding: "20px", textAlign: "center" }}>
        <p style={{ fontWeight: 900, fontSize: 18, marginTop: 80 }}>ðŸŽ¬ Aucun Reel pour l'instant</p>
        <button onClick={() => router.push("/")} style={{ background: "#FF6B35", color: "white", border: "none", padding: "12px 20px", borderRadius: 999, fontWeight: 900, marginTop: 20 }}>â† Retour Accueil</button>
      </div>
    );
  }


  return (
    <div style={{ background: "#FFF9F5", height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px 6px", background: "white" }}>
        <p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>ðŸŽ¬ Reels <span style={{ color: "#FF6B35" }}>MM Mali</span></p>
        <button onClick={() => router.push("/")} style={{ background: "#FFF1E8", border: "none", padding: "7px 12px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>â† Accueil</button>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "#888", margin: "4px 0 2px" }}>{indexActif + 1} / {videos.length} â€¢ ðŸ‘† Glisse vers le haut pour la suivante</p>

      <div
        ref={containerRef}
        onScroll={onScroll}
        style={{
          flex: 1,
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          padding: "6px 12px 90px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {videos.map((v, i) => (
          <div
            key={v.id}
            style={{
              height: "78vh",
              minHeight: 460,
              maxHeight: 620,
              scrollSnapAlign: "start",
              background: "black",
              borderRadius: 18,
              overflow: "hidden",
              position: "relative",
              flexShrink: 0,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            }}
          >
            {/* âœ… COMME AVANT : TOUTES LES VIDÃ‰OS SONT LÃ€, PAS DE NOIR, PAS DE CACHE */}
            {v.video_url ? (
              <>
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  src={v.video_url}
                  autoPlay={i === indexActif}
                  muted={!sonActif}
                  loop
                  playsInline
                  preload="metadata"
                  poster={v.image_url || ""}
                  onClick={(e) => {
                    const vid = e.currentTarget;
                    if (!sonActif) {
                      setSonActif(true);
                      vid.muted = false;
                      vid.play();
                    } else {
                      if (vid.paused) vid.play();
                      else vid.pause();
                    }
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", background: "black" }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSonActif(!sonActif);
                  }}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    fontSize: 17,
                    zIndex: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {sonActif ? "ðŸ”Š" : "ðŸ”‡"}
                </button>
                {!sonActif && i === indexActif && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      background: "rgba(0,0,0,0.55)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: "bold",
                      padding: "8px 14px",
                      borderRadius: 999,
                      zIndex: 5,
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ðŸ‘† Clique sur la vidÃ©o pour le son
                  </div>
                )}
              </>
            ) : (
              // âœ… PHOTO COMME AVANT, AVEC LE PETIT ZOOM QUI BOUGE
              <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
                <img
                  src={v.image_url}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    animation: i === indexActif ? "zoomPhoto 6s ease-in-out infinite alternate" : "none",
                  }}
                />
                <style>{`@keyframes zoomPhoto { from { transform: scale(1); } to { transform: scale(1.08); } }`}</style>
              </div>
            )}

            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170, background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }} />

            <div style={{ position: "absolute", left: 10, right: 10, bottom: 52, color: "white" }}>
              <p style={{ fontWeight: 900, fontSize: 14, margin: 0, lineHeight: 1.2 }}>{v.titre || "Produit"}</p>
              <p style={{ color: "#FFB084", fontWeight: 900, fontSize: 13, margin: "3px 0" }}>{v.prix ? Number(v.prix).toLocaleString() + " F" : ""} â€¢ {v.mode_produit || v.categorie || ""}</p>
              <p style={{ fontSize: 11, color: "#7CFFB2", fontWeight: "bold", margin: 0 }}>ðŸ“± {v.whatsapp || ""}</p>
            </div>

            <button
              onClick={() => window.open("https://wa.me/223" + String(v.whatsapp || "").replace(/\s/g, ""), "_blank")}
              style={{ position: "absolute", left: 10, right: 10, bottom: 10, background: "#25D366", color: "white", border: "none", padding: "10px 0", borderRadius: 999, fontWeight: 900, fontSize: 12 }}
            >
              ðŸ’¬ Commander sur WhatsApp
            </button>

            <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "white", fontSize: 10, padding: "4px 8px", borderRadius: 999 }}>
              {v.video_url ? "â–¶ VidÃ©o" : "ðŸ–¼ï¸ Photo"}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
