"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigure } from "@/lib/supabase";

export type Profil = {
  id: string;
  nom: string;
  telephone: string | null;
  ville: string | null;
  role: "client" | "vendeur" | "admin";
};

type Auth = {
  user: User | null;
  profil: Profil | null;
  chargement: boolean;
  configure: boolean;
  deconnexion: () => Promise<void>;
  rafraichir: () => Promise<void>;
};

const Ctx = createContext<Auth>({
  user: null, profil: null, chargement: true, configure: false,
  deconnexion: async () => {}, rafraichir: async () => {},
});

export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [chargement, setChargement] = useState(true);

  const chargerProfil = useCallback(async (uid: string | undefined) => {
    if (!uid) { setProfil(null); return; }
    const { data } = await supabase
      .from("profiles").select("id, nom, telephone, ville, role").eq("id", uid).maybeSingle();
    setProfil((data as Profil) ?? null);
  }, []);

  useEffect(() => {
    if (!supabaseConfigure) { setChargement(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      chargerProfil(data.session?.user.id).finally(() => setChargement(false));
    });
    const { data: ecoute } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      // setTimeout évite un blocage connu quand on appelle Supabase dans ce rappel
      setTimeout(() => chargerProfil(s?.user.id), 0);
    });
    return () => ecoute.subscription.unsubscribe();
  }, [chargerProfil]);

  const deconnexion = useCallback(async () => {
    await supabase.auth.signOut();
    setProfil(null);
  }, []);

  const rafraichir = useCallback(() => chargerProfil(session?.user.id), [chargerProfil, session]);

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, profil, chargement, configure: supabaseConfigure, deconnexion, rafraichir }}>
      {children}
    </Ctx.Provider>
  );
}
