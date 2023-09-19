import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log(env.VITE_APP_API_BASE);
  return {
    plugins: [vue(), vueJsx()],
    minify: true,
    base: '/',
    server: {
      proxy: {
        '/events': {
          // target: env.VITE_APP_API_BASE,
          target:
            'https://ftvt7d5clg.execute-api.eu-west-3.amazonaws.com/production',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/calendar/[name].js`,
          chunkFileNames: `assets/calendar/[name].js`,
          assetFileNames: `assets/calendar/[name].[ext]`,
        },
      },
    },
  };
});
