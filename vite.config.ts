import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// Nitro's dev middleware treats any request with `Sec-Fetch-Dest: image`
// (or video/audio/font/etc.) as a static-asset lookup and short-circuits
// route matching, so `<img src="/api/assets/…">` 404s in dev even though
// the endpoint exists. Strip the header for our API routes so those
// requests reach the real handler.
function stripSecFetchDestForApi(): Plugin {
  return {
    name: 'strip-sec-fetch-dest-for-api',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/api/')) {
          delete req.headers['sec-fetch-dest']
        }
        next()
      })
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    stripSecFetchDestForApi(),
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
