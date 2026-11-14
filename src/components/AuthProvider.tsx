"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

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
  user: null,
  profil: null,
  chargement: true,
  configure: false,
  deconnexion: async () => {},
  rafraichir: async () => {}
});

export const useAuth = () => useContext(Ctx);

export default function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [chargement, setChargement] = useState(true);

  const versionProfil = useRef(0);

  const chargerProfil = useCallback(async (uid?: string) => {
    const version = ++versionProfil.current;

    if (!uid || !supabaseConfigure) {
      setProfil(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nom, telephone, ville, role")
        .eq("id", uid)
        .maybeSingle();

      if (error) throw error;

      if (version !== versionProfil.current) return;

      setProfil((data as Profil | null) ?? null);
    } catch (error) {
      console.error("Erreur de chargement du profil :", error);

      if (version === versionProfil.current) {
        setProfil(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigure) {
      setChargement(false);
      return;
    }

    let actif = true;
    let evenementAuthRecu = false;

    const { data: ecoute } = supabase.auth.onAuthStateChange(
      (_event, nouvelleSession) => {
        evenementAuthRecu = true;
        setSession(nouvelleSession);

        window.setTimeout(() => {
          if (actif) {
            void chargerProfil(nouvelleSession?.user.id);
          }
        }, 0);
      }
    );

    async function initialiser() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (!actif) return;

        // Ne pas écraser une session plus récente reçue par l'écouteur.
        if (!evenementAuthRecu) {
          setSession(data.session);
          await chargerProfil(data.session?.user.id);
        }
      } catch (error) {
        console.error("Erreur d'initialisation de la session :", error);

        if (actif) {
          setSession(null);
          setProfil(null);
        }
      } finally {
        if (actif) setChargement(false);
      }
    }

    void initialiser();

    return () => {
      actif = false;
      versionProfil.current++;
      ecoute.subscription.unsubscribe();
    };
  }, [chargerProfil]);

  const deconnexion = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setSession(null);
    setProfil(null);
  }, []);

  const rafraichir = useCallback(async () => {
    await chargerProfil(session?.user.id);
  }, [chargerProfil, session?.user.id]);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        profil,
        chargement,
        configure: supabaseConfigure,
        deconnexion,
        rafraichir
      }}
    >
      {children}
    </Ctx.Provider>
  );
}