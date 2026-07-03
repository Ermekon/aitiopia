// BEFORE: no guard — a future accidental 'use client' import would pull the full
// Supabase SDK (gotrue 2.8MB, realtime 908KB, storage 980KB) into the browser bundle.
// AFTER:  import 'server-only' causes an immediate build error if this module is ever
// imported from a Client Component, making the boundary impossible to violate silently.
import 'server-only'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
