import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// Force tldraw's license check to think we're in development so it doesn't
// hide the editor in production. Enable by setting TLDRAW_FORCE_DEV=true
// at build time. Remove this and pass licenseKey to <Tldraw> once we have
// a real key. Side effect: React also runs in dev mode (larger bundle,
// dev warnings, no prod optimizations).
const FORCE_DEV = process.env.TLDRAW_FORCE_DEV === 'true'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  define: FORCE_DEV
    ? { 'process.env.NODE_ENV': JSON.stringify('development') }
    : {},
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
