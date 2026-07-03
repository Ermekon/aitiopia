// Service-role client — bypasses RLS. Server code only: the curate page and
// its server actions. Never import from a Client Component ('server-only'
// makes that a build error, same guard as lib/supabase.ts).
import 'server-only'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
