import {fileURLToPath} from "node:url"
import { defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig(({command, mode}) => {
    const env = loadEnv(mode, process.cwd(), '');
    console.log(env.VITE_APP_API_BASE)
  return {
    plugins: [vue(), vueJsx()],
    minify: true,
    server: {
      proxy: {
        '^/events': {
          target: env.VITE_APP_API_BASE,
          ws: true,
          changeOrigin: true
        },
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL('src', import.meta.url))
      }
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`
        }
      }
    }
  }
})
