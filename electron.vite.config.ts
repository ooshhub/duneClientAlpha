import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    build: {
      outDir: './clientBuild/main',
      rollupOptions: {
        external: ['@electron-toolkit/utils']
      },
      lib: {
        entry: './src/main.ts'
      }
    }
  },
  preload: {
    build: {
      outDir: './clientBuild/preload',
      rollupOptions: {
        external: ['@electron-toolkit/preload']
      },
      lib: {
        entry: './src/preload/index.ts'
      }
    }
  },
  renderer: {
    build: {
      rollupOptions: {
        input: './src/renderer/index.html',
      },
      outDir: '../../clientBuild/renderer',
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/')
      }
    },
    plugins: [vue()]
  }
})
