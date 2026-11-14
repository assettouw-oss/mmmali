// 🚀 MM Mali Rapide comme TikTok : on montre le cache tout de suite, on met à jour après

export function lireCache(cle: string, minutes = 10) {
  try {
    const raw = localStorage.getItem(cle);
    if (!raw) return null;
    const { data, time } = JSON.parse(raw);
    if (Date.now() - time > minutes * 60 * 1000) return null;
    return data;
  } catch { return null; }
}

export function sauverCache(cle: string, data: any) {
  try { localStorage.setItem(cle, JSON.stringify({ data, time: Date.now() })); } catch {}
}

// On pré-charge la page suivante pendant que tu regardes celle-ci
export function precharger(url: string) {
  try { fetch(url, { method: "GET" }).catch(() => {}); } catch {}
}