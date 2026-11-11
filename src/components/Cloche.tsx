"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export default function Cloche() {
  const { user } = useAuth();
  const [n, setN] = useState(0);

  const maj = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("lu", false);
    setN(count ?? 0);
  }, [user]);

  useEffect(() => {
    maj();
    const t = setInterval(maj, 30000);
    window.addEventListener("focus", maj);
    return () => { clearInterval(t); window.removeEventListener("focus", maj); };
  }, [maj]);

  return (
    <Link href="/notifications" aria-label={`Notifications${n ? ` (${n} non lues)` : ""}`} className="relative rounded-full bg-white px-3 py-2 shadow">
      🔔
      {n > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white">{n > 9 ? "9+" : n}</span>}
    </Link>
  );
}
