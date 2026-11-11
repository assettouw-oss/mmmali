import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vrai quand .env.local est rempli. Sinon l'application continue de fonctionner en mode local.
export const supabaseConfigure = Boolean(url && cle);

export const supabase = createClient(url ?? "http://localhost:54321", cle ?? "cle-non-configuree");
