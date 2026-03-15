import { createBrowserClient as createBrowser } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export function createBrowserClient(): ReturnType<typeof createBrowser> {
  return createBrowser(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createServerClient(): ReturnType<typeof createClient> {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
