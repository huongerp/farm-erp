import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase chưa được cấu hình. Vui lòng tạo file .env (copy từ .env.example) và điền VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (lấy từ Supabase Dashboard → Settings → API).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
