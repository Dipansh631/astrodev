import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; worker-src 'self' blob:; connect-src 'self' ws: wss: blob: data: https://www.gstatic.com https://raw.githack.com https://raw.githubusercontent.com https://zcrqbyszzadtdghcxpvl.supabase.co https://*.supabase.co https://accounts.google.com; img-src 'self' blob: data: https://lh3.googleusercontent.com https://zcrqbyszzadtdghcxpvl.supabase.co https://*.supabase.co; frame-src 'self' https://accounts.google.com https://zcrqbyszzadtdghcxpvl.supabase.co; object-src 'none';",
    },
  },
})

