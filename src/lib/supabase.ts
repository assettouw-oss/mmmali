import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL="https://zhxvodaemgmwmohrafpf.supabase.co";
const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigure = Boolean(url && cle);

const client = supabaseConfigure
  ? createClient(url!, cle!)
  : null;

export const supabase = (
  client ??
  new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(
        "Supabase n'est pas configuré. Vérifie les variables de .env.local."
      );
    }
  })
) as SupabaseClient;