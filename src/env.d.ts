/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // başka VITE_ değişkenlerin varsa buraya ekle
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
