import { createClient } from '@supabase/supabase-js';

// Pobieramy bezpiecznie klucze z pliku .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Tworzymy i eksportujemy głównego "klienta" do obsługi dysku
export const supabase = createClient(supabaseUrl, supabaseKey);