import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { VantResolver, ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import AutoImport from 'unplugin-auto-import/vite';

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver(), VantResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver(), VantResolver()],
    }),
  ],
  optimizeDeps: {
    include: ['vue', 'vue-router', '@vueuse/core'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vant-ui': ['vant'],
          'element-plus-ui': ['element-plus'],
        },
      },
    },
  },
});
